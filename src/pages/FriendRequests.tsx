import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { apiService, FriendRequest } from '../services/api';
import { FiUserPlus, FiCheck, FiX } from 'react-icons/fi';

const FriendRequests = () => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const requestsList = await apiService.getFriendRequests();
      setRequests(requestsList.filter((req) => req.status === 'pending'));
    } catch (error) {
      toast.error('Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string, username: string) => {
    setProcessingRequest(requestId);
    try {
      await apiService.acceptFriendRequest(requestId);
      setRequests(requests.filter((req) => req.id !== requestId));
      toast.success(`Accepted friend request from ${username}`);
    } catch (error) {
      toast.error('Failed to accept friend request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (requestId: string, username: string) => {
    setProcessingRequest(requestId);
    try {
      await apiService.rejectFriendRequest(requestId);
      setRequests(requests.filter((req) => req.id !== requestId));
      toast.success(`Rejected friend request from ${username}`);
    } catch (error) {
      toast.error('Failed to reject friend request');
    } finally {
      setProcessingRequest(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading friend requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="h-16 bg-gray-900/80 backdrop-blur-sm border-b border-orange-500/30 flex items-center justify-between px-6 shadow-lg">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-blue-500">
          Friend Requests
        </h2>
        {requests.length > 0 && (
          <div className="px-3 py-1 bg-orange-500/20 border border-orange-500/50 rounded-lg">
            <span className="text-sm text-orange-400 font-semibold">
              {requests.length} Pending
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <FiUserPlus className="text-6xl text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-2">No pending requests</p>
            <p className="text-gray-500 text-sm">Friend requests will appear here</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-orange-500/30 hover:bg-gray-800/70 transition-all duration-300 shadow-lg animate-fadeIn"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      <img
                        src={request.fromUser.avatarUrl || `https://ui-avatars.com/api/?name=${request.fromUser.username}&background=ea580c&color=fff`}
                        alt={request.fromUser.username}
                        className="w-14 h-14 rounded-full border-2 border-orange-500/50 shadow-md"
                      />
                      {request.fromUser.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800 shadow-lg shadow-green-500/50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">
                        {request.fromUser.username}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {request.fromUser.email}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(request.id, request.fromUser.username)}
                      disabled={processingRequest === request.id}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg flex items-center gap-2 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiCheck />
                      <span className="hidden sm:inline">Accept</span>
                    </button>
                    <button
                      onClick={() => handleReject(request.id, request.fromUser.username)}
                      disabled={processingRequest === request.id}
                      className="px-4 py-2 bg-gray-700 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiX />
                      <span className="hidden sm:inline">Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequests;
