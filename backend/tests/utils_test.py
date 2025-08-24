# backend/tests/test_utils.py
import math
import pytest

# Ensure scikit-learn is present (utils imports it at module import time)
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


from backend.utils import (
    normalize_title,
    fuzzy_ratio,
    cosine_similarity_titles,
    tokenize,
)

def test_normalize_title_strips_punct_and_spaces():
    assert normalize_title("  Hello, WORLD!!!  ") == "hello world"
    assert normalize_title("Wouldn't") == "wouldnt"  # punctuation stripped

def test_fuzzy_ratio_symmetry_and_range():
    a = "lorem ipsum"
    b = "lorem  ipsum "
    r1 = fuzzy_ratio(a, b)
    r2 = fuzzy_ratio(b, a)
    assert 0.0 <= r1 <= 1.0
    assert math.isclose(r1, r2, rel_tol=1e-9)
    assert r1 > 0.9  # very similar

def test_cosine_similarity_titles_diagonal_and_ordering():
    titles = [
        "beatae enim quia vel",
        "beatae enim quia vel something",
        "completely different sentence",
    ]
    sim = cosine_similarity_titles(titles)
    n = len(titles)
    assert len(sim) == n and all(len(row) == n for row in sim)

    # diagonal ~ 1
    for i in range(n):
        assert 0.99 <= sim[i][i] <= 1.0001

    # similar pair > dissimilar pair
    assert sim[0][1] > sim[0][2]
    assert sim[1][0] > sim[1][2]

def test_tokenize_drops_stopwords_latin_set():
    # includes many Latin stopwords (e.g., et, in, ut)
    text = "Et in arcadia ego, ut lorem sit amet."
    toks_drop = tokenize(text, drop_stops=True)
    toks_keep = tokenize(text, drop_stops=False)

    assert "et" in toks_keep and "in" in toks_keep and "ut" in toks_keep
    assert "et" not in toks_drop and "in" not in toks_drop and "ut" not in toks_drop
    # content words still there
    assert "lorem" in toks_drop or "arcadia" in toks_drop

def test_levenshtein_sim_basics():
    from backend.utils import levenshtein_sim
    assert levenshtein_sim("kitten", "kitten") == 1.0

    val = levenshtein_sim("kitten", "sitting")
    assert 0.5 < val < 0.6
    # totally different single chars -> 0
    assert levenshtein_sim("a", "b") == 0.0
