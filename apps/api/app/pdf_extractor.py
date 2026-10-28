from io import BytesIO

from pypdf import PdfReader
from pypdf.errors import PdfReadError


class PDFExtractionError(ValueError):
    """Raised when a PDF cannot be safely converted to text."""


def extract_pdf_text(contents: bytes) -> tuple[str, int]:
    try:
        reader = PdfReader(BytesIO(contents))

        if reader.is_encrypted:
            raise PDFExtractionError("Password-protected PDFs are not supported")

        page_text = [page.extract_text().strip() for page in reader.pages]
    except (PdfReadError, OSError, ValueError) as error:
        if isinstance(error, PDFExtractionError):
            raise
        raise PDFExtractionError("The uploaded PDF could not be read") from error

    text = "\n\n".join(value for value in page_text if value)
    if not text:
        raise PDFExtractionError(
            "No extractable text found; scanned PDFs may require OCR"
        )

    return text, len(reader.pages)
