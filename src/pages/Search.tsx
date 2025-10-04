import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { apiService, User } from '../services/api';
import { FiSearch, FiUserPlus, FiLoader } from 'react-icons/fi';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await apiService.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (userId: string, username: string) => {
    setSendingRequest(userId);
    try {
      await apiService.sendFriendRequest(userId);
      toast.success(`Friend request sent to ${username}`);
    } catch (error) {
      toast.error('Failed to send friend request');
    } finally {
      setSendingRequest(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="h-16 bg-gray-900/80 backdrop-blur-sm border-b border-orange-500/30 flex items-center px-6 shadow-lg">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-blue-500">
          Search Users
        </h2>
      </div>

      <div className="p-6">
        <div className="relative max-w-2xl mx-auto">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or email..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 shadow-lg"
          />
          {loading && (
            <FiLoader className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 text-xl animate-spin" />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {searchQuery && !loading && searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <FiSearch className="text-6xl text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No users found</p>
            <p className="text-gray-500 text-sm">Try a different search term</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex items-center justify-between hover:border-orange-500/30 hover:bg-gray-800/70 transition-all duration-300 shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=ea580c&color=fff`}
                      alt={user.username}
                      className="w-14 h-14 rounded-full border-2 border-orange-500/50 shadow-md"
                    />
                    {user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800 shadow-lg shadow-green-500/50" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{user.username}</h3>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleSendFriendRequest(user.id, user.username)}
                  disabled={sendingRequest === user.id}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg flex items-center gap-2 transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingRequest === user.id ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FiUserPlus />
                  )}
                  <span>{sendingRequest === user.id ? 'Sending...' : 'Add Friend'}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
