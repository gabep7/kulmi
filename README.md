# Kulmi

Upload your notes, past papers, or textbooks and use AI to actually understand them — ask questions, get explanations, generate practice exams. Chats are organised per set of documents so you can keep different subjects separate.

Supports local models via Ollama, or plug in a Groq or OpenAI API key if you'd rather not run things on your machine.

## Getting started

You'll need Node.js 18+, Python 3.12, and if you want local models, [Ollama](https://ollama.com) running with these two models pulled:

```bash
ollama pull llama3
ollama pull nomic-embed-text
```

First time setup:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

The `.env.local` file needs `NEXTAUTH_SECRET` set to any long random string — it just needs to exist. You can generate one with `openssl rand -hex 32`.

If you want to use Groq (free, fast, no local GPU needed), add your key to `backend/.env`:

```
GROQ_API_KEY=your_key_here
DEFAULT_PROVIDER=groq
```

Get a free key at [console.groq.com](https://console.groq.com).

## Running

```bash
./dev.sh
```

That's it. Both the backend and frontend start together. Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js, FastAPI, ChromaDB, SQLite, PyMuPDF. Talks to Ollama, Groq, or OpenAI depending on what you've configured.

