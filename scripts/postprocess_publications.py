#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re

import yaml


FRONT_MATTER_RE = re.compile(r"^---\n(.*?)\n---\n(.*)$", re.S)


def rewrite_publication(path: Path) -> bool:
    text = path.read_text()
    match = FRONT_MATTER_RE.match(text)
    if not match:
        return False

    fm_raw, body = match.group(1), match.group(2)
    data = yaml.safe_load(fm_raw) or {}

    doi = data.pop("doi", None)
    if doi:
        hugo = data.get("hugoblox") or {}
        ids = hugo.get("ids") or {}
        if not isinstance(ids, dict):
            ids = {}
        ids.setdefault("doi", doi)
        hugo["ids"] = ids
        data["hugoblox"] = hugo

    new_fm = yaml.safe_dump(
        data,
        sort_keys=False,
        default_flow_style=False,
        allow_unicode=True,
    ).rstrip()

    path.write_text(f"---\n{new_fm}\n---\n{body}")
    return doi is not None


def main() -> None:
    updated = 0
    for md in Path("content/publication").rglob("*.md"):
        if rewrite_publication(md):
            updated += 1
    print(f"postprocess_publications: updated {updated} file(s)")


if __name__ == "__main__":
    main()
