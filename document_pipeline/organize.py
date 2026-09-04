"""Build a year/subject-first public library from parser evidence."""

from __future__ import annotations

import argparse
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .cli import SUBJECTS_BY_LENGTH, question_markdown


COMPILATION_YEARS = (2017, 2018, 2019, 2020, 2022, 2023, 2024, 2025)

# These are deliberately limited to boundaries recoverable from the rendered
# evidence. Unknown years remain visible in the catalog and are review flags.
COMPILATION_STARTS: dict[str, dict[int, int]] = {
    "Bengali_2017_2025.pdf": {2024: 15, 2025: 22},
    "English_2017_2025.pdf": {2024: 19, 2025: 27},
    "Geography_2017_2025.pdf": {2018: 4, 2024: 16, 2025: 24},
    "History_2017_2025.pdf": {2024: 16, 2025: 24},
    "Life_Science_2017_2025.pdf": {2017: 1, 2024: 21, 2025: 29},
    "Mathematics_2017_2025.pdf": {2024: 16, 2025: 24},
    "Physical_Science_2017_2025.pdf": {2020: 7, 2024: 14, 2025: 24},
}

YEAR_RE = re.compile(r"\b(20(?:1[0-9]|2[0-9]))\b")


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def classify_source(source: dict[str, Any]) -> dict[str, Any]:
    path = Path(source["source"])
    stem = path.stem
    medium = "Bengali" if re.search(r"(?:^|_)Bengali(?:_|$)", stem, re.I) else "English" if re.search(r"(?:^|_)English(?:_|$)", stem, re.I) else source.get("medium")
    subject_stem = re.sub(r"_(?:Bengali|English)$", "", stem, flags=re.I).strip("_-") or stem
    subject = next((item for item in SUBJECTS_BY_LENGTH if item.lower() in subject_stem.lower()), subject_stem).replace("_", " ")
    if medium is None and source["category"] in {"archive", "annual"}:
        medium = "English" if subject == "English" else "Bengali"
    paper_match = re.search(r"Paper[_ -]?(\d+)", stem, re.I)
    year = source.get("year")
    if year is None:
        for part in path.parts:
            match = YEAR_RE.search(part)
            if match:
                year = int(match.group(1))
                break
    return {
        **source,
        "subject": subject,
        "medium": medium,
        "paper": paper_match.group(1) if paper_match else source.get("paper"),
        "year": year,
    }


def compilation_pages(source: dict[str, Any], year: int, page_count: int) -> tuple[list[int], str]:
    starts = COMPILATION_STARTS.get(Path(source["source"]).name, {})
    start = starts.get(year)
    if start is None:
        return [], "needs-review"
    later_starts = [candidate for candidate in starts.values() if candidate > start]
    end = min(later_starts) - 1 if later_starts else page_count
    return list(range(start, end + 1)), "reviewed-marker"


def fragment(source: dict[str, Any], pages: list[int], status: str) -> dict[str, Any]:
    return {
        "pdf": source["source"],
        "sha256": source["sha256"],
        "pages": pages,
        "status": status,
        "category": source["category"],
        "medium": source.get("medium"),
    }


