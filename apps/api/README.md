# API

FastAPI backend for the Job Hunt Assistant.

## Run locally

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r apps/api/requirements.txt
cp .env.example .env
# Add your OPENAI_API_KEY to .env
uvicorn app.main:app --app-dir apps/api --reload
```

The API runs at `http://127.0.0.1:8000`. Check it with:

```bash
curl http://127.0.0.1:8000/health
```

Upload a PDF resume (maximum 5 MB):

```bash
curl -X POST http://127.0.0.1:8000/ingest \
  -F "file=@/path/to/resume.pdf;type=application/pdf"
```

The endpoint extracts existing PDF text in memory, creates OpenAI embeddings,
and persists the chunks plus metadata in local Chroma. For this single-user MVP,
a successful new upload replaces older resume chunks. Image-only or scanned
PDFs need OCR, which is not part of the current MVP step.

Ask a single-turn question grounded in the uploaded resume:

```bash
curl -X POST http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What React Native experience does the candidate have?"}'
```

The agent chooses one of three backend tools: `search_my_experience`,
`score_match`, or `draft_email`. Tool arguments are validated before backend
execution. The response includes `tools_used` and any resume chunks used as
proof.

The first response also returns a `conversation_id`. Send it with the next
message to keep the last six question-answer pairs in context:

```json
{
  "message": "What about Expo?",
  "conversation_id": "the-id-from-the-first-response"
}
```

Conversation history currently lives in server memory and is cleared when the
server restarts. OpenAI response storage remains disabled.

Compare a job description with the stored resume:

```bash
curl -X POST http://127.0.0.1:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"job_description":"We need a React Native developer..."}'
```

The backend verifies quoted resume evidence and calculates the score itself.
Required items count twice as much as preferred items.

## Run tests

The focused unit tests do not call OpenAI or require an API key:

```bash
cd apps/api
../../.venv/bin/python -m unittest discover -s tests -v
```
