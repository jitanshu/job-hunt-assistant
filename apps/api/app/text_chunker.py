DEFAULT_CHUNK_SIZE = 1_000
DEFAULT_CHUNK_OVERLAP = 150


def _looks_like_heading(value: str) -> bool:
    return len(value) <= 60 and any(character.isalpha() for character in value) and not any(
        character.islower() for character in value
    )


def _split_oversized_line(line: str, max_chars: int) -> list[str]:
    pieces: list[str] = []
    current_words: list[str] = []
    current_length = 0

    for word in line.split():
        if len(word) > max_chars:
            if current_words:
                pieces.append(" ".join(current_words))
                current_words = []
                current_length = 0
            pieces.extend(
                word[start : start + max_chars]
                for start in range(0, len(word), max_chars)
            )
            continue

        separator_length = 1 if current_words else 0
        if current_length + separator_length + len(word) > max_chars:
            pieces.append(" ".join(current_words))
            current_words = [word]
            current_length = len(word)
        else:
            current_words.append(word)
            current_length += separator_length + len(word)

    if current_words:
        pieces.append(" ".join(current_words))

    return pieces


def _overlap_tail(text: str, max_chars: int) -> str:
    if max_chars == 0:
        return ""

    selected_words: list[str] = []
    selected_length = 0

    for word in reversed(text.split()):
        added_length = len(word) + (1 if selected_words else 0)
        if selected_length + added_length > max_chars:
            break
        selected_words.append(word)
        selected_length += added_length

    return " ".join(reversed(selected_words))


def chunk_text(
    text: str,
    max_chars: int = DEFAULT_CHUNK_SIZE,
    overlap_chars: int = DEFAULT_CHUNK_OVERLAP,
) -> list[str]:
    if max_chars <= 0:
        raise ValueError("max_chars must be greater than zero")
    if overlap_chars < 0 or overlap_chars >= max_chars:
        raise ValueError("overlap_chars must be between zero and max_chars")

    lines = [" ".join(line.split()) for line in text.splitlines() if line.strip()]
    units = [
        piece
        for line in lines
        for piece in (
            [line] if len(line) <= max_chars else _split_oversized_line(line, max_chars)
        )
    ]

    chunks: list[str] = []
    current_units: list[str] = []

    for unit in units:
        candidate = "\n".join([*current_units, unit])
        if len(candidate) <= max_chars:
            current_units.append(unit)
            continue

        carried_heading = ""
        if current_units and _looks_like_heading(current_units[-1]):
            heading_candidate = f"{current_units[-1]}\n{unit}"
            if len(heading_candidate) <= max_chars:
                carried_heading = current_units.pop()

        completed_chunk = "\n".join(current_units)
        chunks.append(completed_chunk)

        overlap = _overlap_tail(completed_chunk, overlap_chars)
        current_units = [value for value in (overlap, carried_heading, unit) if value]
        if len("\n".join(current_units)) > max_chars:
            current_units = [value for value in (carried_heading, unit) if value]

    if current_units:
        chunks.append("\n".join(current_units))

    return chunks
