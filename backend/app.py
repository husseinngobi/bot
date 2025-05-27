import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
import torch
from huggingface_hub import login
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Get Hugging Face token from env variables
hf_token = os.getenv("HUGGINGFACE_API_KEY")
login(token=hf_token)  # Use token securely

# Model details
model_name = "meta-llama/Meta-Llama-3.1-8B"
offload_directory = "/mnt/hf_cache"  # Ensure this directory has enough space

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Load model with disk offloading
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,  # Optimize memory usage
    device_map="auto",  # Automatically allocate resources
    offload_folder=offload_directory  # Offload parts of the model to disk
)

# Initialize chatbot pipeline
chatbot = pipeline("text-generation", model=model, tokenizer=tokenizer)

@app.route("/chat", methods=["POST"])
def chat():
    user_msg = request.json["message"]
    bot_response = chatbot(user_msg, max_length=100)[0]["generated_text"]
    return jsonify({"response": bot_response})

@app.route("/upload", methods=["POST"])
def upload():
    file = request.files["image"]  # Process image files
    return jsonify({"message": "✅ Image uploaded! AI will analyze now."})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)