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
 