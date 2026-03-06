# Kulmi 🎓 — AI Study Assistant

A RAG-powered study app. Upload your PDFs (notes, past papers, books) and let AI help you understand concepts, answer questions, and generate practice exams — all running **100% locally** via Ollama.

## Prerequisites

- [Node.js](https://nodejs.org) ≥ 18
- Python 3.12 (via pyenv or system)
- [Ollama](https://ollama.com) installed and running

### Pull required Ollama models

```bash
ollama pull llama3
ollama pull nomic-embed-text
```

---

## Setup

### Backend

```bash
cd backend

# Copy and edit env
cp .env.example .env

# Activate virtual env (already created)
source .venv/bin/activate

# Start server
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Copy and edit env
cp .env.local.example .env.local
# Set NEXTAUTH_SECRET to any long random string

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Features

| Mode | Description |
|------|-------------|
| 💬 Chat | Ask questions about your uploaded documents |
| 🧠 Explain | Get student-friendly explanations of concepts |
| 📝 Exam | Generate MCQ, short answer, or essay practice papers |

- 📄 PDF upload with automatic text extraction and embedding
- 🔐 User accounts — each user has their own document library
- 📱 Mobile-responsive PWA
- 💾 Chat history saved per session

---

## Stack

- **Frontend**: Next.js 15, Tailwind CSS, NextAuth v5
- **Backend**: FastAPI, SQLAlchemy (SQLite)
- **AI**: Ollama (llama3 for chat, nomic-embed-text for embeddings)
- **Vector DB**: ChromaDB (local persistence)
- **PDF parsing**: PyMuPDF
