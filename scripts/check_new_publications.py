#!/usr/bin/env python3
"""Check ORCID and Semantic Scholar for papers missing from publications.bib.

Appends bibtex stub entries for anything new. Stdlib-only (no extra deps) so
it can run in CI without an install step beyond Python itself.

Stub entries are deliberately minimal (title/author/year/doi/journal where
known) - always review the opened PR before merging, titles and author lists
sometimes need cleanup (e.g. a preprint title differs from its published
title, or a collaboration paper needs a collapsed author list).
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

ORCID_ID = "0000-0002-4146-1132"
SEMANTIC_SCHOLAR_AUTHOR_ID = "2397759299"
BIB_PATH = Path(__file__).resolve().parent.parent / "publications.bib"


def fetch_json(url: str, headers: dict[str, str]) -> dict:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def orcid_works() -> list[dict]:
    data = fetch_json(
        f"https://pub.orcid.org/v3.0/{ORCID_ID}/works",
        {"Accept": "application/json"},
    )
    works = []
    for group in data.get("group", []):
        summary = group["work-summary"][0]
        title = summary.get("title", {}).get("title", {}).get("value")
        year = summary.get("publication-date", {}).get("year", {}).get("value")
        doi = None
        for ext in group.get("external-ids", {}).get("external-id", []):
            if ext.get("external-id-type") == "doi":
                doi = ext.get("external-id-value")
        works.append({"title": title, "year": year, "doi": doi, "source": "orcid"})
    return works


def semantic_scholar_works() -> list[dict]:
    data = fetch_json(
        f"https://api.semanticscholar.org/graph/v1/author/{SEMANTIC_SCHOLAR_AUTHOR_ID}"
        "/papers?fields=title,year,externalIds,authors,venue&limit=100",
        {},
    )
    works = []
    for paper in data.get("data", []):
        ext = paper.get("externalIds") or {}
        works.append(
            {
                "title": paper.get("title"),
                "year": paper.get("year"),
                "doi": ext.get("DOI"),
                "arxiv": ext.get("ArXiv"),
                "authors": [a.get("name") for a in paper.get("authors", [])],
                "venue": paper.get("venue"),
                "source": "semanticscholar",
            }
        )
    return works


def existing_identifiers(bib_text: str) -> set[str]:
    ids = set()
    for m in re.finditer(r"(?i)\bdoi\s*=\s*\{([^}]+)\}", bib_text):
        ids.add(m.group(1).strip().lower().removeprefix("10.48550/arxiv."))
    for m in re.finditer(r"arxiv\.(\d{4}\.\d{4,5})", bib_text, re.I):
        ids.add(m.group(1))
    for m in re.finditer(r"arxiv:(\d{4}\.\d{4,5})", bib_text, re.I):
        ids.add(m.group(1))
    return ids


def to_bibtex_stub(work: dict, index: int) -> str:
    key = f"NEW_{work.get('year', 'unk')}_{index}"
    title = work.get("title", "Untitled")
    year = work.get("year", "")
    authors = work.get("authors")
    author_field = " and ".join(authors) if authors else "Vajpeyi, Avi"
    doi = work.get("doi")
    arxiv = work.get("arxiv")
    fields = [f'title={{{title}}}']
    if doi:
        fields.append(f"url={{http://dx.doi.org/{doi}}}")
        fields.append(f"DOI={{{doi}}}")
    if work.get("venue"):
        fields.append(f"journal={{{work['venue']}}}")
    fields.append(f"author={{{author_field}}}")
    fields.append(f"year={{{year}}}")
    if arxiv:
        fields.append(f'note={{arXiv:{arxiv}}}')
    return f" @article{{{key}, " + ", ".join(fields) + " }"


def main() -> int:
    bib_text = BIB_PATH.read_text()
    known = existing_identifiers(bib_text)

    try:
        candidates = orcid_works() + semantic_scholar_works()
    except Exception as e:  # network/parse failures shouldn't fail the workflow loudly
        print(f"::warning::Could not fetch publication feeds: {e}")
        return 0

    new_entries = []
    seen_this_run: set[str] = set()
    for work in candidates:
        ident = (work.get("doi") or "").lower().removeprefix("10.48550/arxiv.") or work.get("arxiv")
        if not ident or ident in known or ident in seen_this_run:
            continue
        seen_this_run.add(ident)
        new_entries.append(work)

    if not new_entries:
        print("No new publications found.")
        return 0

    stubs = [to_bibtex_stub(w, i) for i, w in enumerate(new_entries)]
    addition = "\n,\n".join(stubs)
    BIB_PATH.write_text(bib_text.rstrip() + "\n,\n" + addition + "\n")

    print(f"Added {len(new_entries)} candidate entries:")
    for w in new_entries:
        print(f" - {w.get('title')} ({w.get('source')})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
