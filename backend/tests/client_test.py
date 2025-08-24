from backend.api_handle import app
import httpx

from fastapi.testclient import TestClient

from backend.api_handle import app, UPSTREAM_URL


def test_posts_ok():
    with TestClient(app) as client:   # triggers lifespan startup/shutdown
        r = client.get("/posts?limit=5")
        assert r.status_code == 200




def test_upstream_request_error_502(monkeypatch):
    with TestClient(app) as client:
        async def raises_request_error(*args, **kwargs):
            raise httpx.RequestError("attempt to make it error", request=httpx.Request("GET", UPSTREAM_URL))

        monkeypatch.setattr(app.state.client, "get", raises_request_error, raising=True)

        r = client.get("/posts?limit=5&offset=0&cache=false")
        assert r.status_code == 502
        assert "Upstream error" in r.json()["detail"]


def test_upstream_request_error_502_with_retry_count(monkeypatch):
    calls = {"n": 0}
    async def errors_retries(*args, **kwargs):
        calls["n"] += 1
        raise httpx.RequestError("errors_retries", request=httpx.Request("GET", UPSTREAM_URL))

    with TestClient(app) as client:
        monkeypatch.setattr(app.state.client, "get", errors_retries, raising=True)
        r = client.get("/posts?limit=5&offset=0&cache=false")
        assert r.status_code == 502
        assert "Upstream error" in r.json()["detail"]
        assert calls["n"] >= 3  # default attempts=3 in get_with_retries


def test_cors_preflight_allows_origin():
    with TestClient(app) as client:
        r = client.options(
            "/posts",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert r.status_code in (200, 204)
        assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"
