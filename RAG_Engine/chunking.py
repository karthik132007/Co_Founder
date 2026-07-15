from __future__ import annotations

from pathlib import Path
from typing import Iterable

from langchain_experimental.text_splitter import SemanticChunker

from RAG_Engine.embeddings import generate_embeddings


class _EmbeddingAdapter:
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [generate_embeddings(text) for text in texts]

    def embed_query(self, text: str) -> list[float]:
        return generate_embeddings(text)


def _build_chunker() -> SemanticChunker:
    return SemanticChunker(
        _EmbeddingAdapter(),
        breakpoint_threshold_type="percentile",
    )


def chunk_text(text: str) -> list[str]:
    if not text or not text.strip():
        return []

    return _build_chunker().split_text(text)


def chunk_file(file_path: str | Path) -> list[dict]:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    text = path.read_text(encoding="utf-8")
    return chunk_document_text(text=text, file_path=str(path))


def chunk_document_text(text: str, file_path: str | None = None) -> list[dict]:
    chunks = chunk_text(text)

    return [
        {
            "file_path": file_path,
            "chunk_index": index,
            "chunk_text": chunk,
            "embedding": generate_embeddings(chunk),
        }
        for index, chunk in enumerate(chunks)
    ]


def chunk_files(file_paths: Iterable[str | Path]) -> list[dict]:
    embedded_chunks: list[dict] = []
    for file_path in file_paths:
        embedded_chunks.extend(chunk_file(file_path))
    return embedded_chunks
