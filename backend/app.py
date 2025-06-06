import os
import uuid
import subprocess
import json
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from deepface import DeepFace

# Create Flask app
app = Flask(__name__)
CORS(app)

# Upload folder setup
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Choose your model here: "phi3" or "mistral"
OLLAMA_MODEL = "mistral"

# Store chat history
chat_history = []

@app.route("/upload", methods=["POST"])
def upload():
    """Handles file uploads and DeepFace analysis"""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Save file with a unique name
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    try:
        # Analyze the image using DeepFace
        analysis = DeepFace.analyze(
            img_path=file_path,
            actions=['age', 'gender', 'emotion'],
            enforce_detection=False
        )

        result = {
            "message": "✅ Face analysis complete",
            "results": analysis
        }
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": "Face analysis failed", "details": str(e)}), 500

@app.route("/download/<filename>", methods=["GET"])
def download(filename):
    """Allows downloading uploaded files"""
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    return send_file(file_path, as_attachment=True)

@app.route("/chat", methods=["POST"])
def chat():
    """Handles chatbot interactions using Ollama with system prompt injection"""
    user_msg = request.json.get("message")
    print(f"Received message: {user_msg}")

    if not user_msg:
        return jsonify({"error": "Message field is missing"}), 400

    # Inject system-style prompt before the user's message
    system_prompt = (
        "You are a face recognition bot created by Engineer Hussein Ngobi. "
        "Your job is to help users with tasks related to face detection, identifying people from a database, "
        "estimating age, gender, emotion, and triggering alerts. Always stay on topic. "
        "Do not say you're Mistral or an AI model. Use clear, friendly, expert language.\n\n"
        f"User: {user_msg}\nAssistant:"
    )

    try:
        result = subprocess.run(
            ["ollama", "run", OLLAMA_MODEL],
            input=system_prompt.encode(),
            capture_output=True,
            check=True
        )
        response_text = result.stdout.decode().strip()
        return jsonify({"response": response_text})

    except subprocess.CalledProcessError as e:
        return jsonify({"error": "Ollama failed", "details": e.stderr.decode()}), 500

@app.route("/", methods=["GET"])
def home():
    """Root route confirming app status"""
    return jsonify({"message": f"✅ Ollama-based bot ({OLLAMA_MODEL}) is running!"})

if __name__ == "__main__":
    print(">>> URL MAP <<<")
    print(app.url_map)
    app.run(debug=True, host="0.0.0.0", port=5000)