import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Search from './pages/Search';
import Friends from './pages/Friends';
import FriendRequests from './pages/FriendRequests';

const clerkPubKey = "pk_test_ZmVhc2libGUtZmlsbHktMi5jbGVyay5hY2NvdW50cy5kZXYk";

function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <Sidebar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/requests" element={<FriendRequests />} />
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
        bodyClassName="text-white"
        progressClassName="bg-gradient-to-r from-orange-500 to-orange-600"
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
