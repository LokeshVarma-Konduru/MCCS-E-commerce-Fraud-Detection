import { useState, useRef, useEffect } from 'react';
import { useChatbot } from '../hooks/useChatbot';
import { MessageCircle, X, Send, Maximize2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import '../styles/ChatbotWidget.css';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const location = useLocation();

  const { messages, isLoading, sendMessage } = useChatbot();

  // Don't render the widget on the chatbot full page
  if (location.pathname === '/chatbot') {
    return null;
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={handleToggleChat}
          className="chatbot-floating-button"
          aria-label="Open AI Assistant"
        >
          <MessageCircle size={28} />
          <span className="chatbot-badge">AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-widget-container">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-content">
              <div className="chatbot-icon">
                <MessageCircle size={24} />
              </div>
              <div>
                <h3 className="chatbot-title">Chat Assistant</h3>
                <p className="chatbot-subtitle">AI-powered fraud analysis</p>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <Link
                to="/chatbot"
                className="chatbot-action-btn"
                title="Open full page"
              >
                <Maximize2 size={18} />
              </Link>
              <button
                onClick={handleToggleChat}
                className="chatbot-action-btn"
                title="Close chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-message ${message.sender === 'user' ? 'user-message' : 'bot-message'} ${message.isError ? 'error-message' : ''}`}
              >
                <div className="message-content">
                  {message.sender === 'bot' ? (
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  ) : (
                    <p>{message.text}</p>
                  )}
                </div>
                <div className="message-time">{formatTime(message.timestamp)}</div>
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-message bot-message">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input-container">
            <form onSubmit={handleSendMessage} className="chatbot-input-form">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about model performance, logs, or metrics..."
                className="chatbot-input"
                disabled={isLoading}
                maxLength={1000}
              />
              <button
                type="submit"
                className="chatbot-send-btn"
                disabled={!inputMessage.trim() || isLoading}
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
