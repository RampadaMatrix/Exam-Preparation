# Normalized paper library

Every Markdown file under `papers/` represents one canonical exam identity:

```text
papers/<exam-year>/<subject>/<paper>.md
```

The record front matter provides stable `id`, `exam_year`, `subject`, `medium`, `paper`, and `boundary_status` fields. The body keeps source PDF checksums, source page ranges, and extracted OCR text together so a paper can be found by metadata without losing its evidence trail.

`source-segments.json` records how pages from the seven multi-year compilation PDFs were assigned. `reviewed-marker` ranges have a recoverable rendered boundary; `needs-review` records are intentionally retained as catalog entries until a human can verify the page boundary. No source page is silently assigned to an incorrect year.
