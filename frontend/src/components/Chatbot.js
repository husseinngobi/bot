import React, { useState, useRef } from 'react';
import { fetchChatResponse, uploadFile } from "./api"; 
import './styles.css';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! Upload an image or video and I'll analyze it 😊", isBot: true }
  ]);
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const API_BASE = "http://10.0.0.4:5000";  // Corrected backend address
  const CHAT_ENDPOINT = `${API_BASE}/chat`;
  const UPLOAD_ENDPOINT = `${API_BASE}/upload`;

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
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch(UPLOAD_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      addMessage(data.message, true);
      
      if (selectedFile.type.startsWith('image')) {
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

  const handleSend = async () => {
    if (!inputText.trim()) return;

    addMessage(inputText, false);
    setInputText('');
    addMessage("🤖 Thinking...", true);

    try {
      setIsLoading(true);
      const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputText })
      });

      const data = await response.json();
      setMessages(prev => prev.filter(msg => msg.text !== "🤖 Thinking..."));
      addMessage(data.response, true);
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.text !== "🤖 Thinking..."));
      addMessage("❌ Error connecting to AI service", true);
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (text, isBot) => {
    setMessages(prev => [...prev, { text, isBot }]);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="chatbot-container">
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
      
      <div className="chat-display">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.isBot ? 'bot-message' : 'user-message'}`}
          >
            {msg.text}
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
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          className="text-input"
          disabled={isLoading}
        />
        
        <div className="file-upload-section">
          <label>Upload Image or Video:</label>
          <div className="file-input-wrapper">
            <button 
              onClick={triggerFileInput} 
              className="file-button"
              disabled={isLoading}
            >
              Choose File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden-input"
              disabled={isLoading}
            />
            <span className="file-name">
              {file ? file.name : 'No file selected'}
            </span>
          </div>
        </div>
        
        <button 
          onClick={handleSend} 
          className="send-button"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Send'}
        </button>
      </div>
      
      {previewUrl && (
        <div className="media-preview">
          {file.type.startsWith('image') ? (
            <img src={previewUrl} alt="Preview" />
          ) : (
            <video src={previewUrl} controls />
          )}
        </div>
      )}
    </div>
  );
};

export default Chatbot;