import os
import json
import time
import logging
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv
import requests
 
load_dotenv()
 
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)
 
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
 
# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
HF_API_KEY = os.getenv("HF_API_KEY", "")          # Hugging Face token
HF_BASE_URL = "https://api-inference.huggingface.co/models"
 
# Open-source models available on HF Inference API (free tier)
MODELS = {
    "primary":   "mistralai/Mistral-7B-Instruct-v0.3",
    "fallback":  "HuggingFaceH4/zephyr-7b-beta",
    "fast":      "microsoft/Phi-3-mini-4k-instruct",
}
 
HEADERS = {
    "Authorization": f"Bearer {HF_API_KEY}",
    "Content-Type":  "application/json",
}
 
MAX_TOKENS   = 3000
TEMPERATURE  = 0.3
REQUEST_TIMEOUT = 120   # seconds
 

# ---------------------------------------------------------------------------
# HF Inference helpers
# ---------------------------------------------------------------------------
 
def _build_instruct_prompt(system: str, user: str, model_id: str) -> str:
    """Format prompt correctly for different instruct models."""
    if "mistral" in model_id.lower() or "mixtral" in model_id.lower():
        return f"[INST] {system}\n\n{user} [/INST]"
    if "zephyr" in model_id.lower():
        return f"<|system|>\n{system}</s>\n<|user|>\n{user}</s>\n<|assistant|>"
    if "phi" in model_id.lower():
        return f"<|system|>\n{system}<|end|>\n<|user|>\n{user}<|end|>\n<|assistant|>"
    # Generic fallback
    return f"### System:\n{system}\n\n### User:\n{user}\n\n### Assistant:"
 
 
def call_hf_model(system_prompt: str, user_prompt: str, model_key: str = "primary") -> str:
    """Call HF Inference API and return text response."""
    model_id = MODELS.get(model_key, MODELS["primary"])
    url      = f"{HF_BASE_URL}/{model_id}"
    prompt   = _build_instruct_prompt(system_prompt, user_prompt, model_id)
 
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens":  MAX_TOKENS,
            "temperature":     TEMPERATURE,
            "do_sample":       True,
            "return_full_text": False,
            "stop": ["</s>", "[INST]", "### User:"],
        },
        "options": {"wait_for_model": True, "use_cache": False},
    }
 
    logger.info("Calling HF model: %s", model_id)
    resp = requests.post(url, headers=HEADERS, json=payload, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
 
    data = resp.json()
    if isinstance(data, list) and data:
        return data[0].get("generated_text", "").strip()
    if isinstance(data, dict) and "generated_text" in data:
        return data["generated_text"].strip()
 
    raise ValueError(f"Unexpected HF response shape: {data}")
 
 
def call_hf_with_fallback(system_prompt: str, user_prompt: str) -> tuple[str, str]:
    """Try primary model, fall back gracefully. Returns (text, model_used)."""
    for key in ("primary", "fallback", "fast"):
        try:
            text = call_hf_model(system_prompt, user_prompt, key)
            return text, MODELS[key]
        except requests.exceptions.HTTPError as exc:
            status = exc.response.status_code if exc.response else 0
            logger.warning("Model %s → HTTP %s, trying next", MODELS[key], status)
            if status == 503:
                time.sleep(5)   # model loading — brief wait
        except Exception as exc:
            logger.warning("Model %s → %s, trying next", MODELS[key], exc)
 
    raise RuntimeError("All HF models unavailable. Check your HF_API_KEY and quota.")
 
# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------
 
LIT_QC_SYSTEM = """You are a senior research scientist performing a rapid literature quality-control check.
Given a scientific hypothesis, determine if this experiment has already been published.
 
Respond ONLY in valid JSON (no markdown, no prose outside JSON):
{
  "novelty_signal": "not found" | "similar work exists" | "exact match found",
  "confidence": "high" | "medium" | "low",
  "references": [
    {
      "title": "...",
      "authors": "...",
      "year": 2023,
      "journal": "...",
      "relevance": "one sentence why this is relevant"
    }
  ],
  "summary": "2-3 sentence plain English explanation of the novelty assessment"
}
 
Rules:
- Maximum 3 references
- If unsure, signal "similar work exists" (never hallucinate exact DOIs or PMIDs)
- Be fast and approximate, not exhaustive"""
 
LIT_QC_USER = "Scientific hypothesis to assess:\n\n{hypothesis}"
 
EXPERIMENT_SYSTEM = """You are a senior Principal Investigator (PI) and research operations lead with 20+ years of bench experience.
Generate a COMPLETE, OPERATIONALLY EXECUTABLE experiment plan.
 
The plan must be detailed enough that:
- A lab technician can follow it without asking questions
- A PI would approve the budget and timeline immediately
- Materials can be ordered on Monday, work starts Friday
 
Respond ONLY in valid JSON (no markdown fences, no prose outside JSON):
{
  "hypothesis": "clear testable statement",
  "experimental_design": {
    "type": "in vitro | in vivo | ex vivo | computational | clinical",
    "groups": ["Control: ...", "Treatment: ..."],
    "key_variables": {
      "independent": "...",
      "dependent": "...",
      "controlled": ["...", "..."]
    },
    "sample_size": "N=X per group, Y replicates, justification"
  },
  "protocol": [
    {
      "step": 1,
      "title": "Short title",
      "description": "Detailed instruction with exact concentrations, temperatures, durations, equipment",
      "duration": "e.g. 30 min",
      "critical_notes": "What can go wrong and how to avoid it"
    }
  ],
  "materials": [
    {
      "name": "Specific reagent/equipment name",
      "supplier": "Thermo Fisher | Sigma-Aldrich | etc.",
      "catalog_ref": "realistic catalog number format",
      "quantity": "amount needed",
      "unit_cost": 0.00,
      "total_cost": 0.00,
      "category": "reagent | consumable | equipment | cell_line | animal"
    }
  ],
  "budget": {
    "reagents_total": 0.00,
    "consumables_total": 0.00,
    "equipment_total": 0.00,
    "labor_total": 0.00,
    "overhead_total": 0.00,
    "grand_total": 0.00,
    "currency": "USD",
    "notes": "budget assumptions"
  },
  "timeline": [
    {
      "week": 1,
      "phase": "Phase name",
      "tasks": ["Task 1", "Task 2"],
      "dependencies": "what must be done first",
      "deliverable": "what is produced this week"
    }
  ],
  "validation": {
    "primary_metric": "what is measured",
    "success_threshold": "quantitative threshold",
    "statistical_test": "t-test | ANOVA | etc.",
    "sample_size_justification": "power calculation or precedent",
    "controls": ["Positive control: ...", "Negative control: ..."],
    "failure_criteria": "when to stop and re-design"
  },
  "risks": [
    {
      "risk": "description",
      "likelihood": "high | medium | low",
      "mitigation": "concrete action"
    }
  ]
}
 
Be decisive. Use exact numbers. No vague phrases like 'standard conditions' or 'as appropriate'."""
 
EXPERIMENT_USER = "Generate a complete experiment plan for this hypothesis:\n\n{hypothesis}"

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
 
@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "models": MODELS, "hf_key_set": bool(HF_API_KEY)})
 
 
@app.post("/api/literature-qc")
def literature_qc():
    """Stage 1: Rapid novelty / literature quality check."""
    body = request.get_json(silent=True) or {}
    hypothesis = (body.get("hypothesis") or "").strip()
 
    if not hypothesis:
        return jsonify({"error": "hypothesis is required"}), 400
    if len(hypothesis) > 2000:
        return jsonify({"error": "hypothesis too long (max 2000 chars)"}), 400
 
    try:
        raw, model_used = call_hf_with_fallback(
            LIT_QC_SYSTEM,
            LIT_QC_USER.format(hypothesis=hypothesis),
        )
        # Extract JSON from response (model may wrap it in prose)
        result = _extract_json(raw)
        result["model_used"] = model_used
        return jsonify(result)
 
    except json.JSONDecodeError:
        logger.error("JSON parse failed. Raw: %s", raw[:300])
        return jsonify({"error": "Model returned malformed JSON", "raw": raw[:500]}), 502
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except Exception as exc:
        logger.exception("literature_qc error")
        return jsonify({"error": str(exc)}), 500
 
 
