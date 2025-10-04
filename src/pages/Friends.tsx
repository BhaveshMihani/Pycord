import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { apiService, Friend } from '../services/api';
import { FiUsers, FiMessageSquare } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Friends = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriends();
  }, []);

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

  const handleMessageFriend = (friendId: string) => {
    navigate('/', { state: { selectedFriendId: friendId } });
  };

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
    <div className="flex-1 flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="h-16 bg-gray-900/80 backdrop-blur-sm border-b border-orange-500/30 flex items-center justify-between px-6 shadow-lg">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-blue-500">
          Friend List
        </h2>
        <div className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg">
          <span className="text-sm text-gray-400">
            {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <FiUsers className="text-6xl text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-2">No friends yet</p>
            <p className="text-gray-500 text-sm text-center max-w-md">
              Search for users and send friend requests to build your network
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-orange-500/30 hover:bg-gray-800/70 transition-all duration-300 shadow-lg group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <img
                      src={friend.avatarUrl || `https://ui-avatars.com/api/?name=${friend.username}&background=ea580c&color=fff`}
                      alt={friend.username}
                      className="w-20 h-20 rounded-full border-2 border-orange-500/50 shadow-lg group-hover:border-orange-500 transition-all duration-300"
                    />
                    {friend.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800 shadow-lg shadow-green-500/50" />
                    )}
                  </div>

                  <h3 className="text-white font-semibold text-lg mb-1">
                    {friend.username}
                  </h3>
                  <p className="text-sm text-gray-400 mb-1">{friend.email}</p>
                  <p className="text-xs text-gray-500 mb-4">
                    {friend.isOnline ? 'Online' : 'Offline'}
                  </p>

                  <button
                    onClick={() => handleMessageFriend(friend.id)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
                  >
                    <FiMessageSquare />
                    <span>Message</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
