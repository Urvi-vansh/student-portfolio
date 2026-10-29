# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Performance Practical

The app uses route-based code splitting with `React.lazy()` and `Suspense` for
the Skills, Projects, Tasks, and Contact routes. Build and measurement notes are
available in [PERFORMANCE-LAB.md](PERFORMANCE-LAB.md).

The Task Manager backend caching practical is documented in
[CACHE-LAB.md](CACHE-LAB.md).

## AI Description Practical

The Task Manager can generate an editable description from a task title using
the OpenAI or Gemini API. The browser only calls the Express backend; provider
API keys stay server-side and must never be added to frontend variables such as
`VITE_*` or committed to Git. If both keys are configured, Gemini is used.

For local development, set `GEMINI_API_KEY` (or `OPENAI_API_KEY`) in
`task-manager/.env` (see `task-manager/.env.example`) and start the backend
from `task-manager`. With Docker Compose, put the key in the repository-root
`.env` file (see `.env.example`) before running `docker compose up --build`.
Without a key, or if the AI service fails or times out, the task form remains
usable and shows a fallback message. Generation is limited to one request per
client and task title per minute.

Only the task title is sent to the external AI provider. Do not send personal,
sensitive, confidential, or identifying information; review AI suggestions
before saving or relying on them.

## CI/CD Practical

The GitHub Actions workflow at `.github/workflows/ci.yml` runs the Task Manager
backend tests on every push to `main`. It installs dependencies in
`task-manager` and runs the existing Node.js test suite; a failed install or
test marks the workflow run as failed.

Run the same checks locally from the repository root with:

```sh
npm install --prefix task-manager
npm test --prefix task-manager
```

To observe both outcomes for the lab demonstration, temporarily change an
assertion in `task-manager/test/server.test.js` to an incorrect expected value
and push that change to `main`. The test step should fail and report the
assertion error. Restore the correct expectation and push again to see a
passing run. A missing or incorrect test path is a separate failure: the test
runner reports that it cannot find or run the tests, rather than reporting a
failed assertion.

## Containerization Practical

Docker and Docker Compose instructions are documented in
[CONTAINERIZATION-LAB.md](CONTAINERIZATION-LAB.md).

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
