import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import ChatWindow from '../components/ChatWindow';
import { apiService, Friend, Message } from '../services/api';
import { FiMessageSquare } from 'react-icons/fi';

const Home = () => {
  const { user } = useUser();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    if (selectedFriend) {
      loadMessages(selectedFriend.id);
    }
  }, [selectedFriend]);

  const loadFriends = async () => {
    try {
      const friendsList = await apiService.getFriends();
      setFriends(friendsList);
    } catch (error) {
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (friendId: string) => {
    try {
      const messagesList = await apiService.getMessages(friendId);
      setMessages(messagesList);
      await apiService.markMessagesAsRead(friendId);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedFriend) return;

    try {
      const newMessage = await apiService.sendMessage(selectedFriend.id, content);
      setMessages([...messages, newMessage]);
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const friendListWidth = selectedFriend ? 'w-[30%]' : 'w-full';
  const chatWidth = selectedFriend ? 'w-[70%]' : 'w-0';

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-screen overflow-hidden">
      <div
        className={`${friendListWidth} transition-all duration-300 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-orange-500/30 flex flex-col`}
      >
        <div className="h-16 bg-gray-900/80 backdrop-blur-sm border-b border-orange-500/30 flex items-center px-6 shadow-lg">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-blue-500">
            Chats
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <FiMessageSquare className="text-6xl text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg mb-2">No friends yet</p>
              <p className="text-gray-500 text-sm">
                Search for users and send friend requests to start chatting
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => setSelectedFriend(friend)}
                  className={`w-full p-4 rounded-xl transition-all duration-300 flex items-center gap-3 group ${
                    selectedFriend?.id === friend.id
                      ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/50 shadow-lg shadow-orange-500/20'
                      : 'bg-gray-800/50 border border-gray-700 hover:border-orange-500/30 hover:bg-gray-800/70'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={friend.avatarUrl || `https://ui-avatars.com/api/?name=${friend.username}&background=ea580c&color=fff`}
                      alt={friend.username}
                      className="w-12 h-12 rounded-full border-2 border-orange-500/50 shadow-md"
                    />
                    {friend.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 shadow-lg shadow-green-500/50" />
                    )}
                    {friend.unreadCount && friend.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-lg">
                        {friend.unreadCount}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-left overflow-hidden">
                    <h3 className="text-white font-semibold truncate">
                      {friend.username}
                    </h3>
                    <p className="text-sm text-gray-400 truncate">
                      {friend.lastMessage || 'No messages yet'}
                    </p>
                  </div>

                  {friend.lastMessageTime && (
                    <div className="text-xs text-gray-500">
                      {new Date(friend.lastMessageTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`${chatWidth} transition-all duration-300 overflow-hidden`}>
        {selectedFriend ? (
          <ChatWindow
            friend={selectedFriend}
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUserId={user?.id || ''}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="text-center">
              <FiMessageSquare className="text-6xl text-gray-600 mb-4 mx-auto" />
              <p className="text-gray-400 text-lg">Select a friend to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
