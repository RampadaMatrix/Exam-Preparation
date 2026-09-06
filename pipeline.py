import os
import re
import pymupdf  # Replaced deprecated fitz with pymupdf
import pytesseract
from PIL import Image

def clean_text(text):
    text = re.sub(r'\n{3,}', '\n\n', text)
    lines = [line.strip() for line in text.split('\n')]
    text = '\n'.join(lines)
    return text.strip()

def pdf_to_markdown(pdf_path, output_md_path):
    os.makedirs(os.path.dirname(output_md_path), exist_ok=True)

    doc = pymupdf.open(pdf_path)
    md_content = f"# Extracted Content from {os.path.basename(pdf_path)}\n\n"

    for page_num in range(len(doc)):
        print(f"  -> {pdf_path} - Page {page_num + 1}/{len(doc)}")
        page = doc.load_page(page_num)

        zoom_x = 3.0
        zoom_y = 3.0
        mat = pymupdf.Matrix(zoom_x, zoom_y)
        pix = page.get_pixmap(matrix=mat, alpha=False)

        mode = "RGB" if pix.n == 3 else "L"
        img = Image.frombytes(mode, [pix.width, pix.height], pix.samples)

        page_text = pytesseract.image_to_string(img)
        cleaned_text = clean_text(page_text)

        md_content += f"## Page {page_num + 1}\n\n"
        md_content += cleaned_text + "\n\n"

    with open(output_md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)

    return output_md_path

import multiprocessing

def _process_single_file(args):
    pdf_path, output_md_path = args
    if os.path.exists(output_md_path):
        return output_md_path
    try:
        return pdf_to_markdown(pdf_path, output_md_path)
    except Exception as e:
        print(f"Error processing {pdf_path}: {e}")
        return None

def process_all_pdfs(source_dir=".", output_dir="output"):
    tasks = []
    for root, _, files in os.walk(source_dir):
        if output_dir in root or ".git" in root:
            continue

        for file in files:
            if file.lower().endswith(".pdf"):
                pdf_path = os.path.join(root, file)
                rel_path = os.path.relpath(pdf_path, source_dir)
                base, _ = os.path.splitext(rel_path)
                output_md_path = os.path.join(output_dir, base + ".md")
                tasks.append((pdf_path, output_md_path))

    # Use standard multiprocessing CPU count for maximum speed
    num_workers = multiprocessing.cpu_count()
    with multiprocessing.Pool(processes=num_workers) as pool:
        results = pool.map(_process_single_file, tasks)

    print(f"Finished bulk processing. Processed {len([r for r in results if r])} files.")

if __name__ == "__main__":
    import sys
    source_directory = sys.argv[1] if len(sys.argv) > 1 else "."

    print(f"Starting batch process on directory: {source_directory}")
    print("WARNING: Processing all PDFs can take a significant amount of time.")
    process_all_pdfs(source_directory, "output")
