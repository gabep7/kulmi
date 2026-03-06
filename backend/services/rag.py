from __future__ import annotations


def build_chat_prompt(context_chunks: list[str], question: str) -> tuple[str, str]:
    system = (
        "You are Kulmi, an intelligent study assistant. "
        "Use ONLY the provided context to answer. "
        "If the answer isn't in the context, say so clearly."
    )
    context_text = _format_chunks(context_chunks)
    prompt = f"{context_text}\n\nQuestion: {question}"
    return system, prompt


def build_explain_prompt(context_chunks: list[str], concept: str) -> tuple[str, str]:
    system = (
        "You are Kulmi, a friendly and patient study assistant. "
        "Explain concepts clearly and concisely for students. "
        "Use simple language, concrete examples, and analogies where helpful. "
        "Base your explanation strictly on the provided context."
    )
    context_text = _format_chunks(context_chunks)
    prompt = f"{context_text}\n\nPlease explain the following concept in a student-friendly way: {concept}"
    return system, prompt


def build_exam_prompt(context_chunks: list[str], num_questions: int, question_type: str) -> tuple[str, str]:
    type_instructions = {
        "mcq": (
            "multiple-choice questions (MCQ). Each question must have 4 options (A, B, C, D) "
            "with exactly one correct answer. Indicate the correct answer at the end."
        ),
        "short_answer": "short-answer questions. Each answer should be answerable in 2-3 sentences.",
        "essay": "essay questions. Each question should require a detailed, paragraph-length response.",
    }
    q_instruction = type_instructions.get(question_type, type_instructions["mcq"])

    system = (
        "You are Kulmi, an expert exam creator. "
        "Generate a well-structured exam paper based strictly on the provided study material. "
        "Number each question clearly. Do not include information outside the provided context."
    )
    context_text = _format_chunks(context_chunks)
    prompt = (
        f"{context_text}\n\n"
        f"Based on the study material above, generate {num_questions} {q_instruction}"
    )
    return system, prompt


def _format_chunks(chunks: list[str]) -> str:
    lines = ["Context:"]
    for i, chunk in enumerate(chunks, start=1):
        lines.append(f"[{i}] {chunk}")
    return "\n".join(lines)
