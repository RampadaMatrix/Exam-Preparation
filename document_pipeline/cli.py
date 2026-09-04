from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import pymupdf as fitz
from PIL import Image, ImageOps
import pytesseract
from pytesseract import Output


YEAR_RE = re.compile(r"\b(20(?:1[0-9]|2[0-9]))\b")
QUESTION_RE = re.compile(
    r"^\s*(?:question\s*)?([0-9০-৯]{1,3}(?:\.[0-9০-৯]{1,3})?)\s*[.)।:-]\s*",
    re.IGNORECASE,
)
MARK_RE = re.compile(r"(?:\((\d{1,3})\)|\[?(\d{1,3})\s*marks?\]?)", re.IGNORECASE)
SUBJECTS = (
    "Bengali",
    "English",
    "Geography",
    "History",
    "Life_Science",
    "Mathematics",
    "Physical_Science",
)


@dataclass(frozen=True)
class SourceMetadata:
    source: str
    category: str
    year: int | None
    subject: str
    medium: str | None
    paper: str | None
    sha256: str
    bytes: int
    pages: int
    period: str | None = None


@dataclass
class PageResult:
    page: int
    extraction: str
    text: str
    confidence: float | None
    snapshot: str | None
    raw_text: str
    blocks: list[dict[str, Any]]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def source_metadata(path: Path, root: Path, pages: int) -> SourceMetadata:
    relative = path.relative_to(root).as_posix()
    year_match = next((match for part in path.parts if (match := YEAR_RE.search(part))), None)
    year = int(year_match.group(1)) if year_match else None
    category = (
        "compilation"
        if "Compilations_2017_2025" in path.parts
        else "archive"
        if "2010_2016_Archives" in path.parts
        else "annual"
    )
    stem = path.stem
    subject = next((item for item in SUBJECTS if item.lower() in stem.lower()), stem)
    medium = None
    if re.search(r"(?:^|_)Bengali(?:_|$)", stem, re.IGNORECASE):
        medium = "Bengali"
    elif re.search(r"(?:^|_)English(?:_|$)", stem, re.IGNORECASE):
        medium = "English"
    elif stem.lower() in {"bengali", "english"}:
        medium = stem.title()
    paper_match = re.search(r"Paper[_ -]?(\d+)", stem, re.IGNORECASE)
    return SourceMetadata(
        source=relative,
        category=category,
        year=year,
        subject=subject.replace("_", " "),
        medium=medium,
        paper=paper_match.group(1) if paper_match else None,
        sha256=sha256(path),
        bytes=path.stat().st_size,
        pages=pages,
        period="2017–2025" if category == "compilation" else None,
    )


def clean_text(value: str) -> str:
    value = value.replace("\u00a0", " ").replace("\r", "")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in value.splitlines()]
    return "\n".join(line for line in lines if line).strip()


def text_blocks(page: fitz.Page) -> tuple[str, list[dict[str, Any]]]:
    blocks: list[dict[str, Any]] = []
    for block in page.get_text("blocks"):
        if len(block) < 5:
            continue
        text = clean_text(str(block[4]))
        if text:
            blocks.append({"bbox": [round(float(number), 2) for number in block[:4]], "text": text})
    return "\n\n".join(block["text"] for block in blocks), blocks


def pixmap_image(page: fitz.Page, dpi: int) -> Image.Image:
    pixmap = page.get_pixmap(matrix=fitz.Matrix(dpi / 72, dpi / 72), alpha=False)
    return Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)


def ocr_page(image: Image.Image, languages: str) -> tuple[str, float | None, list[dict[str, Any]]]:
    prepared = ImageOps.autocontrast(ImageOps.grayscale(image)).point(lambda value: 255 if value > 180 else 0)
    data = pytesseract.image_to_data(prepared, lang=languages, output_type=Output.DICT)
    lines: dict[tuple[int, int, int], list[tuple[int, str, float]]] = {}
    confidences: list[float] = []
    for index, raw in enumerate(data["text"]):
        word = clean_text(raw)
        if not word:
            continue
        try:
            confidence = float(data["conf"][index])
        except (TypeError, ValueError):
            confidence = -1
        if confidence >= 0:
            confidences.append(confidence)
        key = (data["block_num"][index], data["par_num"][index], data["line_num"][index])
        lines.setdefault(key, []).append((data["left"][index], word, confidence))
    blocks: list[dict[str, Any]] = []
    output_lines: list[str] = []
    for key in sorted(lines):
        words = sorted(lines[key])
        line = " ".join(word for _, word, _ in words)
        output_lines.append(line)
        blocks.append({"line": key[2], "text": line, "confidence": round(sum(confidence for _, _, confidence in words) / len(words), 2)})
    average = round(sum(confidences) / len(confidences), 2) if confidences else None
    return "\n".join(output_lines), average, blocks


