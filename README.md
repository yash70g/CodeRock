# CodeRoom

A platform for professors to create programming assignments and for students to submit code. The backend runs code using Judge0 and evaluates submissions test-case-by-test-case; results are persisted for audit.

## startup

npm start Backend,Frontend indiviudally 

## Local Judge0 (recommended for development)
Run Judge0 locally using Docker. else docker snippet:

```yaml
version: "3.8"
services:
  judge0:
    image: judge0/api:latest
    ports:
      - "2358:2358"
    restart: unless-stopped

  backend:
    build: ./Backend
    environment:
      - JUDGE0_URL=http://judge0:2358/submissions
    depends_on:
      - judge0
    ports:
      - "8080:8080"
```

If you run backend on your host (not in Docker), set:
```
JUDGE0_URL=http://localhost:2358/submissions
```

## Environment variables
- `JUDGE0_URL` - (optional) URL to Judge0 API (defaults to external Judge0 if not set). Must include `/submissions` path.
- `RAPIDAPI_KEY` - (optional) key used when connecting to RapidAPI-hosted Judge0.

## Tests
Backend tests use Jest and mock Judge0 calls. Run:
```bash
cd Backend
npm test
```

## Notes
- Testcases may include an explicit `output` field; when present it is used as the ground truth. Otherwise the solution code is executed to generate expected output (backfill route `POST /professors/generateTestcaseOutputs` is available).
- Temp files used for comparisons are cleaned up automatically with retries to handle transient file locks (Windows).

Thanks to [@sakshamsahgal](https://github.com/SakshamSahgal) for the base architecture and workflows.
