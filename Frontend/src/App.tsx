import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import { AuthUtils } from './utils/auth';

const clerkPubKey = "pk_test_ZmVhc2libGUtZmlsbHktMi5jbGVyay5hY2NvdW50cy5kZXYk";

function AppLayout() {
  const { getToken, isSignedIn } = useAuth();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateAndStoreToken = async () => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          if (token) {
            // Store token for persistence (Clerk tokens typically last 1 hour)
            AuthUtils.storeToken(token, 3600);
          }
        } catch (error) {
          console.error('Error storing token:', error);
        }
      } else {
        // Check if we have a stored valid token
        const storedToken = AuthUtils.getStoredToken();
        if (storedToken && AuthUtils.isTokenValid()) {
          // Validate stored token with server
          const isValid = await AuthUtils.validateTokenWithServer(storedToken.token);
          if (!isValid) {
            // Try to refresh token
            const refreshedToken = await AuthUtils.refreshToken();
            if (!refreshedToken) {
              // Clear invalid tokens
              AuthUtils.clearStoredTokens();
            }
          }
        }
      }
      setIsValidating(false);
    };

    validateAndStoreToken();
  }, [isSignedIn, getToken]);

  if (isValidating) {
    return (
      <div className="flex h-screen bg-gray-900 items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Validating session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <Sidebar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="bg-gray-800 border border-gray-700"
        progressClassName="bg-gradient-to-r from-blue-500 to-blue-600"
      />
    </div>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <SignedIn>
          <AppLayout />
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
