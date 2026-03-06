from __future__ import annotations

import fitz  # PyMuPDF


def extract_text_chunks(filepath: str, chunk_size: int = 500, overlap: int = 50) -> list[dict]:
    """Open a PDF and return a list of text chunks with metadata.

    Each chunk is a dict with keys: text, page, chunk_index.
    """
    chunks: list[dict] = []
    doc = fitz.open(filepath)

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()

        start = 0
        chunk_index = 0
        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append(
                    {
                        "text": chunk_text,
                        "page": page_num + 1,  # 1-based page number
                        "chunk_index": chunk_index,
                    }
                )
            chunk_index += 1
            start += chunk_size - overlap  # advance with overlap

    doc.close()
    return chunks
