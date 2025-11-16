import { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import ChatWindow from '../components/ChatWindow';
import { apiService, Chatroom, Message } from '../services/api';
import { FiMessageSquare, FiPlus, FiHash, FiCopy, FiCheck, FiTrash2 } from 'react-icons/fi';

const USER_BUTTON_APPEARANCE = {
  elements: {
    userButtonAvatarBox: 'w-full h-full rounded-full',
    userButtonPopoverCard: 'bg-gray-800 border border-gray-700',
    userButtonPopoverActionButton: 'hover:bg-gray-700',
  },
} as const;

const Home = () => {
  const { user } = useUser();
  const [chatrooms, setChatrooms] = useState<Chatroom[]>([]);
  const [selectedChatroom, setSelectedChatroom] = useState<Chatroom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadChatrooms();
  }, []);

  useEffect(() => {
    if (selectedChatroom) {
      loadMessages(selectedChatroom.id);
      // Poll for new messages every 2 seconds
      const interval = setInterval(() => {
        loadMessages(selectedChatroom.id);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedChatroom]);

  const loadChatrooms = async () => {
    try {
      const rooms = await apiService.getMyChatrooms();
      setChatrooms(rooms);
    } catch (error) {
      toast.error('Failed to load chatrooms');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatroomId: string) => {
    try {
      const messagesList = await apiService.getMessages(chatroomId);
      setMessages(messagesList);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const handleCreateRoom = async () => {
    try {
      const newRoom = await apiService.createChatroom(roomName || undefined);
      setChatrooms([...chatrooms, newRoom]);
      setSelectedChatroom(newRoom);
      setShowCreateModal(false);
      setRoomName('');
      toast.success(`Room created! Code: ${newRoom.code}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    try {
      const room = await apiService.joinChatroom(joinCode.toUpperCase());
      // Check if room is already in list
      const exists = chatrooms.find(r => r.id === room.id);
      if (!exists) {
        setChatrooms([...chatrooms, room]);
      }
      setSelectedChatroom(room);
      setShowJoinModal(false);
      setJoinCode('');
      toast.success(`Joined room: ${room.name || room.code}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to join room');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedChatroom) return;

    try {
      const newMessage = await apiService.sendMessage(selectedChatroom.id, content);
      setMessages([...messages, newMessage]);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleMessageDeleted = () => {
    if (selectedChatroom) {
      loadMessages(selectedChatroom.id);
    }
  };

  const handleDeleteChatroom = async (chatroomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const chatroom = chatrooms.find(r => r.id === chatroomId);
    const roomName = chatroom?.name || chatroom?.code || 'this chatroom';
    
    if (window.confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone and will delete all messages.`)) {
      try {
        await apiService.deleteChatroom(chatroomId);
        toast.success('Chatroom deleted');
        
        // Remove from list
        setChatrooms(chatrooms.filter(r => r.id !== chatroomId));
        
        // If deleted chatroom was selected, clear selection
        if (selectedChatroom?.id === chatroomId) {
          setSelectedChatroom(null);
          setMessages([]);
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete chatroom');
      }
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getInitial = (name: string): string => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const chatroomListWidth = selectedChatroom ? 'w-[30%]' : 'w-full';
  const chatWidth = selectedChatroom ? 'w-[70%]' : 'w-0';

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading chatrooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-screen overflow-hidden">
      {/* Chatrooms List */}
      <div
        className={`${chatroomListWidth} transition-all duration-300 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-blue-500/30 flex flex-col`}
      >
        <div className="h-16 bg-gray-900/80 backdrop-blur-sm border-b border-blue-500/30 flex items-center justify-between px-6 shadow-lg">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-500">
            Chat Rooms
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-8 h-8 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-700/70 flex items-center justify-center transition-all duration-300"
              title="Join Room"
            >
              <FiHash className="text-gray-400 hover:text-blue-400" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg flex items-center justify-center transition-all duration-300 shadow-lg shadow-blue-500/30"
              title="Create Room"
            >
              <FiPlus className="text-white" />
            </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500/50 shadow-lg shadow-blue-500/30 hover:border-blue-400 transition-all duration-300">
            <UserButton appearance={USER_BUTTON_APPEARANCE} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {chatrooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <FiMessageSquare className="text-6xl text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg mb-2">No chatrooms yet</p>
              <p className="text-gray-500 text-sm mb-4">
                Create or join a chatroom to start chatting
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg text-white font-semibold transition-all duration-300 shadow-lg shadow-blue-500/30"
                >
                  Create Room
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 hover:border-blue-500/50 rounded-lg text-gray-300 font-semibold transition-all duration-300"
                >
                  Join Room
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {chatrooms.map((room) => {
                const roomName = room.name || `Room ${room.code}`;
                const initial = getInitial(roomName);
                const isCreator = user?.id && room.createdBy === user.id;
                
                return (
                <button
                    key={room.id}
                    onClick={() => setSelectedChatroom(room)}
                  className={`w-full p-4 rounded-xl transition-all duration-300 flex items-center gap-3 group ${
                      selectedChatroom?.id === room.id
                        ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/50 shadow-lg shadow-blue-500/20'
                        : 'bg-gray-800/50 border border-gray-700 hover:border-blue-500/30 hover:bg-gray-800/70'
                  }`}
                >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-500/50 shadow-md">
                      <span className="text-white text-xl font-bold">{initial}</span>
                  </div>

                  <div className="flex-1 text-left overflow-hidden">
                    <h3 className="text-white font-semibold truncate">
                        {roomName}
                    </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-400 font-mono">{room.code}</p>
                        {room.memberCount !== undefined && (
                          <p className="text-xs text-gray-500">
                            {room.memberCount} {room.memberCount === 1 ? 'member' : 'members'}
                    </p>
                        )}
                  </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isCreator && (
                        <button
                          onClick={(e) => handleDeleteChatroom(room.id, e)}
                          className="opacity-30 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                          title="Delete chatroom"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(room.code);
                        }}
                        className="w-8 h-8 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-700/70 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100"
                        title="Copy Code"
                      >
                        {copiedCode === room.code ? (
                          <FiCheck className="text-green-400" />
                        ) : (
                          <FiCopy className="text-gray-400 hover:text-blue-400" />
                  )}
                </button>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`${chatWidth} transition-all duration-300 overflow-hidden`}>
        {selectedChatroom ? (
          <ChatWindow
            chatroom={selectedChatroom}
            messages={messages}
            onSendMessage={handleSendMessage}
            onMessageDeleted={handleMessageDeleted}
            currentUserId={user?.id || ''}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="text-center">
              <FiMessageSquare className="text-6xl text-gray-600 mb-4 mx-auto" />
              <p className="text-gray-400 text-lg">Select a chatroom to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Create Chat Room</h3>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Room name (optional)"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setRoomName('');
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg text-white font-semibold transition-all duration-300 shadow-lg shadow-blue-500/30"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Join Chat Room</h3>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 mb-4 font-mono text-center text-2xl tracking-widest"
              maxLength={6}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinCode('');
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinRoom}
                disabled={!joinCode || joinCode.length !== 6}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg text-white font-semibold transition-all duration-300 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
