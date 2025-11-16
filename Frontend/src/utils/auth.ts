import { useAuth } from '@clerk/clerk-react';

export interface TokenData {
  token: string;
  expiresAt: number;
}

export class AuthUtils {
  private static readonly TOKEN_KEY = 'clerk_token';
  private static readonly REFRESH_KEY = 'clerk_refresh_token';

  static getStoredToken(): TokenData | null {
    try {
      const tokenData = localStorage.getItem(this.TOKEN_KEY);
      if (!tokenData) return null;

      const parsed: TokenData = JSON.parse(tokenData);
      const now = Date.now();

      // Check if token is expired
      if (parsed.expiresAt <= now) {
        this.clearStoredTokens();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error reading stored token:', error);
      this.clearStoredTokens();
      return null;
    }
  }

  static storeToken(token: string, expiresIn: number): void {
    const tokenData: TokenData = {
      token,
      expiresAt: Date.now() + (expiresIn * 1000), // expiresIn is in seconds
    };

    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData));
  }

  static clearStoredTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }

  static isTokenValid(): boolean {
    const tokenData = this.getStoredToken();
    return tokenData !== null;
  }

  static async validateTokenWithServer(token: string): Promise<boolean> {
    try {
      // This would be a call to your backend to validate the token
      // For now, we'll assume it's valid if it exists and isn't expired
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  static async refreshToken(): Promise<TokenData | null> {
    try {
      const refreshToken = localStorage.getItem(this.REFRESH_KEY);
      if (!refreshToken) return null;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearStoredTokens();
        return null;
      }

      const data = await response.json();
      this.storeToken(data.token, data.expiresIn);
      return this.getStoredToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearStoredTokens();
      return null;
    }
  }
}

export const useAuthToken = () => {
  const { getToken, isSignedIn } = useAuth();

  const getValidToken = async (): Promise<string | null> => {
    if (!isSignedIn) return null;

    try {
      // Get token from Clerk
      const token = await getToken();

      if (token) {
        // Store the token for persistence
        // Note: Clerk tokens typically expire in 1 hour
        AuthUtils.storeToken(token, 3600); // 1 hour
        return token;
      }

      // Try to get stored token if Clerk doesn't have one
      const storedToken = AuthUtils.getStoredToken();
      if (storedToken && AuthUtils.isTokenValid()) {
        // Validate with server
        const isValid = await AuthUtils.validateTokenWithServer(storedToken.token);
        if (isValid) {
          return storedToken.token;
        } else {
          // Try to refresh
          const refreshedToken = await AuthUtils.refreshToken();
          return refreshedToken?.token || null;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting valid token:', error);
      return null;
    }
  };

  return { getValidToken };
};