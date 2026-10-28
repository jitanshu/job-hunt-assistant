# Progress Tracker

## Completed

- Step 1: Initialized the monorepo structure for API, mobile, and documentation.
- Added Git ignore rules for secrets, dependencies, generated files, resumes,
  and local Chroma data.
- Step 2: Added a minimal FastAPI server with a typed `GET /health` endpoint.
- Step 3: Added validated PDF resume upload and in-memory text extraction.
- Step 4: Added line-aware text chunking with bounded chunk size and overlap.
- Step 5: Added OpenAI batch embeddings and persistent Chroma chunk storage.
- Step 6: Added semantic resume search and single-turn grounded answers.
- Step 7: Added explainable job matching with backend-calculated scoring.
- Step 8: Added validated agent tools for resume search, job scoring, and
  grounded email drafting.
- Step 9: Added bounded, multi-turn conversation history using a client-carried
  conversation ID.
- Step 10A: Initialized the Expo SDK 58 and TypeScript mobile client with a
  minimal Expo Router app shell.
- Step 10B: Added PDF selection, client-side checks, upload state, error
  handling, and the mobile connection to `POST /ingest`.
- Step 10C: Added job-description input, `POST /analyze` integration, match
  score, matched and missing skills, and requirement-level evidence.
- Step 10D: Added multi-turn AI chat, backend-carried conversation IDs, current
  job context, tool visibility, resume source counts, and a Draft Email action.
- Step 11A: Added focused unit tests for chunking, weighted job scoring, fake
  evidence rejection, grounded email drafts, and bounded conversation history.
- Step 11B: Added a portfolio-ready root README, architecture and setup notes,
  honest limitations, test commands, and Git ignore/secret checks.
- Step 11C: Added privacy-safe iOS Simulator screenshots and documented the
  complete application working flow.

## Concepts learned

- A monorepo keeps related applications in one repository while preserving
  clear workspace boundaries.
- Generated files, secrets, and private user data do not belong in Git.
- FastAPI uses Python type hints and Pydantic models to validate and document
  API response shapes.
- Multipart upload carries files separately from JSON, and `pypdf` extracts an
  existing text layer but does not perform OCR on scanned images.
- Chunk overlap preserves context near boundaries, but excessive overlap causes
  duplicate embeddings and increases retrieval cost.
- Embeddings convert text into vectors whose distance represents semantic
  similarity; Chroma stores those vectors with their source text and metadata.
- RAG first finds useful resume chunks, then gives only those chunks to the LLM
  so the answer has evidence and is less likely to invent facts.
- The LLM labels each requirement, but backend code verifies evidence and
  calculates the final score using fixed weights.
- The agent chooses a tool, but Pydantic validates its arguments and backend
  code performs the actual work.
- Multi-turn chat sends recent user and assistant messages with each request;
  the history is bounded so prompts do not grow forever.
- Expo Router uses files under `src/app` as app screens, similar to file-based
  routing in modern React web frameworks.
- React Native uploads a picked file with `FormData`; the runtime must add the
  multipart boundary, so the `Content-Type` header is not set manually.
- Expo SDK 58 file uploads need a real `File`/`Blob`; casting a `{ uri, name,
  type }` object only satisfies TypeScript and can still fail at runtime.
- The mobile client displays the backend score instead of recalculating it, so
  the scoring rules have one source of truth.
- Chat sends a compact user message and the full job description as separate
  validated fields; the backend keeps the conversation ID and executes tools.
- AI tests should cover deterministic code around the model; live LLM calls
  belong in slower integration or evaluation suites, not basic unit tests.
- A strong portfolio README explains tradeoffs and limitations instead of
  claiming production readiness that the code does not have.
- Public screenshots should use empty or fake data so personal resume and job
  information never becomes part of Git history.

## Weak concepts

- Retrieval quality still needs tuning with real resume questions.
- In-memory chat history is not shared across workers and disappears on restart.
- The mobile upload flow still needs a real-device check using the computer's
  LAN API address.
- AI chat and Draft Email still need a manual end-to-end Simulator check.
- Expo's current transitive CLI/config dependencies have npm audit advisories;
  the available forced fix is a breaking SDK downgrade and was not applied.

## Next step

- Record a short end-to-end demo with fake resume data for the portfolio.
