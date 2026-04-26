import os
import json
import time
import re
import logging
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)

FEEDBACK_PATH     = os.path.join(os.path.dirname(__file__), "feedback_store.jsonl")
MAX_FEWSHOT_CHARS = 3_000
MAX_EXAMPLES      = 3
MIN_CORRECTION_LEN = 20
MAX_RATING_THRESHOLD = 2       # Only use feedback rated ≤ 2 (bad outputs)
CACHE_TTL         = 60         # seconds

# ---------------------------------------------------------------------------
# In-memory cache
# ---------------------------------------------------------------------------

_feedback_cache: dict[str, object] = {
    "entries":    None,   # list[dict] | None
    "expires_at": 0.0,    # unix timestamp
}


# ---------------------------------------------------------------------------
# Sanitization
# ---------------------------------------------------------------------------

# Prompt-injection tokens to strip from any feedback text
_INJECTION_PATTERNS = re.compile(
    r"(```|<\|system\|>|<\|assistant\|>|<\|user\|>|<\|end\|>|"
    r"\[INST\]|\[/INST\]|###\s*(System|User|Assistant)\s*:|"
    r"<\|im_start\|>|<\|im_end\|>)",
    re.IGNORECASE,
)


def _sanitize(text: str) -> str:
    """Remove prompt-injection tokens and normalize whitespace."""
    text = _INJECTION_PATTERNS.sub("", text)
    # Collapse excessive blank lines to at most one
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# ---------------------------------------------------------------------------
# Diversity guard
# ---------------------------------------------------------------------------

def _is_near_duplicate(candidate: str, accepted: list[str], threshold: float = 0.85) -> bool:
    """Return True if candidate is suspiciously similar to any already-accepted correction."""
    for seen in accepted:
        ratio = SequenceMatcher(None, candidate, seen).ratio()
        if ratio >= threshold:
            return True
    return False


# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------

def _load_all_feedback_cached() -> list[dict]:
    """
    Return all raw feedback entries, re-reading the file at most once per
    CACHE_TTL seconds.
    """
    now = time.monotonic()
    if _feedback_cache["entries"] is not None and now < _feedback_cache["expires_at"]:
        return _feedback_cache["entries"]   # type: ignore[return-value]

    if not os.path.exists(FEEDBACK_PATH):
        logger.debug("Feedback file not found — cache returning empty list.")
        _feedback_cache["entries"]    = []
        _feedback_cache["expires_at"] = now + CACHE_TTL
        return []

    entries: list[dict] = []
    try:
        with open(FEEDBACK_PATH) as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    except Exception as exc:
        logger.warning("Could not read feedback file: %s", exc)
        # Return stale cache rather than crashing
        return _feedback_cache.get("entries") or []   # type: ignore[return-value]

    _feedback_cache["entries"]    = entries
    _feedback_cache["expires_at"] = now + CACHE_TTL
    logger.debug("Feedback cache refreshed: %d entries loaded.", len(entries))
    return entries


# ---------------------------------------------------------------------------
# Public API — drop-in replacements for the original functions
# ---------------------------------------------------------------------------

def load_feedback_examples(section: str, limit: int = MAX_EXAMPLES) -> list[dict]:
    """
    Return up to `limit` high-quality, sanitized, diverse feedback entries
    relevant to `section`.

    Selection pipeline:
      1. Load all entries (from cache)
      2. Filter: matching section, rating ≤ MAX_RATING_THRESHOLD,
                 non-empty original + correction, correction ≥ MIN_CORRECTION_LEN chars
      3. Sort: lowest rating → most recent timestamp
      4. Deduplicate: skip near-duplicate corrections
      5. Sanitize: strip prompt-injection tokens
      6. Return up to `limit` entries
    """
    all_entries = _load_all_feedback_cached()

    candidates: list[dict] = []
    for entry in all_entries:
        # --- Section filter ---
        entry_section = entry.get("section", "")
        if entry_section and entry_section != section:
            continue

        # --- Quality filter ---
        rating = entry.get("rating")
        if rating is None or rating > MAX_RATING_THRESHOLD:
            continue

        original   = (entry.get("original")   or "").strip()
        correction = (entry.get("correction") or "").strip()

        if not original or not correction:
            continue
        if len(correction) < MIN_CORRECTION_LEN:
            continue

        candidates.append(entry)

    if not candidates:
        return []

    # --- Sort: lowest rating first, then most recent ---
    candidates.sort(key=lambda e: (e.get("rating", 5), -e.get("ts", 0)))

    # --- Diversity pass ---
    selected: list[dict] = []
    seen_corrections: list[str] = []

    for entry in candidates:
        if len(selected) >= limit:
            break
        correction = _sanitize(entry["correction"])
        if _is_near_duplicate(correction, seen_corrections):
            logger.debug("Skipping near-duplicate feedback entry.")
            continue
        # Store sanitized versions back so format step doesn't re-sanitize
        selected.append({
            **entry,
            "original":   _sanitize(entry["original"]),
            "correction": correction,
        })
        seen_corrections.append(correction)

    logger.info(
        "load_feedback_examples: %d candidate(s) → %d selected for section '%s'.",
        len(candidates), len(selected), section,
    )
    return selected


def format_fewshot_block(examples: list[dict]) -> str:
    """
    Render selected feedback entries as a concise few-shot block capped at
    MAX_FEWSHOT_CHARS characters.
    """
    if not examples:
        return ""

    header = "Learn from these past mistakes before generating your response:\n"
    lines  = [header]
    total  = len(header)

    for i, ex in enumerate(examples, start=1):
        block = (
            f"[Example {i}]\n"
            f"Mistake:\n{ex['original']}\n\n"
            f"Correct version:\n{ex['correction']}\n"
        )
        if total + len(block) > MAX_FEWSHOT_CHARS:
            logger.debug("Few-shot block truncated at %d chars.", total)
            break
        lines.append(block)
        total += len(block)

    if len(lines) == 1:
        return ""   # header only — nothing fit

    return "\n".join(lines)


def build_system_prompt(base_prompt: str, section: str) -> str:
    """
    Augment `base_prompt` with a few-shot correction block derived from
    past feedback for `section`.  Returns `base_prompt` unchanged when no
    suitable feedback exists.
    """
    examples     = load_feedback_examples(section=section)
    fewshot_block = format_fewshot_block(examples)

    if not fewshot_block:
        return base_prompt

    logger.info("Injecting %d few-shot example(s) into prompt for section '%s'.",
                len(examples), section)
    return f"{base_prompt}\n\n{fewshot_block}"