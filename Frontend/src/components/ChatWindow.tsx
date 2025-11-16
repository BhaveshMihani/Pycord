import { useState, useRef, useEffect } from 'react';
import { FiSend, FiHash, FiTrash2 } from 'react-icons/fi';
import { Chatroom, Message } from '../services/api';
import { apiService } from '../services/api';
import { toast } from 'react-toastify';

interface ChatWindowProps {
  chatroom: Chatroom;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onMessageDeleted: () => void;
  currentUserId: string;
}

const ChatWindow = ({ chatroom, messages, onSendMessage, onMessageDeleted, currentUserId }: ChatWindowProps) => {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput);
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await apiService.deleteMessage(chatroom.id, messageId);
        toast.success('Message deleted');
        onMessageDeleted();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete message');
      }
    }
  };

  const getInitial = (name: string): string => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const roomName = chatroom.name || `Room ${chatroom.code}`;
  const initial = getInitial(roomName);

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="h-16 bg-gray-900/80 backdrop-blur-sm border-b border-blue-500/30 flex items-center justify-between px-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-500 shadow-lg shadow-blue-500/30">
            <span className="text-white text-lg font-bold">{initial}</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">{roomName}</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400 font-mono">{chatroom.code}</p>
              {chatroom.memberCount !== undefined && (
                <p className="text-xs text-gray-500">
                  • {chatroom.memberCount} {chatroom.memberCount === 1 ? 'member' : 'members'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isSent = message.senderId === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-fadeIn group relative`}
              >
                <div className="max-w-[70%] flex items-end gap-2">
                  <div className="flex-1">
                    {!isSent && (
                      <p className="text-xs text-gray-500 mb-1 px-2">
                        {message.senderUsername || 'Unknown'}
                      </p>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl shadow-lg relative ${
                    isSent
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/20'
                      : 'bg-gray-800 text-gray-100 border border-gray-700 shadow-gray-900/50'
                  }`}
                >
                  <p className="break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                          isSent ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                        {message.createdAt 
                          ? (() => {
                              try {
                                const date = new Date(message.createdAt);
                                if (isNaN(date.getTime())) {
                                  return 'Just now';
                                }
                                return date.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                                });
                              } catch (e) {
                                return 'Just now';
                              }
                            })()
                          : 'Just now'}
                  </p>
                    </div>
                  </div>
                  {isSent && (
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="opacity-30 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                      title="Delete message"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-900/80 backdrop-blur-sm border-t border-blue-500/30">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
          />
          <button
            onClick={handleSend}
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!messageInput.trim()}
          >
            <FiSend className="text-white text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