@app.post("/api/experiment-plan")
def experiment_plan():
    """Stage 2: Full operational experiment plan."""
    body = request.get_json(silent=True) or {}
    hypothesis = (body.get("hypothesis") or "").strip()
 
    if not hypothesis:
        return jsonify({"error": "hypothesis is required"}), 400
 
    try:
        raw, model_used = call_hf_with_fallback(
            EXPERIMENT_SYSTEM,
            EXPERIMENT_USER.format(hypothesis=hypothesis),
        )
        result = _extract_json(raw)
        result["model_used"] = model_used
        return jsonify(result)
 
    except json.JSONDecodeError:
        logger.error("JSON parse failed. Raw: %s", raw[:300])
        return jsonify({"error": "Model returned malformed JSON", "raw": raw[:500]}), 502
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except Exception as exc:
        logger.exception("experiment_plan error")
        return jsonify({"error": str(exc)}), 500
 
 
@app.post("/api/feedback")
def save_feedback():
    """Stretch goal: save scientist review feedback for future few-shot improvement."""
    body = request.get_json(silent=True) or {}
    required = {"hypothesis", "section", "rating", "correction"}
    missing = required - body.keys()
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400
 
    # Persist to JSONL file (swap for a DB in production)
    feedback_path = os.path.join(os.path.dirname(__file__), "feedback_store.jsonl")
    entry = {
        "ts": time.time(),
        "hypothesis": body["hypothesis"][:500],
        "experiment_type": body.get("experiment_type", "unknown"),
        "section": body["section"],
        "rating": body["rating"],
        "correction": body["correction"][:2000],
        "original": body.get("original", "")[:2000],
    }
    with open(feedback_path, "a") as fh:
        fh.write(json.dumps(entry) + "\n")
 
    logger.info("Feedback saved: section=%s rating=%s", entry["section"], entry["rating"])
    return jsonify({"status": "saved", "id": int(time.time())})
 
 
@app.get("/api/feedback/stats")
def feedback_stats():
    """Return aggregate feedback stats."""
    feedback_path = os.path.join(os.path.dirname(__file__), "feedback_store.jsonl")
    if not os.path.exists(feedback_path):
        return jsonify({"total": 0, "by_section": {}})
 
    entries = []
    with open(feedback_path) as fh:
        for line in fh:
            try:
                entries.append(json.loads(line))
            except Exception:
                pass
 
    by_section: dict[str, list] = {}
    for e in entries:
        by_section.setdefault(e["section"], []).append(e["rating"])
 
    stats = {
        "total": len(entries),
        "by_section": {
            sec: {
                "count": len(ratings),
                "avg_rating": round(sum(ratings) / len(ratings), 2),
            }
            for sec, ratings in by_section.items()
        },
    }
    return jsonify(stats)