import os, re, time, asyncio
from typing import Dict, List, Optional, Literal, Tuple
from collections import defaultdict, Counter, OrderedDict

import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from contextlib import asynccontextmanager

from backend.utils import normalize_title, cosine_similarity_titles, fuzzy_ratio, tokenize

# -------------------- Config --------------------
UPSTREAM_URL     = os.getenv("UPSTREAM_URL", "https://jsonplaceholder.typicode.com/posts")
UPSTREAM_TIMEOUT = float(os.getenv("UPSTREAM_TIMEOUT", "5"))      # seconds
CHUNK_LIMIT      = int(os.getenv("CHUNK_LIMIT", "50"))            # upstream _limit per page
SCAN_MAX         = int(os.getenv("SCAN_MAX", "100"))             # safety cap for scans

# local cache only
CACHE_TTL        = int(os.getenv("CACHE_TTL", "60"))              # seconds
MAX_CACHE_ITEMS  = int(os.getenv("MAX_CACHE_ITEMS", "500"))       # cap entries to bound memory

RATE_LIMIT       = os.getenv("RATE_LIMIT", "60/minute")                 # e.g., "60/minute" or "off"
ALLOW_ORIGINS    = [o for o in os.getenv("ALLOW_ORIGINS", "http://localhost:3000").split(",") if o]

# -------------------- Optional rate limiting with slowapi  --------------------
def _noop_decorator(_):
    def inner(func): return func
    return inner

try:
    if RATE_LIMIT != "off":
        from slowapi import Limiter
        from slowapi.util import get_remote_address
        from slowapi.errors import RateLimitExceeded
        from slowapi.middleware import SlowAPIMiddleware


        limiter = Limiter(key_func=get_remote_address, default_limits=[RATE_LIMIT])
        def rate_limit(limit_str: Optional[str]):
            return limiter.limit(limit_str) if limit_str else limiter.limit(RATE_LIMIT)
    else:
        limiter = None
        RateLimitExceeded = Exception
        rate_limit = _noop_decorator
except Exception:
    limiter = None
    RateLimitExceeded = Exception
    rate_limit = _noop_decorator

# -------------------- Local TTL + LRU-ish cache --------------------
# Stores: key -> { val, exp }. Uses OrderedDict for LRU eviction.
_mem_cache: "OrderedDict[str, Dict[str, float]]" = OrderedDict()

def _cache_get(k: str):
    entry = _mem_cache.get(k)
    if not entry:
        return None
    if entry["exp"] < time.time():
        _mem_cache.pop(k, None)
        return None
    # mark as recently used
    _mem_cache.move_to_end(k, last=True)
    return entry["val"]

def _cache_set(k: str, v, ttl: int):
    # insert/update
    _mem_cache[k] = {"val": v, "exp": time.time() + ttl}
    _mem_cache.move_to_end(k, last=True)
    # evict expired first (cheap pass)
    expired = [kk for kk, ee in _mem_cache.items() if ee["exp"] < time.time()]
    for kk in expired:
        _mem_cache.pop(kk, None)
    # hard cap eviction (LRU)
    while len(_mem_cache) > MAX_CACHE_ITEMS:
        _mem_cache.popitem(last=False)  # remove least-recently used

async def cache_get(key: str):
    return _cache_get(key)

async def cache_set(key: str, value, ttl: int):
    _cache_set(key, value, ttl)

# -------------------- App, CORS, shared HTTP client --------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # create ONE shared client for connection pooling
    app.state.client = httpx.AsyncClient(
        timeout=UPSTREAM_TIMEOUT,
        limits=httpx.Limits(max_keepalive_connections=20, max_connections=100),
        headers={"User-Agent": "posts-proxy/1.0"}
    )
    try:
        yield   # app runs here
    finally:
        # close cleanly on shutdown
        try:
            await app.state.client.aclose()
        except Exception:
            pass

app = FastAPI(
    title="Posts Proxy API",
    description="Proxies JSONPlaceholder /posts; adds analytics (/anomalies, /summary).",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

if limiter:
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)

    @app.exception_handler(RateLimitExceeded)
    async def _rate_exceeded(_: Request, __: RateLimitExceeded):
        return JSONResponse(status_code=429, content={"error": "Too many requests"})



# -------------------- HTTP helpers (retries/backoff) --------------------
async def get_with_retries(params: Dict, attempts=3) -> httpx.Response:
    delay = 0.2
    for i in range(attempts):
        try:
            r = await app.state.client.get(UPSTREAM_URL, params=params)
            r.raise_for_status()
            return r
        except (httpx.RequestError, httpx.HTTPStatusError):
            if i == attempts - 1:
                raise
            await asyncio.sleep(delay)
            delay *= 2

