#!/usr/bin/env python3
"""Validate corpus coverage and generated-paper traceability."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "reconstructed"


def main() -> int:
    manifest_path = OUTPUT / "corpus_manifest.json"
    if not manifest_path.exists():
        print("missing reconstructed/corpus_manifest.json")
        return 1
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    failures = []
    for paper in manifest["papers"]:
        if paper["status"] == "failed":
            failures.append(f"failed: {paper['source']}")
            continue
        destination = ROOT / paper["output"]
        for filename in ("paper.md", "uncertainties.md"):
            if not (destination / filename).is_file():
                failures.append(f"missing {filename}: {paper['source']}")
        if paper["pages"] <= 0:
            failures.append(f"invalid page count: {paper['source']}")
    print(f"papers={len(manifest['papers'])} failures={len(failures)}")
    for failure in failures:
        print(failure)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
