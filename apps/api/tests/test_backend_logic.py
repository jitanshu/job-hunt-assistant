import unittest
from uuid import uuid4

from app.conversation_store import (
    ConversationNotFoundError,
    InMemoryConversationStore,
)
from app.draft_email_service import DraftEmailError, DraftPlan, build_email
from app.job_analysis_service import (
    JobAnalysisError,
    RawJobAnalysis,
    RequirementAssessment,
    calculate_match,
)
from app.text_chunker import chunk_text


class ChunkTextTests(unittest.TestCase):
    def test_chunks_stay_inside_limit_and_keep_overlap(self) -> None:
        text = "one two three four five six seven eight nine ten eleven twelve"

        chunks = chunk_text(text, max_chars=24, overlap_chars=8)

        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(len(chunk) <= 24 for chunk in chunks))
        adjacent_pairs = zip(chunks, chunks[1:])
        self.assertTrue(
            any(set(left.split()) & set(right.split()) for left, right in adjacent_pairs)
        )

    def test_rejects_invalid_chunk_settings(self) -> None:
        with self.assertRaises(ValueError):
            chunk_text("resume", max_chars=0)

        with self.assertRaises(ValueError):
            chunk_text("resume", max_chars=100, overlap_chars=100)


class JobMatchTests(unittest.TestCase):
    def test_score_uses_weights_and_rejects_fake_evidence(self) -> None:
        resume = "Built React Native apps and TypeScript APIs."
        analysis = RawJobAnalysis(
            requirements=[
                RequirementAssessment(
                    requirement="React Native",
                    importance="required",
                    match_level="full",
                    evidence="Built React Native apps",
                    explanation="Direct experience is present.",
                ),
                RequirementAssessment(
                    requirement="Python",
                    importance="required",
                    match_level="full",
                    evidence="Built Python services",
                    explanation="The model claimed Python experience.",
                ),
                RequirementAssessment(
                    requirement="TypeScript",
                    importance="preferred",
                    match_level="partial",
                    evidence="TypeScript APIs",
                    explanation="Related TypeScript evidence is present.",
                ),
            ]
        )

        result = calculate_match(analysis, resume)

        self.assertEqual(result.score, 50)
        self.assertEqual(result.matching_skills, ["React Native", "TypeScript"])
        self.assertEqual(result.missing_skills, ["Python"])
        self.assertEqual(result.requirements[1].match_level, "missing")
        self.assertIsNone(result.requirements[1].evidence)

    def test_rejects_analysis_without_requirements(self) -> None:
        with self.assertRaises(JobAnalysisError):
            calculate_match(RawJobAnalysis(requirements=[]), "resume")


class DraftEmailTests(unittest.TestCase):
    def test_email_uses_only_verified_resume_quotes(self) -> None:
        plan = DraftPlan(
            company="Example Co",
            role="Senior Mobile Engineer",
            evidence_quotes=[
                "Built React Native apps",
                "Managed a team of fifty engineers",
            ],
        )

        result = build_email(plan, "Built React Native apps for six years.")

        self.assertEqual(result.evidence_used, ["Built React Native apps"])
        self.assertIn("Built React Native apps", result.body)
        self.assertNotIn("fifty engineers", result.body)

    def test_rejects_draft_without_verified_evidence(self) -> None:
        plan = DraftPlan(
            company="Example Co",
            role="AI Engineer",
            evidence_quotes=["Built production AI agents"],
        )

        with self.assertRaises(DraftEmailError):
            build_email(plan, "Built React Native apps.")


class ConversationStoreTests(unittest.IsolatedAsyncioTestCase):
    async def test_history_keeps_only_the_latest_messages(self) -> None:
        store = InMemoryConversationStore(max_messages=4)
        conversation_id, history = await store.get_history(None)
        self.assertEqual(history, [])

        for turn in range(3):
            await store.append_turn(
                conversation_id,
                user_message=f"user-{turn}",
                assistant_message=f"assistant-{turn}",
            )

        _, saved_history = await store.get_history(conversation_id)

        self.assertEqual(
            saved_history,
            [
                {"role": "user", "content": "user-1"},
                {"role": "assistant", "content": "assistant-1"},
                {"role": "user", "content": "user-2"},
                {"role": "assistant", "content": "assistant-2"},
            ],
        )

    async def test_unknown_conversation_is_rejected(self) -> None:
        store = InMemoryConversationStore()

        with self.assertRaises(ConversationNotFoundError):
            await store.get_history(uuid4())


if __name__ == "__main__":
    unittest.main()