async def iter_pages(client_params: Dict, start: int, limit: int, max_records: int):
    """
    Iterate upstream in chunks using _start/_limit (JSONPlaceholder supports these).
    Stops when max_records reached or upstream returns empty.
    """
    fetched = 0
    while True:
        chunk = min(limit, max_records - fetched) if max_records else limit
        params = {"_start": start, "_limit": chunk, **client_params}
        resp = await get_with_retries(params)
        data = resp.json()
        if not data:
            break
        yield data, resp.headers
        fetched += len(data)
        start += len(data)
        if max_records and fetched >= max_records:
            break

async def fetch_posts_paged(user_id: Optional[int], offset: int, limit: int, scan_max: int) -> Tuple[List[Dict], Dict[str,str]]:
    """
    Fetch exactly [offset:offset+limit] by paging upstream (no blasting).
    """
    collected: List[Dict] = []
    headers_out: Dict[str, str] = {}
    target_end = offset + limit
    page_start = (offset // CHUNK_LIMIT) * CHUNK_LIMIT
    client_params = {"userId": user_id} if user_id is not None else {}

    async for page, headers in iter_pages(client_params, page_start, CHUNK_LIMIT, scan_max or 0):
        headers_out = headers
        for i, item in enumerate(page):
            idx = page_start + i
            if offset <= idx < target_end:
                collected.append(item)
            if len(collected) >= limit:
                return collected, headers_out
        page_start += len(page)

    return collected, headers_out

# -------------------- /posts: Fetch and return raw data --------------------
@app.get("/posts")
@rate_limit(limiter)  # uses global RATE_LIMIT if enabled; otherwise no-op
async def get_posts(
    request: Request,
    limit: int = Query(10, ge=1,  le=1000, description="How many items to return"),
    offset: int = Query(0,  ge=0,            description="Zero-based start index"),
    userId: Optional[int] = Query(None, ge=1, le=10,  description="Filter by userId (JSONPlaceholder has 1..10)"),
    cache: bool = Query(True, description="Enable small TTL cache for this slice"),
):
    cache_key = f"posts:{userId}:{offset}:{limit}"
    if cache:
        cached = await cache_get(cache_key)
        if cached is not None:
            return JSONResponse(content=cached)

    try:
        data, headers = await fetch_posts_paged(userId, offset, limit, SCAN_MAX)
        result = {
            "data": data,
            "meta": {"offset": offset, "limit": limit, "userId": userId, "source_total": headers.get("X-Total-Count")}
        }
        if cache:
            await cache_set(cache_key, result, CACHE_TTL)
        return JSONResponse(content=result, headers={"Cache-Control": f"public, max-age={CACHE_TTL}"})
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Upstream timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Upstream error: {e}")

# -------------------- /anomalies: short, duplicates, similar --------------------


async def scan_all_titles(max_scan: int) -> List[Dict]:
    out: List[Dict] = []
    async for page, _ in iter_pages({}, start=0, limit=CHUNK_LIMIT, max_records=max_scan):
        out.extend(page)
    return out

@app.get("/anomalies")
@rate_limit(limiter)
async def anomalies(
    request: Request,
    min_title_len: int = Query(15, ge=1),
    method: Literal["exact","fuzzy","cosine","embedding"] = Query("fuzzy"),
    similar_threshold: float = Query(0.4, ge=0.0, le=1.0),
    suspicious_threshold: int = Query(5, ge=1),
    max_scan: int = Query(SCAN_MAX, ge=1, description="Safety cap on total records scanned"),
    cache: bool = Query(True)
):
    cache_key = f"anoms:{min_title_len}:{method}:{similar_threshold}:{suspicious_threshold}:{max_scan}"
    if cache:
        cached = await cache_get(cache_key)
        if cached is not None:
            return cached

    posts = await scan_all_titles(max_scan)
    if not posts:
        return {"short_titles": [], "duplicate_titles": [], "suspicious_users": [], "meta": {"backend": method}}

    # 1 short titles
    short_titles = [p for p in posts if len(p["title"]) < min_title_len]

    # 2 duplicates by same user (normalized)
    user_title_norms = defaultdict(list)
    for p in posts:
        user_title_norms[p["userId"]].append(normalize_title(p["title"]))

    duplicate_titles = []
    for uid, titles in user_title_norms.items():
        counts = Counter(titles)
        for nt, c in counts.items():
            if c > 1:
                ids = [p["id"] for p in posts if p["userId"] == uid and normalize_title(p["title"]) == nt]
                raw_sample = next(p["title"] for p in posts if p["id"] == ids[0])
                duplicate_titles.append({"userId": uid, "title": raw_sample, "count": c, "postIds": ids})

    # 3 suspicious users via similarity grouping
    backend_used = method
    suspicious_users = []

    for uid in sorted({p["userId"] for p in posts}):
        items = [{"id": p["id"], "raw": p["title"], "norm": normalize_title(p["title"])} for p in posts if p["userId"] == uid]
        if len(items) < 2:
            continue

        groups = []
        if method == "exact":
            c = Counter(i["norm"] for i in items)
            for nt, n in c.items():
                if n >= 2:
                    ids = [i["id"] for i in items if i["norm"] == nt]
                    raw_sample = next(i["raw"] for i in items if i["norm"] == nt)
                    groups.append({"rep_title": raw_sample, "postIds": ids, "count": n})

        elif method == "fuzzy":
            for it in items:
                placed = False
                for g in groups:
                    if fuzzy_ratio(it["norm"], normalize_title(g["rep_title"])) >= similar_threshold:
                        g["postIds"].append(it["id"]); g["count"] += 1; placed = True; break
                if not placed:
                    groups.append({"rep_title": it["raw"], "postIds": [it["id"]], "count": 1})
            groups = [g for g in groups if g["count"] >= 2]

        elif method in ("cosine", "embedding"):
            titles = [i["norm"] for i in items]
            sim_matrix = None
            if method == "embedding":
                # try:
                #     from sentence_transformers import SentenceTransformer, util
                #     model = SentenceTransformer(os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2"))
                #     emb = model.encode(titles, convert_to_tensor=True, normalize_embeddings=True)
                #     sim_matrix = util.cos_sim(emb, emb).cpu().tolist()
                # except Exception:
                #     backend_used = "cosine"

                # this was too costly for deployment; fallback to cosine; big sad
                backend_used = "cosine"
            if sim_matrix is None:
                sim_matrix = cosine_similarity_titles(titles)

            n = len(items)
            assigned = [False]*n
            for i in range(n):
                if assigned[i]: continue
                group = [i]; assigned[i] = True
                for j in range(i+1, n):
                    if not assigned[j] and sim_matrix[i][j] >= similar_threshold:
                        group.append(j); assigned[j] = True
                if len(group) >= 2:
                    groups.append({
                        "rep_title": items[group[0]]["raw"],
                        "postIds": [items[k]["id"] for k in group],
                        "count": len(group)
                    })

        total_similar = sum(g["count"] for g in groups)
        if total_similar > suspicious_threshold:
            suspicious_users.append({
                "userId": uid,
                "total_similar_posts": total_similar,
                "groups": groups
            })

    out = {
        "short_titles": short_titles,
        "duplicate_titles": sorted(duplicate_titles, key=lambda x: (x["userId"], -x["count"])),
        "suspicious_users": sorted(suspicious_users, key=lambda x: -x["total_similar_posts"]),
        "meta": {"backend": backend_used, "similar_threshold": similar_threshold, "max_scan": max_scan}
    }
    if cache:
        await cache_set(cache_key, out, CACHE_TTL)
    return out


# -------------------- /summary: top users with unique words + global word freq --------------------


@app.get("/summary")
@rate_limit(limiter)
async def summary(
    request: Request,
    top_n_users: int = Query(3, ge=1, le=50),
    drop_stopwords: bool = Query(True),
    max_scan: int = Query(SCAN_MAX, ge=1),
    cache: bool = Query(True)
):
    cache_key = f"summary:{top_n_users}:{drop_stopwords}:{max_scan}"
    if cache:
        cached = await cache_get(cache_key)
        if cached is not None:
            return cached

    posts = await scan_all_titles(max_scan)

    user_words: Dict[int, set] = defaultdict(set)
    global_counts: Counter = Counter()

    for p in posts:
        words = tokenize(p["title"], drop_stops=drop_stopwords)
        global_counts.update(words)
        user_words[p["userId"]].update(words)

    ranked_users = sorted(
        [{"userId": u, "unique_word_count": len(ws)} for u, ws in user_words.items()],
        key=lambda x: -x["unique_word_count"]
    )[:top_n_users]

    top_words = [{"word": w, "count": c} for w, c in global_counts.most_common(20)]

    out = {"top_users_by_unique_words": ranked_users, "top_words": top_words, "meta": {"max_scan": max_scan}}
    if cache:
        await cache_set(cache_key, out, CACHE_TTL)
    return out



# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("api_handle2:app", host="0.0.0.0", port=8000, workers=2, reload=True)
