import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, UserButton, useUser } from '@clerk/clerk-react';
import Home, { ADMIN_EMAILS } from './pages/Home';
import SubmitPage from './pages/SubmitPage';
import AdminPage from './pages/AdminPage';

// A wrapper component to protect admin routes
function AdminRoute({ children }) {
  const { user, isLoaded, isSignedIn } = useUser();
  
  if (!isLoaded) return null;
  
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }
  
  const isAdmin = 
    ADMIN_EMAILS.includes(user.primaryEmailAddress?.emailAddress) || 
    user.publicMetadata?.role === 'admin';
  
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="text-6xl mb-4">⛔</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">You do not have permission to view the admin dashboard.</p>
        <Link to="/" className="text-green-600 underline">Return to Home</Link>
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-green-700 p-4 text-white shadow-md">
          <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
            <Link to="/" className="font-bold text-xl tracking-wide flex items-center gap-2">
              <span className="text-2xl">🌿</span> DigitalGarden
            </Link>
            <div>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <Link to="/submit" className="text-white hover:underline font-semibold bg-green-800 px-4 py-2 rounded-lg text-sm">
                  Sign In
                </Link>
              </SignedOut>
            </div>
          </div>
        </nav>
        <main className="flex-1 w-full flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/submit" element={
              <>
                <SignedIn>
                  <SubmitPage />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
