import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from '@clerk/clerk-react';
import SubmitPage from './pages/SubmitPage';
import AdminPage from './pages/AdminPage';

function Home() {
  return (
    <div className="p-8 text-center max-w-2xl mx-auto pt-20">
      <h1 className="text-4xl font-bold text-green-700 mb-4">DigitalGarden</h1>
      <p className="text-gray-600 mb-8 text-lg">
        A community-driven digital plant database. Capture photos, extract metadata, 
        and help us build an open botanical archive.
      </p>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link to="/submit" className="bg-green-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-green-700 transition">
          Submit a Plant
        </Link>
        <Link to="/admin" className="bg-gray-800 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-gray-900 transition">
          Admin Dashboard
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-green-700 p-4 text-white shadow-md">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link to="/" className="font-bold text-xl tracking-wide">🌿 DigitalGarden</Link>
            <div>
              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <Link to="/submit" className="text-white hover:underline font-semibold">Sign In</Link>
              </SignedOut>
            </div>
          </div>
        </nav>
        <main className="flex-1 max-w-6xl w-full mx-auto bg-white shadow-sm">
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
              <>
                <SignedIn>
                  <AdminPage />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
