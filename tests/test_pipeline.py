import argparse
import unittest

from pathlib import Path

from document_pipeline.cli import SourceMetadata, logical_units, markdown_document, question_markdown, source_metadata, validate_options


class PipelineUnitTests(unittest.TestCase):
    def test_question_heading_preserves_question_text_and_marks(self):
        result = question_markdown("1. Explain the process. (5)\n2) Give two examples.")
        self.assertIn("### Question 1 — 5 marks", result)
        self.assertIn("Explain the process.", result)
        self.assertIn("### Question 2", result)

    def test_bengali_decimal_question_number_is_not_collapsed(self):
        result = question_markdown("১.১. Explain the first part.")
        self.assertIn("### Question ১.১", result)

    def test_year_is_taken_from_a_later_path_component(self):
        metadata = source_metadata(Path("2010_2016_Archives/2010/English.pdf"), Path("."), 6)
        self.assertEqual(metadata.year, 2010)

    def test_compilation_has_a_period_not_a_single_exam_year(self):
        metadata = source_metadata(Path("Compilations_2017_2025/History_2017_2025.pdf"), Path("."), 31)
        self.assertIsNone(metadata.year)
        self.assertEqual(metadata.period, "2017–2025")

    def test_standalone_english_filename_selects_english_medium(self):
        metadata = source_metadata(Path("2025/English.pdf"), Path("."), 13)
        self.assertEqual(metadata.medium, "English")

    def test_single_document_remains_one_unit_when_boundary_is_uncertain(self):
        metadata = SourceMetadata("Compilations_2017_2025/English_2017_2025.pdf", "compilation", None, "English", "English", None, "a" * 64, 10, 2, "2017–2025")
        pages = [
            type("Page", (), {"page": 1, "text": "Madhyamik Question Paper-2017", "confidence": 100.0, "snapshot": None, "raw_text": "raw", "blocks": []})(),
            type("Page", (), {"page": 2, "text": "12. - Madhyamik Question Papers-2025\n1. Read the passage.", "confidence": 100.0, "snapshot": None, "raw_text": "raw", "blocks": []})(),
        ]
        units = logical_units(pages, metadata)
        self.assertEqual(units[0]["pages"], [1, 2])
        self.assertIsNone(units[0]["year"])

    def test_markdown_contains_source_provenance(self):
        metadata = SourceMetadata("2025/English.pdf", "annual", 2025, "English", "English", None, "b" * 64, 10, 1)
        page = type("Page", (), {"page": 1, "text": "1. Read this.", "confidence": 100.0, "snapshot": "pages/page-001.png", "raw_text": "raw/page-001.txt", "blocks": []})()
        markdown = markdown_document(metadata, [page], [{"id": "unit-1", "year": 2025, "pages": [1], "boundary_confidence": "source-document"}])
        self.assertIn("sha256:", markdown)
        self.assertIn("source-page: 2025/English.pdf#page=1", markdown)

    def test_invalid_processing_options_fail_before_work(self):
        args = argparse.Namespace(dpi=0, max_pdfs=None, workers=1)
        with self.assertRaises(SystemExit):
            validate_options(args)


if __name__ == "__main__":
    unittest.main()

