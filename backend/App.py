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
 