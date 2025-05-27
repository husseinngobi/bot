import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
from huggingface_hub import login
from dotenv import load_dotenv  # Import dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Get Hugging Face token from env variables
hf_token = os.getenv("HUGGINGFACE_API_KEY")
login(token=hf_token)  # Use token securely

# Load Llama 3 chatbot model
chatbot = pipeline("text-generation", model="meta-llama/Meta-Llama-3.1-8B", device_map="auto")

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