#!/usr/bin/env python3
"""Reconstruct the PDF corpus into traceable, page-aware Markdown."""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import re
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "reconstructed"
QUESTION_RE = re.compile(r"^\s*([0-9০-৯]+(?:[.১-৯][0-9০-৯]*)?)\s*[.)-]?\s*(.*)$")
YEAR_RE = re.compile(r"(?:^|/)(20(?:10|11|12|13|14|15|16|25|26))(?:/|$)")


def run(*args: str) -> str:
    return subprocess.check_output(args, text=True, stderr=subprocess.DEVNULL).strip()


def page_count(pdf: Path) -> int:
    match = re.search(r"^Pages:\s+(\d+)", run("pdfinfo", str(pdf)), re.MULTILINE)
    return int(match.group(1)) if match else 0


def metadata(pdf: Path) -> dict[str, str]:
    rel = pdf.relative_to(ROOT).as_posix()
    year_match = YEAR_RE.search(rel)
    year = year_match.group(1) if year_match else "2017-2025"
    stem = pdf.stem
    paper = ""
    if "Paper_" in stem:
        stem, paper_no = stem.rsplit("_", 1)
        paper = f"Paper {paper_no}"
    language = "Bengali" if "Bengali" in stem or stem == "Bengali" else "English"
    subject = stem.replace("_Bengali", "").replace("_English", "").replace("_Paper", "").replace("_", " ").strip() or "Unknown"
    if "Compilations" in rel:
        year = "2017-2025"
    return {"source": rel, "filename": pdf.name, "year": year, "subject": subject, "paper": paper, "language": language}


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9-]+", "-", value.lower()).strip("-") or "paper"


def ocr_page(image: Path, language: str) -> str:
    return subprocess.check_output(["tesseract", str(image), "stdout", "-l", language, "--psm", "6"], text=True, stderr=subprocess.DEVNULL).strip()


def heading_lines(text: str) -> list[str]:
    result = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        match = QUESTION_RE.match(line)
        result.append(f"### {match.group(1)} {match.group(2)}".rstrip() if match and len(match.group(1)) <= 8 else line)
    return result


def process(pdf: Path, output: Path, dpi: int, skip_existing: bool = False) -> dict:
    meta = metadata(pdf)
    destination = output / meta["year"] / slug(meta["subject"]) / slug(meta["paper"] or pdf.stem)
    destination.mkdir(parents=True, exist_ok=True)
    pages = page_count(pdf)
    if skip_existing and (destination / "paper.md").is_file() and (destination / "uncertainties.md").is_file():
        return {**meta, "pages": pages, "output": destination.relative_to(ROOT).as_posix(), "status": "needs_review", "low_signal_pages": []}
    language = "ben+eng" if meta["language"] == "Bengali" or meta["subject"] != "English" else "eng"
    page_text = []
    low_signal = []
    with tempfile.TemporaryDirectory(prefix="reconstruct-") as temp:
        for number in range(1, pages + 1):
            image = Path(temp) / f"page-{number}"
            subprocess.run(["pdftoppm", "-f", str(number), "-l", str(number), "-singlefile", "-r", str(dpi), "-png", str(pdf), str(image)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            text = ocr_page(image.with_suffix(".png"), language)
            page_text.append(text)
            if len(re.sub(r"\s+", "", text)) < 80:
                low_signal.append(number)
    markdown = [f"# {meta['subject']} — {meta['year']}", "", f"**Source:** `{meta['source']}`  ", f"**Language:** {meta['language']}  ", f"**Physical pages:** {pages}", "", "> This reconstruction preserves page boundaries and OCR evidence. Question hierarchy and visual notation require source-image review where marked.", ""]
    for number, text in enumerate(page_text, 1):
        markdown.extend([f"## Physical page {number}", "", f"<!-- source-page: {number} -->", ""])
        markdown.extend(heading_lines(text) if text else ["[No OCR text recovered from this page.]"])
        markdown.append("")
    (destination / "paper.md").write_text("\n".join(markdown), encoding="utf-8")
    uncertainties = ["# Uncertainties and review queue", "", "OCR is evidence, not a substitute for the rendered source page.", "", f"- OCR language: `{language}`", "- Review every question, mark expression, mathematical/scientific symbol, table, graph, map, and diagram against the PDF."]
    uncertainties.extend(f"- Page {number}: low OCR signal; inspect the source image manually." for number in low_signal)
    if meta["subject"].lower() in {"mathematics", "physical science", "life science", "geography"}:
        uncertainties.append(f"- Subject-sensitive visual review required for {meta['subject']}.")
    (destination / "uncertainties.md").write_text("\n".join(uncertainties) + "\n", encoding="utf-8")
    return {**meta, "pages": pages, "output": destination.relative_to(ROOT).as_posix(), "status": "needs_review", "low_signal_pages": low_signal}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--workers", type=int, default=max(1, min(4, os.cpu_count() or 1)))
    parser.add_argument("--dpi", type=int, default=180)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--skip-existing", action="store_true")
    parser.add_argument("--source-prefix")
    args = parser.parse_args()
    output = args.output if args.output.is_absolute() else ROOT / args.output
    output.mkdir(parents=True, exist_ok=True)
    pdfs = sorted(ROOT.rglob("*.pdf"))
    if args.source_prefix:
        pdfs = [pdf for pdf in pdfs if pdf.relative_to(ROOT).as_posix().startswith(args.source_prefix)]
    if args.limit:
        pdfs = pdfs[:args.limit]
    records = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(process, pdf, output, args.dpi, args.skip_existing): pdf for pdf in pdfs}
        for future in concurrent.futures.as_completed(futures):
            pdf = futures[future]
            try:
                records.append(future.result())
                print(f"processed {pdf.relative_to(ROOT)}", flush=True)
            except Exception as exc:
                records.append({**metadata(pdf), "pages": 0, "status": "failed", "error": str(exc)})
                print(f"failed {pdf.relative_to(ROOT)}: {exc}", flush=True)
    records.sort(key=lambda item: item["source"])
    manifest = {"generated_at": datetime.now(timezone.utc).isoformat(), "total_pdfs": len(records), "papers": records}
    (output / "corpus_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    review = sum(record["status"] == "needs_review" for record in records)
    failed = sum(record["status"] == "failed" for record in records)
    total_pages = sum(record.get("pages", 0) for record in records)
    report = ["# Reconstruction report", "", f"Generated: `{manifest['generated_at']}`", "", f"- PDFs discovered: **{len(records)}**", f"- Pages accounted for: **{total_pages}**", f"- OCR/Markdown outputs generated: **{len(records) - failed}**", f"- Needs visual review: **{review}**", f"- Failed: **{failed}**", "", "All generated papers retain physical page boundaries and source paths. `needs_review` is intentional: OCR cannot reliably reconstruct historical visual content, marks, diagrams, maps, tables, or mathematical notation without source-image verification."]
    (output / "RECONSTRUCTION_REPORT.md").write_text("\n".join(report) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
