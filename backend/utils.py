import os, re, time, asyncio
from typing import Dict, List, Optional, Literal, Tuple

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from nltk.metrics import edit_distance


# -------------------- /anomalies: short, duplicates, similar --------------------
_space_re = re.compile(r"\s+")
_punct_re = re.compile(r"[^\w\s]")

def normalize_title(s: str) -> str:
    s = s.lower().strip()
    s = _punct_re.sub("", s)
    s = _space_re.sub(" ", s)
    return s

def fuzzy_ratio(a: str, b: str) -> float:
    import difflib
    return difflib.SequenceMatcher(None, a, b).ratio()

def cosine_similarity_titles(titles: List[str]) -> List[List[float]]:
    """
    Returns cosine similarity matrix; tries scikit-learn first,
    falls back to word-overlap cosine if unavailable.
    """
    try:
        vec = TfidfVectorizer(ngram_range=(1,2), min_df=1)
        X = vec.fit_transform(titles)
        sim = cosine_similarity(X)
        return sim.tolist()
    except Exception:
        def to_set(s): return set(s.split())
        sets = [to_set(t) for t in titles]
        mats = []
        for A in sets:
            row = []
            for B in sets:
                if not A and not B:
                    row.append(1.0); continue
                inter = len(A & B)
                denom = (len(A)*len(B)) ** 0.5 or 1.0
                row.append(inter/denom)
            mats.append(row)
        return mats

def levenshtein_sim(a: str, b: str) -> float:
    # normalized similarity in [0,1]
    if not a and not b:
        return 1.0
    d = edit_distance(a, b)  
    return 1.0 - (d / max(len(a), len(b)))






# -------------------- /summary: top users with unique words + global word freq --------------------
# STOPWORDS = set((
#     "the a an and or of in on at to for from with without is are was were be been being this that those these it its by as not no yes i you he she we they them their our your my"
# ).split())
# The above stopwords are English. Will keep them here for potential changes.
# Common Latin function words (conjunctions, particles, prepositions, pronouns, adverbs)
STOPWORDS = set("""
a ab abs ac ad adeo adhuc aliquis aliquid aliquo aliqua aliud alius alter altera alterum
an ante apud at atque aut autem
cum cur
de del deinde denique dum
e ed ex
enim ergo etiam et
haud hic haec hoc hinc huc
iam ibi idem igitur ille illa illud illum illam illis illos illas illorum illarum
in infra inter intra
is ea id eius ei eum eam eo eos eas iis
ita itaque iterum
iuxta
magis minus modo
nam ne nec neque nempe non nunc
ob omnino
per post prae praeter pro propter
quam quamquam quando quare quasi quem quemadmodum
qui quae quod quem quam quo quorum quarum quos quas quibus quibusdam
quia quidem quippe quis quid quisnam quidnam quisque quodque quicumque quidquid quisquis
quoque quoniam quodsi
sed seu sive sine solum tantum tamen tam tum tunc
ubi ubiubi ubique uel vel vero versus
ut uti utrum
viris
""".split())


_word_re = re.compile(r"[a-zA-Z0-9']+")

def tokenize(text: str, drop_stops: bool=True) -> List[str]:
    toks = [t.lower() for t in _word_re.findall(text)]
    return [t for t in toks if (t not in STOPWORDS)] if drop_stops else toks