def extract_page(page: fitz.Page, image: Image.Image, languages: str) -> tuple[str, str, float | None, list[dict[str, Any]]]:
    text, blocks = text_blocks(page)
    if len(re.sub(r"\s", "", text)) >= 30:
        return "embedded-text", text, None, blocks
    text, confidence, blocks = ocr_page(image, languages)
    return "ocr", text, confidence, blocks


def first_year(text: str, fallback: int | None) -> int | None:
    match = YEAR_RE.search(text[:1200])
    return int(match.group(1)) if match else fallback


def logical_units(pages: list[PageResult], metadata: SourceMetadata) -> list[dict[str, Any]]:
    """Split compilations only on candidate cover pages; keep uncertain pages together."""
    starts = [0]
    if metadata.category == "compilation":
        for index, page in enumerate(pages[1:], start=1):
            prefix = page.text[:800].lower()
            page_year = first_year(prefix, None)
            first_line = next((line.strip() for line in page.text.splitlines() if line.strip()), "").lower()
            cover_signal = bool(re.match(r"(?:madhyamik|মাধ্যমিক|secondary examination)\b", first_line))
            previous_year = first_year(pages[index - 1].text[:800], None)
            if page_year and page_year != previous_year and cover_signal:
                starts.append(index)
    units: list[dict[str, Any]] = []
    for unit_index, start in enumerate(starts, start=1):
        end = starts[unit_index] if unit_index < len(starts) else len(pages)
        unit_pages = pages[start:end]
        units.append({
            "id": f"{metadata.source}:unit-{unit_index}",
            "year": first_year(unit_pages[0].text, metadata.year) if len(starts) > 1 else metadata.year,
            "pages": [page.page for page in unit_pages],
            "boundary_confidence": "candidate" if len(starts) > 1 else "source-document",
        })
    return units


def validate_languages(languages: str) -> None:
    requested = {language for language in languages.split("+") if language}
    if not requested:
        raise SystemExit("--languages must contain at least one language")
    if shutil.which("tesseract") is None:
        raise SystemExit("Tesseract is not installed; run the project setup command before parsing")
    result = subprocess.run(["tesseract", "--list-langs"], check=False, capture_output=True, text=True)
    available = set(result.stdout.splitlines()[1:])
    missing = sorted(requested - available)
    if missing:
        raise SystemExit(f"Tesseract language data is missing: {', '.join(missing)}; run the project setup command")


def validate_options(args: argparse.Namespace) -> None:
    if args.dpi < 1:
        raise SystemExit("--dpi must be at least 1")
    if args.max_pdfs is not None and args.max_pdfs < 1:
        raise SystemExit("--max-pdfs must be at least 1")
    if args.workers < 1:
        raise SystemExit("--workers must be at least 1")


def question_markdown(text: str) -> str:
    rendered: list[str] = []
    for line in text.splitlines():
        match = QUESTION_RE.match(line)
        if match:
            marks = MARK_RE.search(line)
            suffix = f" — {marks.group(1) or marks.group(2)} marks" if marks else ""
            rendered.append(f"### Question {match.group(1)}{suffix}\n\n{line[match.end():].strip()}".rstrip())
        else:
            rendered.append(line)
    return "\n\n".join(rendered).strip()


