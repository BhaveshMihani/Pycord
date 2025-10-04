export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface Friend extends User {
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface FriendRequest {
  id: string;
  fromUser: User;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

class ApiService {
  private baseUrl = '/api';

  async searchUsers(query: string): Promise<User[]> {
    console.log('API: Searching users with query:', query);
    return [];
  }

  async getFriends(): Promise<Friend[]> {
    console.log('API: Fetching friends list');
    return [];
  }

  async sendFriendRequest(userId: string): Promise<void> {
    console.log('API: Sending friend request to user:', userId);
  }

  async getFriendRequests(): Promise<FriendRequest[]> {
    console.log('API: Fetching friend requests');
    return [];
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    console.log('API: Accepting friend request:', requestId);
  }

  async rejectFriendRequest(requestId: string): Promise<void> {
    console.log('API: Rejecting friend request:', requestId);
  }

  async getMessages(friendId: string): Promise<Message[]> {
    console.log('API: Fetching messages for friend:', friendId);
    return [];
  }

  async sendMessage(friendId: string, content: string): Promise<Message> {
    console.log('API: Sending message to friend:', friendId, content);
    return {
      id: Date.now().toString(),
      senderId: 'current-user',
      receiverId: friendId,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
  }

  async markMessagesAsRead(friendId: string): Promise<void> {
    console.log('API: Marking messages as read for friend:', friendId);
  }
}

export const apiService = new ApiService();
