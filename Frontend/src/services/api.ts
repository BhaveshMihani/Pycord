import { AuthUtils } from '../utils/auth';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface Chatroom {
  id: string;
  code: string;
  name?: string;
  createdBy: string;
  createdAt: string;
  memberCount?: number;
}

export interface Message {
  id: string;
  chatroomId: string;
  senderId: string;
  senderUsername?: string;
  content: string;
  createdAt: string;
}

class ApiService {
  private baseUrl = '/api';

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const tokenData = AuthUtils.getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (tokenData && AuthUtils.isTokenValid()) {
      headers['Authorization'] = `Bearer ${tokenData.token}`;
    }

    return headers;
  }

  // Chatroom endpoints
  async createChatroom(name?: string): Promise<Chatroom> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/chatrooms/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          const refreshedToken = await AuthUtils.refreshToken();
          if (refreshedToken) {
            headers['Authorization'] = `Bearer ${refreshedToken.token}`;
            const retryResponse = await fetch(`${this.baseUrl}/chatrooms/create`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ name }),
            });
            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }
          throw new Error('Authentication required');
        }
        throw new Error(`Create chatroom failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API: Create chatroom error:', error);
      throw error;
    }
  }

  async joinChatroom(code: string): Promise<Chatroom> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/chatrooms/join`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          const refreshedToken = await AuthUtils.refreshToken();
          if (refreshedToken) {
            headers['Authorization'] = `Bearer ${refreshedToken.token}`;
            const retryResponse = await fetch(`${this.baseUrl}/chatrooms/join`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ code }),
            });
            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }
          throw new Error('Authentication required');
        }
        throw new Error(`Join chatroom failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API: Join chatroom error:', error);
      throw error;
    }
  }

  async getMyChatrooms(): Promise<Chatroom[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/chatrooms/my-rooms`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          const refreshedToken = await AuthUtils.refreshToken();
          if (refreshedToken) {
            headers['Authorization'] = `Bearer ${refreshedToken.token}`;
            const retryResponse = await fetch(`${this.baseUrl}/chatrooms/my-rooms`, {
              method: 'GET',
              headers,
            });
            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }
          throw new Error('Authentication required');
        }
        throw new Error(`Get chatrooms failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API: Get chatrooms error:', error);
      throw error;
    }
  }

  async getMessages(chatroomId: string): Promise<Message[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/chatrooms/${chatroomId}/messages`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          const refreshedToken = await AuthUtils.refreshToken();
          if (refreshedToken) {
            headers['Authorization'] = `Bearer ${refreshedToken.token}`;
            const retryResponse = await fetch(`${this.baseUrl}/chatrooms/${chatroomId}/messages`, {
              method: 'GET',
              headers,
            });
            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }
          throw new Error('Authentication required');
        }
        throw new Error(`Get messages failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API: Get messages error:', error);
      throw error;
    }
  }

  async sendMessage(chatroomId: string, content: string): Promise<Message> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/chatrooms/${chatroomId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content, chatroom_id: chatroomId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          const refreshedToken = await AuthUtils.refreshToken();
          if (refreshedToken) {
            headers['Authorization'] = `Bearer ${refreshedToken.token}`;
            const retryResponse = await fetch(`${this.baseUrl}/chatrooms/${chatroomId}/messages`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ content, chatroom_id: chatroomId }),
            });
            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }
          throw new Error('Authentication required');
        }
        throw new Error(`Send message failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API: Send message error:', error);
      throw error;
    }
  }

  async deleteMessage(chatroomId: string, messageId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/chatrooms/${chatroomId}/messages/${messageId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          const refreshedToken = await AuthUtils.refreshToken();
          if (refreshedToken) {
            headers['Authorization'] = `Bearer ${refreshedToken.token}`;
            const retryResponse = await fetch(`${this.baseUrl}/chatrooms/${chatroomId}/messages/${messageId}`, {
              method: 'DELETE',
              headers,
            });
            if (retryResponse.ok) {
              return;
            }
          }
          throw new Error('Authentication required');
        }
        throw new Error(`Delete message failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('API: Delete message error:', error);
      throw error;
    }
  }

  async deleteChatroom(chatroomId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/chatrooms/${chatroomId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          const refreshedToken = await AuthUtils.refreshToken();
          if (refreshedToken) {
            headers['Authorization'] = `Bearer ${refreshedToken.token}`;
            const retryResponse = await fetch(`${this.baseUrl}/chatrooms/${chatroomId}`, {
              method: 'DELETE',
              headers,
            });
            if (retryResponse.ok) {
              return;
            }
          }
          throw new Error('Authentication required');
        }
        throw new Error(`Delete chatroom failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('API: Delete chatroom error:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