def markdown_document(metadata: SourceMetadata, pages: list[PageResult], units: list[dict[str, Any]]) -> str:
    year_label = metadata.period or (str(metadata.year) if metadata.year is not None else "Unknown year")
    lines = [
        "---", f"source: {json.dumps(metadata.source, ensure_ascii=False)}", f"sha256: {metadata.sha256}",
        f"category: {metadata.category}", f"year: {year_label}", f"subject: {json.dumps(metadata.subject, ensure_ascii=False)}",
        f"medium: {json.dumps(metadata.medium, ensure_ascii=False)}", f"pages: {metadata.pages}", "---", "",
        f"# {metadata.subject} — {year_label}", "", f"> Source: `{metadata.source}`",
        "> OCR and layout confidence are recorded per page in `evidence.json`.", "",
    ]
    for unit in units:
        if len(units) > 1:
            unit_year = f" ({unit['year']})" if unit["year"] else ""
            lines.extend([f"## Paper unit {unit['id'].rsplit(':', 1)[-1]}{unit_year}", "", f"> Pages: {', '.join(map(str, unit['pages']))}", ""])
        for page_number in unit["pages"]:
            page = pages[page_number - 1]
            lines.extend([f"## Page {page.page}", "", f"<!-- source-page: {metadata.source}#page={page.page} -->", "", question_markdown(page.text) or "_[No text extracted]_", ""])
    return "\n".join(lines).rstrip() + "\n"


def slug_for_source(source: str) -> Path:
    return Path(source).with_suffix("")


def parse_document(path: Path, root: Path, output: Path, dpi: int, languages: str, snapshots: bool) -> dict[str, Any]:
    with fitz.open(path) as pdf:
        metadata = source_metadata(path, root, pdf.page_count)
        document_languages = "eng" if metadata.medium == "English" else languages
        document_dir = output / "documents" / slug_for_source(metadata.source)
        pages_dir = document_dir / "pages"
        raw_dir = document_dir / "raw"
        page_results: list[PageResult] = []
        for page_index in range(pdf.page_count):
            page = pdf.load_page(page_index)
            image = pixmap_image(page, dpi)
            extraction, text, confidence, blocks = extract_page(page, image, document_languages)
            page_number = page_index + 1
            snapshot = None
            if snapshots:
                snapshot_path = pages_dir / f"page-{page_number:03d}.png"
                snapshot_path.parent.mkdir(parents=True, exist_ok=True)
                image.save(snapshot_path, format="PNG", optimize=True)
                snapshot = snapshot_path.relative_to(document_dir).as_posix()
            raw_path = raw_dir / f"page-{page_number:03d}.txt"
            raw_path.parent.mkdir(parents=True, exist_ok=True)
            raw_path.write_text(text + "\n", encoding="utf-8")
            page_results.append(PageResult(page_number, extraction, text, confidence, snapshot, raw_path.relative_to(document_dir).as_posix(), blocks))
        units = logical_units(page_results, metadata)
        document_dir.mkdir(parents=True, exist_ok=True)
        (document_dir / "document.md").write_text(markdown_document(metadata, page_results, units), encoding="utf-8")
        evidence = {"source": asdict(metadata), "units": units, "pages": [asdict(page) for page in page_results]}
        (document_dir / "evidence.json").write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return evidence


