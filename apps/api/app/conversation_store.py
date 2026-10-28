from asyncio import Lock
from uuid import UUID, uuid4


MAX_HISTORY_MESSAGES = 12


class ConversationNotFoundError(LookupError):
    """Raised when a client sends an unknown conversation ID."""


class InMemoryConversationStore:
    def __init__(self, max_messages: int = MAX_HISTORY_MESSAGES) -> None:
        self._max_messages = max_messages
        self._conversations: dict[UUID, list[dict[str, str]]] = {}
        self._lock = Lock()

    async def get_history(
        self, conversation_id: UUID | None
    ) -> tuple[UUID, list[dict[str, str]]]:
        if conversation_id is None:
            return uuid4(), []

        async with self._lock:
            if conversation_id not in self._conversations:
                raise ConversationNotFoundError("Conversation was not found")
            return conversation_id, list(self._conversations[conversation_id])

    async def append_turn(
        self,
        conversation_id: UUID,
        *,
        user_message: str,
        assistant_message: str,
    ) -> None:
        async with self._lock:
            history = self._conversations.setdefault(conversation_id, [])
            history.extend(
                [
                    {"role": "user", "content": user_message},
                    {"role": "assistant", "content": assistant_message},
                ]
            )
            self._conversations[conversation_id] = history[-self._max_messages :]


conversation_store = InMemoryConversationStore()
