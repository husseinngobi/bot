import React, { useState, useRef, useEffect, useCallback } from "react";
import { fetchChatResponse, uploadFile } from "./api";
import "./styles.css";
import Sidebar from "./Sidebar";

const Chatbot = () => {
  const [chatSessions, setChatSessions] = useState([
    {
      id: 1,
      title: "Chat 1",
      timestamp: Date.now(),
      messages: [
        {
          text: "Hello! Upload an image or video and I'll analyze it 😊",
          isBot: true,
        },
      ],
    },
  ]);
  const [currentSessionId, setCurrentSessionId] = useState(1);
  const [modalImage, setModalImage] = useState(null);
  const messages = chatSessions.find((s) => s.id === currentSessionId)?.messages || [];

  const [inputText, setInputText] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);
  const chatDisplayRef = useRef(null);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const addMessage = useCallback((text, isBot) => {
  const newMsg = { text, isBot };
  setChatSessions(prev =>
    prev.map(s =>
      s.id === currentSessionId
        ? { ...s, messages: [...s.messages, newMsg] }
        : s
    )
  );
}, [currentSessionId]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/") && !selectedFile.type.startsWith("video/")) {
      addMessage("❌ Unsupported file type. Please upload an image or video.", true);
      return;
    }
    if (
  (selectedFile.type.startsWith("image/") && selectedFile.size > 5 * 1024 * 1024) ||
  (selectedFile.type.startsWith("video/") && selectedFile.size > 50 * 1024 * 1024)
) {
  addMessage("❌ File too large. Max size is 5MB for images, 50MB for videos.", true);
  return;
}

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selectedFile);

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    addMessage(`📤 Uploaded: ${selectedFile.name}`, false);
    addMessage("🔍 Analyzing media...", true);

    try {
      setIsLoading(true);
      const data = await uploadFile(selectedFile);
    

// Remove "Analyzing media..." message
setChatSessions((prevSessions) =>
  prevSessions.map((s) =>
    s.id === currentSessionId
      ? {
          ...s,
          messages: s.messages.filter((msg) => msg.text !== "🔍 Analyzing media..."),
        }
      : s
  )
);

// Show error if upload failed
if (!data.success) {
  addMessage(`❌ Error: ${data.error}`, true);
  return;
}

// Show annotated image
if (data.annotatedImageUrl || data.annotated_image_url) {
  const url = data.annotatedImageUrl || data.annotated_image_url;
  addMessage(
    <div>
      <p>📷 <em>Click to view annotated image</em></p>
      <img
        src={url}
        alt="Annotated"
        className="annotated-thumbnail"
        style={{ maxWidth: "200px", borderRadius: "10px", cursor: "pointer" }}
        onClick={() => setModalImage(url)}
        onError={e => e.target.style.display = 'none'}
      />
    </div>,
    true
  );
}

// Show DeepFace results with face count
if (Array.isArray(data.results) && data.results.length > 0) {
  addMessage(`🧠 Detected ${data.results.length} face(s).`, true);
  data.results.forEach((face, i) => {
    addMessage(
      `👤 Person ${i + 1}: Age ${face.age}, Gender ${face.gender}, Emotion ${face.emotion}`,
      true
    );
  });
} else if (Array.isArray(data.results) && data.results.length === 0) {
  addMessage("⚠️ No faces were detected in the uploaded image.", true);
}


// Show identity info
if (data.person_info && data.person_info.name) {
  const { name, title = "Unknown", authorized = false } = data.person_info;
  addMessage(
    `🧾 Identity: ${name} (${title}) — ${authorized ? "✅ Authorized" : "❌ Not Authorized"}`,
    true
  );
}

// Show bot reply
if (data.botReply || data.bot_reply) {
  addMessage(`🧠 ${data.botReply || data.bot_reply}`, true);
}
    } catch (error) {
      console.error("Upload error:", error);
      setChatSessions((prevSessions) =>
        prevSessions.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: s.messages.filter((msg) => msg.text !== "🔍 Analyzing media..."),
              }
            : s
        )
      );
      addMessage("❌ Error processing the file", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    addMessage(inputText, false);
    setInputText("");
    addMessage("🤖 Thinking...", true);

    try {
      setIsLoading(true);
      const data = await fetchChatResponse(inputText);

      setChatSessions((prevSessions) =>
        prevSessions.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: s.messages
                  .filter((msg) => msg.text !== "🤖 Thinking...")
                  .concat({ text: data.response, isBot: true }),
              }
            : s
        )
      );
    } catch (error) {
      console.error("Chat error:", error);
      setChatSessions((prevSessions) =>
        prevSessions.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: s.messages
                  .filter((msg) => msg.text !== "🤖 Thinking...")
                  .concat({ text: "❌ Error connecting to AI service", isBot: true }),
              }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    const newId = Date.now() + Math.floor(Math.random() * 1000);
    const newSession = {
      id: newId,
      title: `Chat ${chatSessions.length + 1}`,
      messages: [
        {
          text: "Hello! Upload an image or video and I'll analyze it 😊",
          isBot: true,
        },
      ],
    };
    setChatSessions([...chatSessions, newSession]);
    setCurrentSessionId(newId);
    setIsSidebarOpen(false);
  };

  const handleDeleteChat = (id) => {
    const filtered = chatSessions.filter((s) => s.id !== id);
    setChatSessions(filtered);

    if (id === currentSessionId) {
      if (filtered.length > 0) {
        setCurrentSessionId(filtered[filtered.length - 1]?.id || 1);
      } else {
        const newId = Date.now();
        const newSession = {
          id: newId,
          title: "Chat 1",
          messages: [
            {
              text: "Hello! Upload an image or video and I'll analyze it 😊",
              isBot: true,
            },
          ],
        };
        setChatSessions([newSession]);
        setCurrentSessionId(newId);
      }
    }
  };

  const switchSession = (id) => {
    setCurrentSessionId(id);
    setIsSidebarOpen(false);
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
  chatDisplayRef.current?.scrollTo({
    top: chatDisplayRef.current.scrollHeight,
    behavior: "smooth",
  });
}, [messages]); 

