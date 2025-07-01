# 👁️‍🗨️ Face Recognition Bot

A final-year project that combines face recognition, age/gender/emotion detection, and AI-driven summaries using Flask, DeepFace, and Ollama. Upload an image or video, and the system will identify known individuals, annotate faces, and provide natural feedback through an intelligent assistant.


## 🔧 Features

* ✅ **Face detection and analysis** (age, gender, emotion) with DeepFace
* 🧠 **AI-generated natural summaries** using Ollama (phi3 or any local model)
* 📷 **Image and video** support (video is processed frame-by-frame)
* 🗂 **Identity recognition** from a local face database (`face_db/staff/`)
* 📝 **Annotated image output** with detected faces boxed
* 🔁 **Auto-start Ollama** if not running
* 📦 **SQLite logging** of identity, file, authorization, and timestamp
* 📁 **Auto-cleanup** of old uploaded and annotated files
* 🌐 **CORS-enabled** API for frontend integration
* 🔒 **Authorization check** via `metadata.json` (e.g., staff, criminal, unknown)
- 🖼️ Upload image or video for face detection
- 🎥 Capture a photo or record a video directly using your webcam
- 🤖 Get identity, emotion, age, and gender for detected faces
- 💬 Chat with the bot — ask questions, get AI responses (via Ollama or GPT)
- 🧾 See if a person is recognized, authorized, or marked as a criminal
- 🧠 Face database lookup with tagging (staff, intruder, etc.)
- 🗂️ Multiple chat sessions — start new chats, switch sessions, or delete history
- 📸 View results with annotated thumbnails (clickable for full-size view)

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/yourusername/facebot-backend.git
cd facebot-backend
```

### 2. Install Dependencies

Make sure you’re using Python 3.8+.

```bash
pip install -r requirements.txt
```

### 3. Start Ollama

Install Ollama if not already installed:  
[https://ollama.com/download](https://ollama.com/download)

Then download a supported model (e.g. `phi3`):

```bash
ollama pull phi3
ollama serve
```

> ⚠️ The backend can also auto-start Ollama if not running.

### 4. Run the Flask App

```bash
python app.py
```

### 5. Folder Structure

```
.
├── app.py                  # Main Flask backend
├── facebot.db              # SQLite logs (auto-generated)
├── uploads/                # Incoming images and temp files
├── annotated/              # Annotated images
├── face_db/
│   └── staff/              # Known faces
│       └── metadata.json   # Info like name/title/authorization
├── requirements.txt
```

---

## 📦 Example metadata.json

Put this in `face_db/staff/metadata.json` to associate identities:

```json
{
  "john_doe.jpg": {
    "name": "John Doe",
    "title": "Security Manager",
    "authorized": true
  },
  "jane_doe.jpg": {
    "name": "Jane Doe",
    "title": "Suspect",
    "authorized": false
  }
}
```

---

## 🔍 API Endpoints

### `/upload` (POST)

Upload an image or video.

* **Returns:**
  * Face analysis (age, gender, emotion)
  * Annotated image URL
  * AI-generated summary
  * Identity & authorization info

### `/chat` (POST)

Send a text message to the assistant (optional).

### `/download/<filename>` (GET)

Download original or annotated file.


## 🧠 Technologies Used

| Tech         | Purpose                               |
| ------------ | ------------------------------------- |
| **Flask**    | Web backend                           |
| **DeepFace** | Face recognition & attribute analysis |
| **Ollama**   | AI chat assistant (local LLMs)        |
| **OpenCV**   | Image/video handling and annotation   |
| **SQLite**   | Local logging                         |
| **UUID**     | Unique filename generation            |
| **Werkzeug** | Secure upload handling                |


## 📸 Demo Screenshot

> Add a screenshot here of your UI or annotated output for clarity.



## ✅ Final-Year Project Ready?

**Yes.** This backend is well-structured, uses real-world AI tools, and demonstrates:

* Computer vision integration
* AI language model usage
* Real-time file handling
* Face identification and security logic
* API and database handling
* Fault tolerance and system control

If your frontend is also functional, this is more than enough for a complete, impressive final project.



## 📬 Credits

Developed by **Engineer Hussein Ngobi**  
University Final Year Project – 2025
