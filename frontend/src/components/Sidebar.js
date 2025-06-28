// src/components/Sidebar.js
import React from 'react';
import './styles.css';

const Sidebar = ({ 
  chats, 
  selectedChatId,
  onSelectChat, 
  onNewChat, 
  onDeleteChat, 
  isOpen, 
  onToggle 
}) => {

  const handleSelectChat = (id) => {
    onSelectChat(id);
    if (isOpen && onToggle) {
      onToggle(); // Auto-close on mobile/small screen
    }
  };

  const handleDeleteChat = (id, title) => {
    const confirmDelete = window.confirm(`Delete "${title || `Chat ${id}`}"?`);
    if (confirmDelete) {
      onDeleteChat(id);
    }
  };

  return (
    <>
      {/* Hamburger toggle inside chatbot container */}
      <button 
        className={`sidebar-toggle-btn ${isOpen ? 'open' : ''}`} 
        onClick={onToggle} 
        aria-label="Toggle chat sidebar"
      >
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
      </button>

      {/* Sidebar panel */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Chats</h2>
          <button className="new-chat-btn" onClick={onNewChat}>+ New Chat</button>
        </div>

        <ul className="chat-list">
          {chats.length === 0 && (
            <li className="empty-list">No chats saved</li>
          )}

          {chats.map(({ id, title, timestamp }) => (
            <li key={id} className={`chat-item ${selectedChatId === id ? 'active-chat' : ''}`}>
              <button 
                className="chat-select-btn" 
                onClick={() => handleSelectChat(id)} 
                tabIndex={0}
              >
                <div className="chat-title">{title || `Chat ${id}`}</div>
                <div className="chat-timestamp">{new Date(timestamp).toLocaleString()}</div>
              </button>
              <button 
                className="chat-delete-btn" 
                onClick={() => handleDeleteChat(id, title)} 
                aria-label={`Delete chat ${title || id}`}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
