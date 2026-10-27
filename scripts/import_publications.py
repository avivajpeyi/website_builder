#!/usr/bin/env python3
"""Refresh bibliographic fields with Academic, retaining curated bundle content.

publications.bib is maintained; static/uploads/publications.bib is generated.
Existing slugs are resolved by citation key, DOI, arXiv ID, then title.
"""
from pathlib import Path
import re
import shutil
import tempfile

import bibtexparser
from academic.import_bibtex import import_bibtex
import yaml

ROOT = Path(__file__).resolve().parents[1]
FRONT = re.compile(r"\A---\n(.*?)\n---\n?(.*)\Z", re.S)


def read_page(path):
    match = FRONT.match(path.read_text())
    if not match:
        raise ValueError(f"Invalid front matter: {path}")
    return yaml.safe_load(match[1]) or {}, match[2]


def identities(entry):
    ids = {"key:" + entry["ID"].lower()}
    doi = entry.get("doi", "").lower().removeprefix("https://doi.org/")
    if doi:
        ids.add("doi:" + doi)
    arxiv = entry.get("eprint", "") or next(iter(re.findall(
        r"(?:arxiv[.:/ ]+|arxiv.org/(?:abs|pdf)/)(\d{4}\.\d{4,5})",
        " ".join(str(v) for v in entry.values()), re.I)), "")
    if arxiv:
        ids.add("arxiv:" + arxiv.split("v")[0])
    ids.add("title:" + re.sub(r"[^a-z0-9]", "", entry.get("title", "").lower()))
    return ids


def main():
    source = ROOT / "publications.bib"
    entries = bibtexparser.loads(source.read_text()).entries
    seen = {}
    for entry in entries:
        for identity in identities(entry):
            if identity in seen:
                raise ValueError(f"Duplicate {identity}: {seen[identity]}, {entry['ID']}")
            seen[identity] = entry["ID"]
    bundles = ROOT / "content/publication"
    existing = {}
    for citation in bundles.glob("*/cite.bib"):
        for entry in bibtexparser.loads(citation.read_text()).entries:
            for identity in identities(entry):
                if identity in existing and existing[identity] != citation.parent:
                    raise ValueError(f"Duplicate publication bundles: {identity}")
                existing[identity] = citation.parent
    with tempfile.TemporaryDirectory() as directory:
        staging = Path(directory)
        import_bibtex(str(source), str(staging), compact=True)
        for citation in sorted(staging.glob("*/cite.bib")):
            entry = bibtexparser.loads(citation.read_text()).entries[0]
            matches = {existing[i] for i in identities(entry) if i in existing}
            if len(matches) > 1:
                raise ValueError(f"Ambiguous bundle: {entry['ID']}")
            target = next(iter(matches), bundles / citation.parent.name)
            generated, _ = read_page(citation.parent / "index.md")
            page = target / "index.md"
            current, body = read_page(page) if page.exists() else ({}, "")
            # Only bibliographic fields are owned by the importer. Abstracts,
            # summaries, featured flags, images, custom links and prose survive.
            for key in ("title", "authors", "date", "publication_types", "publication"):
                if key in generated:
                    current[key] = generated[key]
            # Academic treats corporate authors as personal names; preserve the
            # collaboration names as written in BibTeX, in their source order.
            if entry.get("author", "").startswith("{"):
                current["authors"] = [a.strip().strip("{}") for a in entry["author"].split(" and ")]
            current.setdefault("publishDate", generated["date"])
            hugo = current.setdefault("hugoblox", {})
            ids = hugo.setdefault("ids", {})
            doi = entry.get("doi")
            if doi:
                ids["doi"] = doi
            current.pop("doi", None)
            arxiv = next((i.removeprefix("arxiv:") for i in identities(entry) if i.startswith("arxiv:")), None)
            links = [link for link in current.get("links", [])
                     if link.get("name", "").lower() not in ("arxiv", "doi", "url")]
            if arxiv:
                ids["arxiv"] = arxiv
            # HugoBlox builds DOI and preprint buttons from ids itself.
            automatic = {f"https://doi.org/{doi}", f"http://dx.doi.org/{doi}",
                         f"https://arxiv.org/abs/{arxiv}"}
            if entry.get("url") and entry["url"] not in automatic | {link["url"] for link in links}:
                links.append({"name": "URL", "url": entry["url"]})
            if links:
                current["links"] = links
            else:
                current.pop("links", None)
            if not ids:
                hugo.pop("ids", None)
            if not hugo:
                current.pop("hugoblox", None)
            target.mkdir(parents=True, exist_ok=True)
            page.write_text("---\n" + yaml.safe_dump(current, sort_keys=False, allow_unicode=True).rstrip()
                            + "\n---\n" + body)
            shutil.copyfile(citation, target / "cite.bib")
    download = ROOT / "static/uploads/publications.bib"
    download.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, download)
    print(f"Refreshed {len(entries)} publications; preserved existing slugs and custom content.")


if __name__ == "__main__":
    main()