def source_documents(manifest: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {document["source"]["source"]: document for document in manifest["documents"]}


def new_record(year: int, subject: str, paper: str | None) -> dict[str, Any]:
    paper_label = f"paper-{paper}" if paper else "main"
    return {
        "id": f"{year}-{slug(subject)}-{slug(paper_label)}",
        "exam_year": year,
        "subject": subject,
        "paper": paper_label,
        "mediums": [],
        "boundary_status": "needs-review",
        "sources": [],
    }


def add_fragment(record: dict[str, Any], source: dict[str, Any], pages: list[int], status: str) -> None:
    item = fragment(source, pages, status)
    if item not in record["sources"]:
        record["sources"].append(item)
    if source.get("medium") and source["medium"] not in record["mediums"]:
        record["mediums"].append(source["medium"])
    if status in {"exact", "reviewed-marker"}:
        record["boundary_status"] = "exact" if status == "exact" else "reviewed-marker"


def build_records(manifest: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    documents = source_documents(manifest)
    records: dict[str, dict[str, Any]] = {}
    segment_rows: list[dict[str, Any]] = []

    for raw_source in manifest["documents"]:
        source = classify_source(raw_source["source"])
        if source["category"] != "compilation":
            continue
        for year in COMPILATION_YEARS:
            record = records.setdefault(f"{year}-{slug(source['subject'])}-main", new_record(year, source["subject"], None))
            pages, status = compilation_pages(source, year, source["pages"])
            add_fragment(record, source, pages, "reviewed-marker" if pages else status)
            segment_rows.append({"paper_id": record["id"], "source_pdf": source["source"], "exam_year": year, "pages": pages, "status": status})

    for raw_source in manifest["documents"]:
        source = classify_source(raw_source["source"])
        if source["year"] is None:
            continue
        paper = source.get("paper")
        key = f"{source['year']}-{slug(source['subject'])}-{slug(f'paper-{paper}' if paper else 'main')}"
        record = records.setdefault(key, new_record(source["year"], source["subject"], paper))
        all_pages = list(range(1, source["pages"] + 1))
        add_fragment(record, source, all_pages, "exact")

    for record in records.values():
        record["medium"] = " + ".join(record.pop("mediums")) or "Unknown"
        if any(item["status"] == "exact" for item in record["sources"]):
            record["boundary_status"] = "exact"
        record["title"] = f"{record['exam_year']} — {record['subject']}"
        if record["paper"] != "main":
            record["title"] += f" — {record['paper'].replace('-', ' ').title()}"
        record["source_count"] = len(record["sources"])

    return sorted(records.values(), key=lambda item: (item["exam_year"], item["subject"], item["paper"])), segment_rows


def best_fragment(record: dict[str, Any]) -> dict[str, Any] | None:
    usable = [item for item in record["sources"] if item["pages"]]
    return sorted(usable, key=lambda item: item["category"] != "annual")[0] if usable else None


def write_markdown(record: dict[str, Any], documents: dict[str, dict[str, Any]], content_root: Path) -> str:
    subject_path = slug(record["subject"])
    paper_path = record["paper"]
    target = content_root / str(record["exam_year"]) / subject_path / f"{paper_path}.md"
    target.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "---",
        f"id: {record['id']}",
        f"exam_year: {record['exam_year']}",
        f"subject: {json.dumps(record['subject'], ensure_ascii=False)}",
        f"medium: {json.dumps(record['medium'], ensure_ascii=False)}",
        f"paper: {record['paper']}",
        f"boundary_status: {record['boundary_status']}",
        "---",
        "",
        f"# {record['title']}",
        "",
        f"> Normalized exam-paper record. Boundary status: **{record['boundary_status']}**.",
        "> OCR text remains evidence-linked and should be checked against the source page before publication.",
        "",
        "## Source evidence",
        "",
    ]
    for source in record["sources"]:
        page_label = ", ".join(map(str, source["pages"])) if source["pages"] else "boundary not proven"
        lines.append(f"- `{source['pdf']}` — pages: {page_label}; status: **{source['status']}**; SHA-256: `{source['sha256']}`")
    selected = best_fragment(record)
    if selected is None:
        lines.extend(["", "## Extracted text", "", "_No reliable page boundary is available yet. Open the source compilation and review `source-segments.json` before treating this record as complete._", ""])
    else:
        document = documents[selected["pdf"]]
        pages_by_number = {page["page"]: page for page in document["pages"]}
        lines.extend(["", "## Extracted text", ""])
        for page_number in selected["pages"]:
            page = pages_by_number[page_number]
            lines.extend([f"### Source page {page_number}", "", f"<!-- source-page: {selected['pdf']}#page={page_number} -->", "", question_markdown(page["text"]) or "_[No text extracted]_", ""])
    target.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    return target.relative_to(Path.cwd()).as_posix()


def organize(input_root: Path, content_root: Path, website_data: Path, segment_output: Path) -> None:
    manifest = json.loads((input_root / "manifest.json").read_text(encoding="utf-8"))
    records, segments = build_records(manifest)
    if content_root.exists():
        shutil.rmtree(content_root)
    content_root.mkdir(parents=True)
    documents = source_documents(manifest)
    for record in records:
        record["markdown"] = write_markdown(record, documents, content_root)
        record["content_url"] = "/" + record["markdown"]
        record["has_text"] = best_fragment(record) is not None
    segment_output.parent.mkdir(parents=True, exist_ok=True)
    segment_output.write_text(json.dumps({"generated_at": datetime.now(timezone.utc).isoformat(), "segments": segments}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    website_data.parent.mkdir(parents=True, exist_ok=True)
    website_data.write_text(json.dumps({"generated_at": datetime.now(timezone.utc).isoformat(), "papers": records}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(records)} normalized paper records to {content_root}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path(".pipeline-output/full"))
    parser.add_argument("--content", type=Path, default=Path("content/papers"))
    parser.add_argument("--website-data", type=Path, default=Path("website/data/papers.json"))
    parser.add_argument("--segments", type=Path, default=Path("content/source-segments.json"))
    args = parser.parse_args()
    organize(args.input.resolve(), args.content.resolve(), args.website_data.resolve(), args.segments.resolve())


if __name__ == "__main__":
    main()
