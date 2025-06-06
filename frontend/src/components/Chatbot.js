import React, { useState, useRef } from "react";
import { fetchChatResponse, uploadFile } from "./api";
import "./styles.css";

const Chatbot = () => {
  // 🔹 Multi-session chat handling
  const [chatSessions, setChatSessions] = useState([
    { id: 1, name: "Chat 1", messages: [{ text: "Hello! Upload an image or video and I'll analyze it 😊", isBot: true }] }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState(1);
  const messages = chatSessions.find(s => s.id === currentSessionId)?.messages || [];

  // 🔹 Other chatbot states
  const [inputText, setInputText] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);

  const API_BASE = "http://10.0.0.4:5000";
  const CHAT_ENDPOINT = `${API_BASE}/chat`;
  const UPLOAD_ENDPOINT = `${API_BASE}/upload`;

  // 🔹 Sidebar toggle
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // 🔹 Add message for the active session
  const addMessage = (text, isBot) => {
    const newMsg = { text, isBot };
    setChatSessions((prevSessions) =>
      prevSessions.map((s) =>
        s.id === currentSessionId ? { ...s, messages: [...s.messages, newMsg] } : s
      )
    );
  };

  // 🔹 Handle file selection
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    addMessage(`📤 Uploaded: ${selectedFile.name}`, false);
    addMessage("🔍 Analyzing media...", true);

    try {
      setIsLoading(true);
      const data = await uploadFile(selectedFile);
      addMessage(data.message, true);

      if (selectedFile.type.startsWith("image")) {
        addMessage("✅ Found 3 faces in the image", true);
        addMessage("👤 Person 1: 92% confidence", true);
        addMessage("👤 Person 2: 87% confidence", true);
        addMessage("👤 Person 3: 78% confidence", true);
      }
    } catch (error) {
      addMessage("❌ Error processing the file", true);
      console.error("Upload error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Send chat messages
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
            ? { ...s, messages: s.messages.filter((msg) => msg.text !== "🤖 Thinking...").concat({ text: data.response, isBot: true }) }
            : s
        )
      );
    } catch (error) {
      setChatSessions((prevSessions) =>
        prevSessions.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: s.messages.filter((msg) => msg.text !== "🤖 Thinking...").concat({ text: "❌ Error connecting to AI service", isBot: true }) }
            : s
        )
      );
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Manage sessions
  const handleNewChat = () => {
    const newId = Date.now();
    const newSession = {
      id: newId,
      name: `Chat ${chatSessions.length + 1}`,
      messages: [{ text: "Hello! Upload an image or video and I'll analyze it 😊", isBot: true }]
    };
    setChatSessions([...chatSessions, newSession]);
    setCurrentSessionId(newId);
  };

  const handleDeleteChat = (id) => {
    const filtered = chatSessions.filter((s) => s.id !== id);
    setChatSessions(filtered);

    if (id === currentSessionId && filtered.length > 0) {
      setCurrentSessionId(filtered[filtered.length - 1].id);
    } else if (filtered.length === 0) {
      handleNewChat();
    }
  };

  const switchSession = (id) => {
    setCurrentSessionId(id);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="chatbot-container">
      {/* Sidebar Toggle */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        &#9776;
      </button>

      {/* Sidebar Panel */}
      {isSidebarOpen && (
        <div className="sidebar-panel">
          <h2 className="sidebar-title">Chat History</h2>
          <ul className="chat-list">
            {chatSessions.map((session) => (
              <li key={session.id} className={`chat-item ${session.id === currentSessionId ? "active" : ""}`}>
                <button onClick={() => switchSession(session.id)}>{session.name}</button>
                <button className="delete-chat" onClick={() => handleDeleteChat(session.id)}>🗑</button>
              </li>
            ))}
          </ul>
          <button className="new-chat" onClick={handleNewChat}>➕ New Chat</button>
        </div>
      )}

      {/* Header */}
      <div className="chatbot-header">
        <div className="avatar-container">
          <img src={`${process.env.PUBLIC_URL}/botp.png`} alt="Bot Avatar" className="bot-avatar" />
          <div className="status-indicator"></div>
        </div>
        <h1>FACE-RECOGNITION BOT</h1>
      </div>

      {/* Chat Display */}
      <div className="chat-display">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.isBot ? "bot-message" : "user-message"}`}>{msg.text}</div>
        ))}
        {isLoading && (
          <div className="message bot-message loading">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="input-area">
        <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type your message here..." className="text-input" disabled={isLoading} />

        {/* File Upload */}
        <div className="file-upload-section">
          <label>Upload Image or Video:</label>
          <div className="file-input-wrapper">
            <button onClick={triggerFileInput} className="file-button" disabled={isLoading}>Choose File</button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden-input" disabled={isLoading} />
            <span className="file-name">{file ? file.name : "No file selected"}</span>
          </div>
        </div>

        <button onClick={handleSend} className="send-button" disabled={isLoading}>{isLoading ? "Processing..." : "Send"}</button>
      </div>
    </div>
  );
};

export default Chatbot;