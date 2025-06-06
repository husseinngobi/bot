// src/components/Sidebar.js
import React from 'react';
import './styles.css';

const Sidebar = ({ 
  chats, 
  onSelectChat, 
  onNewChat, 
  onDeleteChat, 
  isOpen, 
  onToggle 
}) => {

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
            <li key={id} className="chat-item">
              <button className="chat-select-btn" onClick={() => onSelectChat(id)}>
                <div className="chat-title">{title || `Chat ${id}`}</div>
                <div className="chat-timestamp">{new Date(timestamp).toLocaleString()}</div>
              </button>
              <button 
                className="chat-delete-btn" 
                onClick={() => onDeleteChat(id)} 
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
