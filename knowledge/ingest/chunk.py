from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass

from .extract import ExtractedBlock


@dataclass(frozen=True)
class Chunk:
    chunk_id: str
    chunk_index: int
    page_start: int
    page_end: int
    section_path: str
    text: str
    chunk_sha256: str
    token_count: int


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _tokens(text: str) -> int:
    return max(1, len(re.findall(r"\S+", text)))


def _sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def chunk_blocks(document_id: str, blocks: list[ExtractedBlock], target_tokens: int = 500, overlap_ratio: float = 0.15) -> list[Chunk]:
    """Never crosses a top-level section; identifiers are fully deterministic."""
    out: list[Chunk] = []
    current: list[ExtractedBlock] = []
    current_tokens = 0
    top_section = None

    def emit() -> None:
        nonlocal current, current_tokens
        if not current:
            return
        text = "\n\n".join(block.text for block in current)
        normalized = normalize_whitespace(text)
        digest = hashlib.sha256(normalized.encode()).hexdigest()
        index = len(out)
        chunk_id = hashlib.sha256(f"{document_id}|{index}|{digest}".encode()).hexdigest()[:32]
        out.append(Chunk(chunk_id, index, min(b.page for b in current), max(b.page for b in current), current[-1].section_path, text, digest, _tokens(text)))
        overlap = max(1, int(target_tokens * overlap_ratio))
        carry: list[ExtractedBlock] = []
        carried = 0
        for block in reversed(current):
            carry.insert(0, block)
            carried += _tokens(block.text)
            if carried >= overlap:
                break
        current, current_tokens = carry, carried

    for block in blocks:
        block_top = block.section_path.split(" > ")[0] if block.section_path else ""
        if top_section is not None and block_top != top_section:
            emit()
            current, current_tokens = [], 0
        top_section = block_top
        if block.is_table:
            emit()
            current, current_tokens = [block], _tokens(block.text)
            emit()
            current, current_tokens = [], 0
            continue
        for sentence in _sentences(block.text):
            sentence_block = ExtractedBlock(sentence, block.page, block.section_path)
            if current and current_tokens + _tokens(sentence) > target_tokens:
                emit()
            current.append(sentence_block)
            current_tokens += _tokens(sentence)
    emit()
    return out
