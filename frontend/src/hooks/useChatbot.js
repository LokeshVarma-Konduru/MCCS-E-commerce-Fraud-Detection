import { useState, useCallback } from 'react';
import { sendChatMessage } from '../api';
import toast from 'react-hot-toast';

/**
 * Custom hook for chatbot functionality
 * Manages messages, loading state, and API calls with chat session support
 */
export const useChatbot = (initialMessages = null) => {
  const [messages, setMessages] = useState(initialMessages || [
    {
      id: 1,
      text: "Hello! I'm here to help you review recent fraud alerts. Let me know if you'd like a quick summary of what needs your attention today.",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatSessionId, setChatSessionId] = useState(null);

  /**
   * Send a message to the chatbot
   */
  const sendMessage = useCallback(async (messageText) => {
    if (!messageText || !messageText.trim()) {
      return;
    }

    // Add user message to the conversation
    const userMessage = {
      id: Date.now(),
      text: messageText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Call the API with optional chatSessionId
      const response = await sendChatMessage(messageText.trim(), chatSessionId);

      // Save the chatSessionId for future messages
      if (response.data.chatSessionId) {
        setChatSessionId(response.data.chatSessionId);
      }

      // Add bot response to the conversation
      const botMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date(response.data.timestamp)
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Chatbot error:', err);
      const errorMessage = err.message || 'Failed to get response from AI assistant';

      setError(errorMessage);
      toast.error(errorMessage);

      // Add error message to chat
      const errorBotMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.",
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [chatSessionId]);

  /**
   * Clear all messages and reset to initial state
   */
  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm here to help you review recent fraud alerts. Let me know if you'd like a quick summary of what needs your attention today.",
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
    setError(null);
    setChatSessionId(null); // Start a new chat session
  }, []);

  /**
   * Load messages from a chat session
   */
  const loadChatSession = useCallback((sessionId, sessionMessages) => {
    setChatSessionId(sessionId);
    setMessages(sessionMessages);
    setError(null);
  }, []);

  /**
   * Retry the last failed message
   */
  const retryLastMessage = useCallback(() => {
    const lastUserMessage = [...messages]
      .reverse()
      .find(msg => msg.sender === 'user');

    if (lastUserMessage) {
      sendMessage(lastUserMessage.text);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    error,
    chatSessionId,
    sendMessage,
    clearMessages,
    loadChatSession,
    retryLastMessage
  };
};

export default useChatbot;
