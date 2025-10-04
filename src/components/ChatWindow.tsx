import { useState, useRef, useEffect } from 'react';
import { FiSend, FiMoreVertical, FiPhone, FiVideo } from 'react-icons/fi';
import { Friend, Message } from '../services/api';

interface ChatWindowProps {
  friend: Friend;
  messages: Message[];
  onSendMessage: (content: string) => void;
  currentUserId: string;
}

const ChatWindow = ({ friend, messages, onSendMessage, currentUserId }: ChatWindowProps) => {
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

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="h-16 bg-gray-900/80 backdrop-blur-sm border-b border-orange-500/30 flex items-center justify-between px-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={friend.avatarUrl || `https://ui-avatars.com/api/?name=${friend.username}&background=ea580c&color=fff`}
              alt={friend.username}
              className="w-10 h-10 rounded-full border-2 border-orange-500 shadow-lg shadow-orange-500/30"
            />
            {friend.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 shadow-lg shadow-green-500/50" />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">{friend.username}</h3>
            <p className="text-xs text-gray-400">{friend.isOnline ? 'Online' : 'Offline'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-700/70 flex items-center justify-center transition-all duration-300 group">
            <FiPhone className="text-gray-400 group-hover:text-blue-400 transition-colors" />
          </button>
          <button className="w-10 h-10 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-700/70 flex items-center justify-center transition-all duration-300 group">
            <FiVideo className="text-gray-400 group-hover:text-blue-400 transition-colors" />
          </button>
          <button className="w-10 h-10 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-orange-500/50 hover:bg-gray-700/70 flex items-center justify-center transition-all duration-300 group">
            <FiMoreVertical className="text-gray-400 group-hover:text-orange-400 transition-colors" />
          </button>
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
                className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-lg ${
                    isSent
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/20'
                      : 'bg-gray-800 text-gray-100 border border-gray-700 shadow-gray-900/50'
                  }`}
                >
                  <p className="break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isSent ? 'text-orange-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-900/80 backdrop-blur-sm border-t border-orange-500/30">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300"
          />
          <button
            onClick={handleSend}
            className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