useEffect(() => {
  localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
  localStorage.setItem("currentSessionId", currentSessionId);
}, [chatSessions, currentSessionId]);

useEffect(() => {
  try {
    const saved = localStorage.getItem("chatSessions");
    const savedId = localStorage.getItem("currentSessionId");
    if (saved) setChatSessions(JSON.parse(saved));
    if (savedId) setCurrentSessionId(Number(savedId));
  } catch (error) {
    console.error("Error restoring sessions from localStorage:", error);
    localStorage.clear();
  }
}, []);

  return (
    <div className="chatbot-container">
      <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle chat sidebar">
        &#9776;
      </button>

      <Sidebar
        chats={chatSessions}
        selectedChatId={currentSessionId} // <-- Add this line
        onSelectChat={switchSession}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />

      <div className="chatbot-header">
        <div className="avatar-container">
          <img
            src={`${process.env.PUBLIC_URL}/botp.png`}
            alt="Bot Avatar"
            className="bot-avatar"
          />
          <div className="status-indicator"></div>
        </div>
        <h1>FACE-RECOGNITION BOT</h1>
      </div>

      <div className="chat-display" ref={chatDisplayRef} aria-live="polite">
        {messages.map((msg, index) => (
  <div key={index} className={`message ${msg.isBot ? "bot-message" : "user-message"}`}>
    {typeof msg.text === "string" ? <span>{msg.text}</span> : msg.text}
  </div>
))}
        {isLoading && (
          <div className="message bot-message loading">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        )}
      </div>

      <div className="input-area">
        <input
  type="text"
  value={inputText}
  onChange={(e) => setInputText(e.target.value)}
  onKeyDown={handleKeyDown} // <-- updated here
  placeholder="Type your message here..."
  className="text-input"
  disabled={isLoading}
  aria-label="Chat input"
/>

        <div className="file-upload-section">
          <label htmlFor="file-upload">Upload Image or Video:</label>
          <div className="file-input-wrapper">
            <button
              onClick={triggerFileInput}
              className="file-button"
              disabled={isLoading}
              aria-label="Choose file to upload"
            >
              Choose File
            </button>
            <input
              id="file-upload"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden-input"
              disabled={isLoading}
              aria-hidden="true"
            />
            <span className="file-name">{file ? file.name : "No file selected"}</span>
          </div>
        </div>

        <button
          onClick={handleSend}
          className="send-button"
          disabled={isLoading || inputText.trim() === ""}
          aria-label="Send message"
        >
          {isLoading ? "Processing..." : "Send"}
        </button>
      </div>

      {modalImage && (
        <div className="modal-overlay" onClick={() => setModalImage(null)}>
          <div className="modal-content">
            <img src={modalImage} alt="Full View" className="modal-image" />
            <button className="modal-close" aria-label="Close modal" onClick={() => setModalImage(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
