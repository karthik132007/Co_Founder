from __future__ import annotations

import logging
from pathlib import Path
from typing import Iterable

from langchain_experimental.text_splitter import SemanticChunker

from RAG_Engine.embeddings import generate_embeddings

logger = logging.getLogger(__name__)


class _EmbeddingAdapter:
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        results = [generate_embeddings(text) for text in texts]
        return results

    def embed_query(self, text: str) -> list[float]:
        result = generate_embeddings(text)
        return result


def _build_chunker() -> SemanticChunker:
    return SemanticChunker(
        _EmbeddingAdapter(),
        breakpoint_threshold_type="percentile",
    )


def chunk_text(text: str) -> list[str]:
    if not text or not text.strip():
        logger.warning("Empty text provided for chunking")
        return []

    chunks = _build_chunker().split_text(text)
    logger.info("Text chunked into %d chunks", len(chunks))
    return chunks


def chunk_file(file_path: str | Path) -> list[dict]:
    path = Path(file_path)
    logger.info("Chunking file: %s", path)
    if not path.exists():
        logger.error("File not found: %s", path)
        raise FileNotFoundError(f"File not found: {path}")

    text = path.read_text(encoding="utf-8")
    result = chunk_document_text(text=text, file_path=str(path))
    logger.info("File chunking complete for %s: %d chunks", path, len(result))
    return result


def chunk_document_text(text: str, file_path: str | None = None) -> list[dict]:
    logger.info("Chunking document text (length=%d, file_path=%s)", len(text) if text else 0, file_path)
    chunks = chunk_text(text)

    result = [
        {
            "file_path": file_path,
            "chunk_index": index,
            "chunk_text": chunk,
            "embedding": generate_embeddings(chunk),
        }
        for index, chunk in enumerate(chunks)
    ]
    logger.info("Document text chunking complete: %d chunks with embeddings", len(result))
    return result


def chunk_files(file_paths: Iterable[str | Path]) -> list[dict]:
    file_list = list(file_paths)
    logger.info("Chunking %d files", len(file_list))
    embedded_chunks: list[dict] = []
    for file_path in file_list:
        embedded_chunks.extend(chunk_file(file_path))
    logger.info("All files chunked: total %d embedded chunks", len(embedded_chunks))
    return embedded_chunks
