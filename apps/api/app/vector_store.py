from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path

import chromadb


COLLECTION_NAME = "resume_chunks"


class VectorStoreError(RuntimeError):
    """Raised when resume chunks cannot be persisted."""


class ResumeNotFoundError(VectorStoreError):
    """Raised when no resume chunks have been stored yet."""


@dataclass(frozen=True)
class StoreResult:
    resume_id: str
    stored_chunk_count: int


@dataclass(frozen=True)
class RetrievedChunk:
    text: str
    distance: float
    chunk_index: int


def store_resume_chunks(
    chunks: list[str],
    embeddings: list[list[float]],
    *,
    filename: str,
    embedding_model: str,
    chroma_path: Path,
) -> StoreResult:
    if not chunks or len(chunks) != len(embeddings):
        raise VectorStoreError("Chunks and embeddings must have matching values")

    resume_id = sha256("\n".join(chunks).encode("utf-8")).hexdigest()[:16]
    safe_filename = filename.replace("\\", "/").rsplit("/", maxsplit=1)[-1]
    ids = [f"{resume_id}:{index}" for index in range(len(chunks))]
    metadatas = [
        {
            "document_type": "resume",
            "resume_id": resume_id,
            "source": safe_filename,
            "chunk_index": index,
            "embedding_model": embedding_model,
        }
        for index in range(len(chunks))
    ]

    try:
        client = chromadb.PersistentClient(path=str(chroma_path))
        collection = client.get_or_create_collection(name=COLLECTION_NAME)
        collection.upsert(
            ids=ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        collection.delete(where={"resume_id": {"$ne": resume_id}})
    except Exception as error:
        raise VectorStoreError("Resume chunks could not be stored") from error

    return StoreResult(resume_id=resume_id, stored_chunk_count=len(chunks))


def search_resume_chunks(
    query_embedding: list[float],
    *,
    chroma_path: Path,
    limit: int = 4,
) -> list[RetrievedChunk]:
    try:
        client = chromadb.PersistentClient(path=str(chroma_path))
        collection_names = {collection.name for collection in client.list_collections()}
        if COLLECTION_NAME not in collection_names:
            raise ResumeNotFoundError("Upload a resume before asking questions")

        collection = client.get_collection(COLLECTION_NAME)
        if collection.count() == 0:
            raise ResumeNotFoundError("Upload a resume before asking questions")

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(limit, collection.count()),
            include=["documents", "metadatas", "distances"],
        )
    except ResumeNotFoundError:
        raise
    except Exception as error:
        raise VectorStoreError("Resume search failed") from error

    documents = results["documents"][0] if results["documents"] else []
    metadatas = results["metadatas"][0] if results["metadatas"] else []
    distances = results["distances"][0] if results["distances"] else []

    return [
        RetrievedChunk(
            text=document,
            distance=float(distance),
            chunk_index=int(metadata["chunk_index"]),
        )
        for document, metadata, distance in zip(
            documents, metadatas, distances, strict=True
        )
    ]


def get_all_resume_chunks(*, chroma_path: Path) -> list[str]:
    try:
        client = chromadb.PersistentClient(path=str(chroma_path))
        collection_names = {collection.name for collection in client.list_collections()}
        if COLLECTION_NAME not in collection_names:
            raise ResumeNotFoundError("Upload a resume before analyzing a job")

        collection = client.get_collection(COLLECTION_NAME)
        results = collection.get(include=["documents", "metadatas"])
    except ResumeNotFoundError:
        raise
    except Exception as error:
        raise VectorStoreError("Resume could not be loaded") from error

    documents = results["documents"] or []
    metadatas = results["metadatas"] or []
    ordered_pairs = sorted(
        zip(documents, metadatas, strict=True),
        key=lambda pair: int(pair[1]["chunk_index"]),
    )
    if not ordered_pairs:
        raise ResumeNotFoundError("Upload a resume before analyzing a job")

    return [document for document, _ in ordered_pairs]