def write_chronology(output: Path, documents: list[dict[str, Any]]) -> None:
    ordered = sorted(documents, key=lambda item: (item["source"]["year"] or (2017 if item["source"]["period"] else 9999), item["source"]["subject"], item["source"]["source"]))
    entries = []
    for document in ordered:
        source = document["source"]
        for unit in document["units"]:
            normalized_unit = dict(unit)
            if source["period"] and unit["boundary_confidence"] == "source-document":
                normalized_unit["year"] = None
            entries.append({"source": source, "unit": normalized_unit})
    def entry_year(entry: dict[str, Any]) -> int:
        source, unit = entry["source"], entry["unit"]
        if unit["year"]:
            return unit["year"]
        if source["year"]:
            return source["year"]
        period_match = YEAR_RE.search(source["period"] or "")
        return int(period_match.group(1)) if period_match else 9999

    entries.sort(key=lambda item: (entry_year(item), item["source"]["subject"], item["source"]["source"], item["unit"]["pages"][0]))
    (output / "manifest.json").write_text(json.dumps({"generated_at": datetime.now(timezone.utc).isoformat(), "documents": ordered, "chronology": entries}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = ["# Chronological document index", "", "Generated from immutable source checksums. Each link has page-level evidence and raw extraction alongside it.", ""]
    current_year: int | str | None = None
    for entry in entries:
        source, unit = entry["source"], entry["unit"]
        year = unit["year"] or source["year"] or source["period"] or "Unknown year"
        if year != current_year:
            lines.extend([f"## {year}", ""])
            current_year = year
        relative = Path("documents") / slug_for_source(source["source"]) / "document.md"
        label = " — ".join(filter(None, [source["subject"], source["medium"], source["category"]]))
        lines.append(f"- [{label}, pages {unit['pages'][0]}–{unit['pages'][-1]}]({relative.as_posix()}) — `{source['source']}`")
    (output / "chronology.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    review_lines = ["# Extraction review report", "", "Review flagged pages against their PNG snapshot, or the original PDF page when snapshots were disabled.", ""]
    for document in ordered:
        source = document["source"]
        concerns = []
        for page in document["pages"]:
            if page["extraction"] == "ocr" and (page["confidence"] is None or page["confidence"] < 85):
                evidence = page["snapshot"] or f"original PDF page {page['page']}"
                concerns.append(f"page {page['page']} ({page['confidence'] if page['confidence'] is not None else 'unknown'}% OCR confidence; evidence: {evidence})")
        if source["year"] is None and source["period"] is None:
            concerns.append("year not inferred from path")
        if any(unit["boundary_confidence"] == "source-document" for unit in document["units"]):
            concerns.append("paper boundaries were not independently detected")
        if concerns:
            review_lines.append(f"- `{source['source']}`: " + "; ".join(concerns))
    if len(review_lines) == 4:
        review_lines.append("- No low-confidence or unresolved metadata items were detected.")
    (output / "review.md").write_text("\n".join(review_lines) + "\n", encoding="utf-8")


def discover(root: Path) -> list[Path]:
    return sorted(root.rglob("*.pdf"), key=lambda item: item.as_posix())


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create auditable Markdown and OCR evidence from exam-paper PDFs.")
    parser.add_argument("--root", type=Path, default=Path("."), help="Archive root containing PDF files")
    parser.add_argument("--output", type=Path, default=Path(".pipeline-output"), help="Generated output directory")
    parser.add_argument("--dpi", type=int, default=300, help="Snapshot/OCR resolution")
    parser.add_argument("--languages", default="ben+eng", help="Tesseract language set")
    parser.add_argument("--max-pdfs", type=int, default=None, help="Process only the first N PDFs for a pilot")
    parser.add_argument("--no-snapshots", action="store_true", help="Skip PNG snapshots while retaining provenance")
    parser.add_argument("--source", type=Path, default=None, help="Process one PDF instead of the discovered archive")
    parser.add_argument("--workers", type=int, default=2, help="Number of PDFs to process concurrently (default: 2)")
    parser.add_argument("--resume", action="store_true", help="Skip documents with existing evidence and retain them in the final manifest")
    return parser


def main(argv: Iterable[str] | None = None) -> None:
    args = build_parser().parse_args(argv)
    validate_options(args)
    validate_languages(args.languages)
    root = args.root.resolve()
    output = args.output.resolve()
    all_paths = [args.source.resolve()] if args.source else discover(root)
    existing: list[dict[str, Any]] = []
    paths = all_paths
    if args.resume:
        for candidate in all_paths:
            evidence_path = output / "documents" / slug_for_source(candidate.relative_to(root).as_posix()) / "evidence.json"
            if evidence_path.is_file():
                existing.append(json.loads(evidence_path.read_text(encoding="utf-8")))
        existing_sources = {item["source"]["source"] for item in existing}
        paths = [candidate for candidate in all_paths if candidate.relative_to(root).as_posix() not in existing_sources]
    if args.max_pdfs is not None:
        paths = paths[: args.max_pdfs]
    if not paths and not existing:
        raise SystemExit("No PDF files found")
    for path in paths:
        if not path.is_file():
            raise SystemExit(f"PDF does not exist: {path}")

    def process(index_and_path: tuple[int, Path]) -> dict[str, Any]:
        index, path = index_and_path
        label = path.relative_to(root) if path.is_relative_to(root) else path
        print(f"[{index}/{len(paths)}] {label}", file=sys.stderr)
        return parse_document(path, root, output, args.dpi, args.languages, not args.no_snapshots)

    jobs = list(enumerate(paths, start=1))
    if args.workers == 1:
        documents = [process(job) for job in jobs]
    else:
        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            documents = list(executor.map(process, jobs))
    output.mkdir(parents=True, exist_ok=True)
    write_chronology(output, existing + documents)
    print(f"Wrote {len(existing) + len(documents)} document(s) to {output}")


if __name__ == "__main__":
    main()
