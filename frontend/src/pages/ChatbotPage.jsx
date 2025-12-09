import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatbot } from '../hooks/useChatbot';
import { MessageCircle, Send, Plus, Download, Trash2, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getChatHistory, getChatById, deleteChatSession } from '../api';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const ChatbotPage = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [recentChats, setRecentChats] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [dateRange, setDateRange] = useState('all');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { user } = useAuth();
  const { messages, isLoading, sendMessage, clearMessages, loadChatSession, chatSessionId } = useChatbot();

  const computeStartDate = useCallback(() => {
    const now = Date.now();
    const offsets = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    const offset = offsets[dateRange];
    if (!offset) return null;
    return new Date(now - offset).toISOString();
  }, [dateRange]);

  const matchesActiveFilters = useCallback((chat) => {
    if (statusFilter === 'active' && chat.isActive === false) return false;
    if (statusFilter === 'inactive' && chat.isActive !== false) return false;

    const startDateIso = computeStartDate();
    if (startDateIso) {
      const startDate = new Date(startDateIso);
      const lastMessage = chat.lastMessageAt
        ? new Date(chat.lastMessageAt)
        : new Date(chat.createdAt || Date.now());
      if (lastMessage < startDate) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const title = (chat.title || '').toLowerCase();
      const preview = (chat.preview || '').toLowerCase();
      if (!title.includes(term) && !preview.includes(term)) {
        return false;
      }
    }

    return true;
  }, [computeStartDate, statusFilter, searchTerm]);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const response = await getChatHistory({
        limit: 25,
        search: searchTerm,
        status: statusFilter,
        startDate: computeStartDate()
      });
      setRecentChats(response.data.history || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast.error('Failed to load chat history');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [searchTerm, statusFilter, computeStartDate]);

  // Fetch chat history (debounced) when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchHistory]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Update recent chats when a new chat session is created
  useEffect(() => {
    if (chatSessionId && messages.length > 1) {
      setRecentChats(prev => {
        const existingChat = prev.find(chat => String(chat.id) === String(chatSessionId));
        const firstUserMessage = messages.find(msg => msg.sender === 'user');

        if (!existingChat) {
          const title = firstUserMessage ? firstUserMessage.text.substring(0, 50) : 'New Conversation';
          const newChat = {
            id: chatSessionId,
            title,
            lastMessageAt: new Date(),
            createdAt: new Date(),
            messageCount: messages.length,
            isActive: true,
            preview: firstUserMessage ? firstUserMessage.text.substring(0, 100) : ''
          };

          if (!matchesActiveFilters(newChat)) {
            return prev;
          }

          return [newChat, ...prev];
        }

        const lastMessage = messages[messages.length - 1];
        const updated = prev.map(chat => {
          if (String(chat.id) === String(chatSessionId)) {
            return {
              ...chat,
              lastMessageAt: new Date(),
              messageCount: messages.length,
              preview: lastMessage.text.substring(0, 100)
            };
          }
          return chat;
        });

        const filtered = updated.filter(matchesActiveFilters);

        // Sort to bring the updated chat to the top
        return filtered.sort((a, b) => {
          return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
        });
      });
    }
  }, [chatSessionId, messages, matchesActiveFilters]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleLoadChat = async (chatId) => {
    try {
      const response = await getChatById(chatId);
      const chat = response.data.chat;

      // Convert messages to the format expected by useChatbot
      const formattedMessages = chat.messages.map((msg, index) => ({
        id: index + 1,
        text: msg.text,
        sender: msg.sender,
        timestamp: new Date(msg.timestamp)
      }));

      loadChatSession(chatId, formattedMessages);
      toast.success('Chat loaded successfully');
    } catch (error) {
      console.error('Error loading chat:', error);
      toast.error('Failed to load chat session');
    }
  };

  const handleNewChat = () => {
    clearMessages();
    toast.success('Started new conversation');
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation(); // Prevent triggering handleLoadChat

    try {
      await deleteChatSession(chatId);

      // Remove from local state immediately (before API confirmation for instant feedback)
      setRecentChats(prev => {
        const updated = prev.filter(chat => chat.id !== chatId);
        console.log('Removed chat, remaining chats:', updated.length);
        return updated;
      });

      // If the deleted chat is the currently active one, clear messages
      if (chatSessionId && String(chatSessionId) === String(chatId)) {
        clearMessages();
        console.log('Cleared active chat session');
      }

      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');

      // Refresh the chat list on error to ensure consistency
      try {
        await fetchHistory();
      } catch (refreshError) {
        console.error('Error refreshing chat history:', refreshError);
      }
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInSeconds = Math.floor((now - messageDate) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const handleExportChat = () => {
    const chatContent = messages
      .map(msg => `[${formatTime(msg.timestamp)}] ${msg.sender === 'user' ? 'You' : 'AI Assistant'}: ${msg.text}`)
      .join('\n\n');

    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex pt-16" style={{ background: '#f5f7fb' }}>
      {/* Sidebar */}
      <div className="w-80 bg-white flex flex-col" style={{ borderRight: '1px solid #e2e8f0', boxShadow: '0 14px 34px rgba(15, 23, 42, 0.08)' }}>
        {/* Sidebar Header */}
        <div className="p-6" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#3b82f6' }}>
              <MessageCircle className="text-white" size={20} />
            </div>
            <h1 className="m-0 leading-none" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>AI Assistant</h1>
          </div>

          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg transition-all"
            style={{ background: '#3b82f6', textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.5px' }}
            onMouseEnter={(e) => e.target.style.background = '#2563eb'}
            onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
          >
            <Plus size={20} />
            New Chat
          </button>

          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations"
                className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 transition disabled:opacity-50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 transition"
              >
                <option value="active">Active</option>
                <option value="inactive">Archived</option>
                <option value="all">All</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 transition"
              >
                <option value="all">Any time</option>
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Recent Chats */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="uppercase mb-3" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', letterSpacing: '0.05em' }}>Recent Chats</h2>
          {isLoadingHistory ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8" style={{ borderBottom: '2px solid #3b82f6' }}></div>
            </div>
          ) : recentChats.length === 0 ? (
            <p className="text-center py-4" style={{ fontSize: '0.875rem', color: '#334155' }}>No chat history yet</p>
          ) : (
            <div className="space-y-2">
              {recentChats.map((chat) => (
                <div
                  key={chat.id}
                  className="relative group"
                >
                  <div
                    onClick={() => handleLoadChat(chat.id)}
                    className="p-3 pr-10 rounded-lg cursor-pointer transition-colors"
                    style={{ background: 'transparent' }}
                    onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    <p className="truncate" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{chat.title}</p>
                    <p className="mt-1" style={{ fontSize: '0.75rem', color: '#334155' }}>{formatRelativeTime(chat.lastMessageAt)}</p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded transition-all z-10"
                    title="Delete chat"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="p-4" style={{ borderTop: '1px solid #e2e8f0' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.875rem' }}>
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{user?.name}</p>
              <p style={{ fontSize: '0.75rem', color: '#334155' }}>{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white px-8 py-4" style={{ borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
          <div className="flex items-center justify-end gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: '#f0fdf4', border: '1px solid #10b981' }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10b981' }}></div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#065f46' }}>API Connected</span>
            </div>

            <button
              onClick={handleExportChat}
              className="p-2 rounded-lg transition-colors"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
              title="Export chat"
            >
              <Download size={20} style={{ color: '#334155' }} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'bot' && (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0" style={{ background: '#3b82f6' }}>
                    <MessageCircle className="text-white" size={20} />
                  </div>
                )}

                <div className={`flex flex-col max-w-3xl ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className="rounded-2xl px-6 py-4"
                    style={{
                      background: message.isError ? '#fef2f2' : (message.sender === 'user' ? '#3b82f6' : '#f8fafc'),
                      color: message.isError ? '#991b1b' : (message.sender === 'user' ? '#ffffff' : '#0f172a'),
                      border: message.isError ? '1px solid #fecaca' : 'none'
                    }}
                  >
                    {message.sender === 'bot' ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base font-semibold mb-1">{children}</h3>,
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            code: ({ inline, children }) =>
                              inline ? (
                                <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                              ) : (
                                <code className="block bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto font-mono text-sm my-2">{children}</code>
                              ),
                          }}
                        >
                          {message.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 px-2">{formatTime(message.timestamp)}</span>
                </div>

                {message.sender === 'user' && (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center ml-3 flex-shrink-0" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                    <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.875rem' }}>
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ background: '#3b82f6' }}>
                  <MessageCircle className="text-white" size={20} />
                </div>
                <div className="rounded-2xl px-6 py-4" style={{ background: '#f8fafc' }}>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="bg-white px-8 py-6" style={{ borderTop: '1px solid #e2e8f0', boxShadow: '0 -1px 3px rgba(15, 23, 42, 0.05)' }}>
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-4 items-end">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about model performance, logs, or metrics..."
                className="flex-1 px-6 py-4 rounded-full outline-none transition-all disabled:cursor-not-allowed"
                style={{
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  color: '#0f172a'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                disabled={isLoading}
                maxLength={1000}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="w-14 h-14 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: '#3b82f6',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => !e.target.disabled && (e.target.style.background = '#2563eb')}
                onMouseLeave={(e) => !e.target.disabled && (e.target.style.background = '#3b82f6')}
              >
                <Send size={24} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
