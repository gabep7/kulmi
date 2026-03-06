<p align="left">
  <img src="assets/logo.svg" alt="kulmi" width="160" />
</p>

> **kulmi** — *albanian for "the peak/summit"*

upload your notes, past papers, or textbooks and use ai to actually understand them. ask questions, get concepts explained, generate practice exams. chats are tied to specific documents so different subjects stay separate.

supports local models via ollama, or plug in a groq or openai api key if you'd rather not run things locally.

---

## features

- **chat** — ask anything about your documents
- **explain** — get clear, student-friendly breakdowns of complex concepts
- **exam** — generate practice papers (mcq, short answer, essay) from your material
- **folders** — organise documents by subject or module
- **multi-provider** — groq (free, fast), openai, or ollama for fully local inference

---

## getting started

you'll need node.js 18+, python 3.12, and [ollama](https://ollama.com) if you want local models.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

`NEXTAUTH_SECRET` in `.env.local` can be any long random string:

```bash
openssl rand -hex 32
```

for groq (free, recommended), get a key at [console.groq.com](https://console.groq.com) and add it to `backend/.env`:

```
GROQ_API_KEY=your_key_here
DEFAULT_PROVIDER=groq
```

---

## running

```bash
./dev.sh
```

starts both backend and frontend. open [http://localhost:3000](http://localhost:3000).

---

## stack

next.js 15 · fastapi · chromadb · sqlite · pymupdf · groq / openai / ollama
