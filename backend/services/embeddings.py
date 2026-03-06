from __future__ import annotations

import chromadb

from config import settings


def get_chroma_client() -> chromadb.PersistentClient:
    return chromadb.PersistentClient(path=settings.chroma_persist_dir)


def get_or_create_collection(collection_name: str) -> chromadb.Collection:
    # no custom embedding function — chromadb uses its bundled all-MiniLM-L6-v2 onnx model
    # this means no ollama required for rag to work
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )


def add_document_chunks(collection_name: str, chunks: list[dict], doc_id: str) -> None:
    collection = get_or_create_collection(collection_name)
    ids = [f"{doc_id}_chunk_{i}" for i, _ in enumerate(chunks)]
    documents = [chunk["text"] for chunk in chunks]
    metadatas = [
        {"page": chunk["page"], "chunk_index": chunk["chunk_index"], "doc_id": doc_id}
        for chunk in chunks
    ]
    # pass documents only — chromadb embeds them internally
    collection.upsert(ids=ids, documents=documents, metadatas=metadatas)


def query_collection(collection_name: str, query: str, n_results: int = 5) -> list[str]:
    collection = get_or_create_collection(collection_name)
    results = collection.query(query_texts=[query], n_results=n_results)
    docs = results.get("documents", [[]])[0]
    return [d for d in docs if d]
