import os
import re
import pymupdf  # Replaced deprecated fitz with pymupdf
import pytesseract
from PIL import Image

def clean_text(text):
    """
    Basic cleanup of OCR text.
    Removes excessive blank lines and cleans up common OCR noise.
    """
    # Remove multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Strip leading/trailing whitespaces per line
    lines = [line.strip() for line in text.split('\n')]
    # Join back
    text = '\n'.join(lines)
    return text.strip()

def pdf_to_markdown(pdf_path, output_md_path):
    """
    Reads a PDF, extracts each page as an image, runs OCR,
    and writes the extracted text into a Markdown file.
    """
    print(f"Processing: {pdf_path}")

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_md_path), exist_ok=True)

    # Open the PDF document
    doc = pymupdf.open(pdf_path)
    md_content = f"# Extracted Content from {os.path.basename(pdf_path)}\n\n"

    for page_num in range(len(doc)):
        print(f"  -> Page {page_num + 1}/{len(doc)}")
        page = doc.load_page(page_num)

        # 1. Split & Snap: Render page to image at ~300 DPI
        zoom_x = 3.0
        zoom_y = 3.0
        mat = pymupdf.Matrix(zoom_x, zoom_y)
        pix = page.get_pixmap(matrix=mat, alpha=False)

        # Convert fitz pixmap to PIL Image
        mode = "RGB" if pix.n == 3 else "L"
        img = Image.frombytes(mode, [pix.width, pix.height], pix.samples)

        # 2. Scan: Apply Tesseract OCR
        # Note: We are using English language by default, but Bengali models can be added.
        page_text = pytesseract.image_to_string(img)

        # 3. Parse: Clean and format text
        cleaned_text = clean_text(page_text)

        md_content += f"## Page {page_num + 1}\n\n"
        md_content += cleaned_text + "\n\n"

    # Write to Markdown file
    with open(output_md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)

    print(f"Finished processing. Output saved to {output_md_path}\n")
    return output_md_path

def process_all_pdfs(source_dir=".", output_dir="output"):
    """
    Walks through the source directory to find all PDF files and applies the OCR pipeline,
    maintaining the chronological directory architecture in the output folder.
    """
    for root, _, files in os.walk(source_dir):
        # Skip the output directory itself to avoid recursive processing if run multiple times
        if output_dir in root:
            continue

        for file in files:
            if file.lower().endswith(".pdf"):
                pdf_path = os.path.join(root, file)

                # Determine the relative path to maintain architecture in the output
                rel_path = os.path.relpath(pdf_path, source_dir)
                output_md_path = os.path.join(output_dir, rel_path).replace(".pdf", ".md")

                # Process the file
                pdf_to_markdown(pdf_path, output_md_path)

if __name__ == "__main__":
    import sys

    # Allow passing a specific directory or use the current directory
    source_directory = sys.argv[1] if len(sys.argv) > 1 else "."

    print(f"Starting batch process on directory: {source_directory}")
    print("WARNING: Processing all PDFs can take a significant amount of time.")

    # Process all PDFs in the repository
    # process_all_pdfs(source_directory, "output")

    # For demonstration/testing in this environment, we just run on one file.
    # To run on all files, uncomment the process_all_pdfs line above.

    sample_pdf = "2025/Bengali.pdf"
    output_md = "output/2025/Bengali.md"

    if os.path.exists(sample_pdf):
        print(f"\n--- Running Demo on {sample_pdf} ---")
        pdf_to_markdown(sample_pdf, output_md)
        print("Note: To run on the entire archive, uncomment 'process_all_pdfs' in the script.")
    else:
        print(f"Error: Sample PDF {sample_pdf} not found.")
