#!/usr/bin/env python3
"""Build a searchable catalog without duplicating the source PDFs."""

from __future__ import annotations

import csv
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "reconstructed" / "corpus_manifest.json"
OUT = ROOT / "catalog"


def record(item: dict) -> dict:
    collection = item["year"] == "2017-2025"
    subject = item["subject"].removesuffix(" 2017 2025") if collection else item["subject"]
    return {
        "year": item["year"],
        "year_start": 2017 if collection else int(item["year"]),
        "year_end": 2025 if collection else int(item["year"]),
        "subject": subject,
        "language": item["language"],
        "paper": item["paper"] or "—",
        "kind": "collection" if collection else "individual",
        "source_pdf": item["source"],
        "markdown": item["output"] + "/paper.md",
        "pages": item["pages"],
        "review": item["status"],
    }


def main() -> None:
    OUT.mkdir(exist_ok=True)
    items = [record(item) for item in json.loads(MANIFEST.read_text(encoding="utf-8"))["papers"]]
    items.sort(key=lambda item: (item["year_start"], item["subject"], item["language"], item["paper"]))
    (OUT / "papers.json").write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with (OUT / "papers.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=items[0].keys())
        writer.writeheader()
        writer.writerows(items)
    data = json.dumps(items, ensure_ascii=False).replace("</", "<\\/")
    subjects = sorted({item["subject"] for item in items})
    languages = sorted({item["language"] for item in items})
    subject_options = "".join(f'<option value="{html.escape(v)}">{html.escape(v)}</option>' for v in subjects)
    language_options = "".join(f'<option value="{html.escape(v)}">{html.escape(v)}</option>' for v in languages)
    years = "".join(f"<option>{year}</option>" for year in range(2010, 2027))
    page = f'''<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Question paper catalog</title>
<style>body{{font:15px system-ui,sans-serif;max-width:1250px;margin:2rem auto;padding:0 1rem;color:#202124}}h1{{margin-bottom:.25rem}}.note{{color:#555}}.filters{{display:flex;flex-wrap:wrap;gap:.6rem;margin:1.5rem 0}}input,select{{padding:.55rem;border:1px solid #aaa;border-radius:5px}}table{{border-collapse:collapse;width:100%}}th,td{{border-bottom:1px solid #ddd;text-align:left;padding:.55rem .4rem;vertical-align:top}}th{{background:#f4f4f4}}.collection{{color:#8a4b00;font-weight:600}}</style>
<h1>WBBSE question paper catalog</h1>
<p class="note">Filter exact individual papers by year, subject, and language. Collection rows cover a year range but are not silently presented as year-separated PDFs.</p>
<div class="filters"><input id="search" placeholder="Search subject or filename"><select id="year"><option value="">All years</option>{years}</select><select id="subject"><option value="">All subjects</option>{subject_options}</select><select id="language"><option value="">All languages</option>{language_options}</select><select id="kind"><option value="">Individual and collections</option><option value="individual">Individual only</option><option value="collection">Collections only</option></select></div>
<div id="count"></div><table><thead><tr><th>Year / coverage</th><th>Subject</th><th>Language</th><th>Type</th><th>Pages</th><th>Files</th></tr></thead><tbody id="rows"></tbody></table>
<script>
const papers={data};const $=id=>document.getElementById(id);
function draw(){{const q=$("search").value.toLowerCase(),y=$("year").value,s=$("subject").value,l=$("language").value,k=$("kind").value;const rows=papers.filter(p=>(!q||JSON.stringify(p).toLowerCase().includes(q))&&(!y||(Number(y)>=p.year_start&&Number(y)<=p.year_end))&&(!s||p.subject===s)&&(!l||p.language===l)&&(!k||p.kind===k));$("count").textContent=`${{rows.length}} paper records`;$("rows").innerHTML=rows.map(p=>`<tr><td>${{p.year}}</td><td>${{p.subject}}</td><td>${{p.language}}</td><td class="${{p.kind}}">${{p.kind==='collection'?'Collection (not year-split)':'Individual'}}</td><td>${{p.pages}}</td><td><a href="../${{p.source_pdf}}">PDF</a> · <a href="../${{p.markdown}}">Markdown</a></td></tr>`).join('')}}
document.querySelectorAll('input,select').forEach(e=>e.addEventListener('input',draw));draw();
</script>
'''
    (OUT / "index.html").write_text(page, encoding="utf-8")
    (OUT / "README.md").write_text("""# Searchable paper catalog

Open [`index.html`](./index.html) in a browser, or use [`papers.csv`](./papers.csv) / [`papers.json`](./papers.json) programmatically.

Individual PDFs (for example 2016 Mathematics and 2025 Bengali) have exact year records. The seven `2017-2025` compilation PDFs are represented as collection records whose year-range filter includes 2020, but they are explicitly labeled **Collection (not year-split)**. This avoids inventing page ranges or claiming that a compilation is an exact 2020 paper.
""", encoding="utf-8")


if __name__ == "__main__":
    main()
