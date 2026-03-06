from __future__ import annotations

import chromadb
import httpx

from config import settings


def get_chroma_client() -> chromadb.PersistentClient:
    return chromadb.PersistentClient(path=settings.chroma_persist_dir)


def get_or_create_collection(collection_name: str) -> chromadb.Collection:
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )


def embed_text(text: str) -> list[float]:
    """Call the Ollama embeddings endpoint and return the embedding vector."""
    url = f"{settings.ollama_base_url}/api/embeddings"
    response = httpx.post(
        url,
        json={"model": settings.ollama_embed_model, "prompt": text},
        timeout=60,
    )
    response.raise_for_status()
    return response.json()["embedding"]


def add_document_chunks(collection_name: str, chunks: list[dict], doc_id: str) -> None:
    """Embed each chunk and upsert into the named ChromaDB collection."""
    collection = get_or_create_collection(collection_name)

    ids: list[str] = []
    embeddings: list[list[float]] = []
    documents: list[str] = []
    metadatas: list[dict] = []

    for i, chunk in enumerate(chunks):
        text = chunk["text"]
        embedding = embed_text(text)
        ids.append(f"{doc_id}_chunk_{i}")
        embeddings.append(embedding)
        documents.append(text)
        metadatas.append({"page": chunk["page"], "chunk_index": chunk["chunk_index"], "doc_id": doc_id})

    collection.upsert(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)


def query_collection(collection_name: str, query: str, n_results: int = 5) -> list[str]:
    """Embed the query, search the collection, and return matching text strings."""
    collection = get_or_create_collection(collection_name)
    query_embedding = embed_text(query)
    results = collection.query(query_embeddings=[query_embedding], n_results=n_results)
    # results["documents"] is a list of lists (one per query)
    docs = results.get("documents", [[]])[0]
    return [d for d in docs if d]
