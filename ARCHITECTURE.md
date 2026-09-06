# Project Architecture & Chronology Strategy

## 1. Overview
The goal of this project is to parse a large collection of West Bengal Board (WBBSE) Madhyamik Question Papers (2010-2026) in PDF format into structured Markdown. Due to the inconsistent quality of the source PDFs (scanned documents, artifacts, etc.), we employ a robust "Split -> Snap -> Scan -> Parse" pipeline.

## 2. Chronological Strategy
The source repository is organized chronologically and by syllabus patterns. Our parsing strategy will mirror this directory architecture to ensure the resulting Markdown files maintain their temporal context:

- **2010_2016_Archives:** Pre-2017 curriculum. Separated into individual years.
- **Compilations_2017_2025:** Multi-year compilations under the New Syllabus Pattern.
- **2025 & 2026:** Recent individual examination papers.

### Output Structure
The output Markdown files will be generated in a dedicated `output/` directory, replicating the source hierarchy. For instance, `2026/Bengali.pdf` will yield `output/2026/Bengali.md`.

## 3. System Design: The Pipeline
To handle low-quality PDFs, we avoid direct text extraction. Instead, we use an OCR-based pipeline:

1. **Split & Snap:**
   - The PDF is ingested, and each page is split out.
   - Each page is rendered ("snapped") into a high-resolution image (e.g., 300 DPI PNG). This neutralizes font-encoding issues common in old PDFs.
2. **Scan:**
   - Optical Character Recognition (OCR) is applied to each page image to extract raw text.
3. **Parse:**
   - The raw OCR text is post-processed.
   - Noise is filtered, and structural elements (like question numbers, parts, and marks) are identified to generate clean, well-formatted Markdown.

## 4. Technology Stack
- **PDF Processing & Image Generation:** `PyMuPDF` (fitz) or `pdf2image`
- **OCR Engine:** `pytesseract` (Tesseract OCR)
- **Text Processing:** Python regular expressions and string manipulation

A detailed visual representation of this architecture is provided in the accompanying SVG diagram.
