import os
import uuid
import traceback
import json
import cv2
from flask import Flask, request, jsonify, send_file, url_for
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
import ollama
from deepface import DeepFace
import pandas as pd

# ─── CONFIGURATION ─────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)
app.wsgi_app = ProxyFix(app.wsgi_app)

UPLOAD_FOLDER = 'uploads'
ANNOTATED_FOLDER = 'annotated'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(ANNOTATED_FOLDER, exist_ok=True)

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi3").lower()
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ─── UTILITIES ─────────────────────────────────────────────────────────────────
def annotate_faces(img_path, faces):
    """Draw rectangles around detected faces and save annotated image."""
    img = cv2.imread(img_path)
    face_found = False
    for face in faces:
        region = face.get('region', {})
        if all(k in region for k in ['x', 'y', 'w', 'h']):
            face_found = True
            x, y, w, h = region['x'], region['y'], region['w'], region['h']
            cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)
    annotated_filename = f"annotated_{os.path.basename(img_path)}"
    annotated_path = os.path.join(ANNOTATED_FOLDER, annotated_filename)
    cv2.imwrite(annotated_path, img)
    return annotated_filename if face_found else None

def generate_summary(faces):
    """Convert DeepFace output into natural human-like summaries."""
    summaries = []
    for face in faces:
        age = face.get('age', 'unknown')
        gender = face.get('gender', '').lower()
        emotion = face.get('dominant_emotion', '').lower()
        summaries.append(f"Around {age} years old, {gender}, looking {emotion}.")
    return " ".join(summaries)

def load_identity_metadata():
    path = os.path.join("face_db", "staff", "metadata.json")
    if os.path.exists(path):
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception as e:
            print("⚠️ Error loading metadata.json:", e)
            return {}
    return {}

# ─── ROUTES ────────────────────────────────────────────────────────────────────
@app.route("/upload", methods=["POST"])
def upload():
    if 'file' not in request.files or request.files['file'].filename == '':
        return jsonify({"error": "No valid file uploaded."}), 400

    file = request.files['file']
    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file type. Please upload a .jpg or .png image."}), 400

    filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    try:
        # Step 1: Analyze face attributes
        analysis = DeepFace.analyze(
            img_path=file_path,
            actions=['age', 'gender', 'emotion'],
            enforce_detection=False
        )

        if not isinstance(analysis, list):
            analysis = [analysis]  # Normalize structure

        if not analysis or 'region' not in analysis[0] or analysis[0]['region'] == {}:
            return jsonify({
                "message": "⚠️ No face detected in the image.",
                "filename": filename,
                "results": [],
                "identity": "Unknown",
                "person_info": {},
                "annotated_image_url": None,
                "bot_reply": "Sorry, I couldn’t detect any recognizable face in the uploaded image."
            })

        # Step 2: Recognition
        recognition = DeepFace.find(
            img_path=file_path,
            db_path="face_db/staff",
            enforce_detection=False,
            detector_backend="opencv",
            model_name="VGG-Face"
        )

        identity = "Unknown"
        identity_path = None
        if isinstance(recognition, pd.DataFrame) and not recognition.empty:
            identity_path = recognition.iloc[0]['identity']
            identity = os.path.splitext(os.path.basename(identity_path))[0]

        # Step 3: Load metadata
        metadata = load_identity_metadata()
        matched_filename = os.path.basename(identity_path).replace(" ", "_").lower() if identity_path else ""
        person_info = metadata.get(matched_filename, {
            "name": identity,
            "title": "Unknown",
            "authorized": False
        })

        # Step 4: Annotate and summarize
        annotated_filename = annotate_faces(file_path, analysis)
        annotated_image_url = url_for('download', filename=annotated_filename, _external=True) if annotated_filename else None
        summary = generate_summary(analysis)
        full_description = (
            f"{summary} Identity match: {person_info['name']} ({person_info['title']}). "
            f"Authorization: {'✅ Authorized' if person_info['authorized'] else '❌ Not Authorized'}."
        )

        # Step 5: AI Feedback via Ollama
        ollama_response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[{
                "role": "system",
                "content": (
                    "You are a face recognition assistant created by Engineer Hussein Ngobi. "
                    "You help analyze facial attributes like age, gender, emotion, and identity. "
                    "Keep responses professional and on-topic. Never mention that you're an AI."
                )
            }, {
                "role": "user",
                "content": full_description
            }]
        )

        return jsonify({
            "message": "✅ Face analysis completed",
            "filename": annotated_filename,
            "results": analysis,
            "identity": identity,
            "person_info": person_info,
            "annotated_image_url": annotated_image_url,
            "bot_reply": ollama_response['message']['content']
        })

    except Exception as e:
        print("❌ Exception during face analysis:", str(e))
        traceback.print_exc()
        return jsonify({
            "error": "Something went wrong during face analysis.",
            "details": str(e),
            "trace": traceback.format_exc()
        }), 500

@app.route("/download/<filename>", methods=["GET"])
def download(filename):
    for folder in [UPLOAD_FOLDER, ANNOTATED_FOLDER]:
        path = os.path.join(folder, filename)
        if os.path.exists(path):
            return send_file(path, as_attachment=True)
    return jsonify({"error": "File not found"}), 404

@app.route("/chat", methods=["POST"])
def chat():
    user_msg = request.json.get("message")
    if not user_msg:
        return jsonify({"error": "Message is required"}), 400

    try:
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a face recognition assistant created by Engineer Hussein Ngobi. "
                        "Be concise, clear, and focus on face analysis or project-related topics."
                    )
                },
                {
                    "role": "user",
                    "content": user_msg
                }
            ]
        )
        return jsonify({"response": response['message']['content']})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Chat failed", "details": str(e)}), 500

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": f"✅ Ollama-based bot ({OLLAMA_MODEL}) is active!"})

# ─── START SERVER ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)