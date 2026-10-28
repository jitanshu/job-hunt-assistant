from openai import AsyncOpenAI, OpenAIError


class EmbeddingConfigurationError(RuntimeError):
    """Raised when embedding configuration is incomplete."""


class EmbeddingServiceError(RuntimeError):
    """Raised when the embedding provider request fails."""


async def create_embeddings(
    texts: list[str],
    *,
    api_key: str | None,
    model: str,
) -> list[list[float]]:
    if not api_key:
        raise EmbeddingConfigurationError("OPENAI_API_KEY is not configured")
    if not texts:
        return []

    try:
        async with AsyncOpenAI(api_key=api_key) as client:
            response = await client.embeddings.create(
                input=texts,
                model=model,
                encoding_format="float",
            )
    except OpenAIError as error:
        raise EmbeddingServiceError("Embedding provider request failed") from error

    ordered_data = sorted(response.data, key=lambda item: item.index)
    embeddings = [item.embedding for item in ordered_data]
    if len(embeddings) != len(texts):
        raise EmbeddingServiceError("Embedding provider returned an incomplete batch")

    return embeddings
