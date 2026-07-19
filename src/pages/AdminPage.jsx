import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPendingSubmissions, approveSubmission, rejectSubmission } from '../services/api';

function AdminPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const result = await getPendingSubmissions();
      if (result.success) {
        // Map based on the headers returned from the Google Sheet
        // Expected headers: ID, Timestamp, Submitter, PlantName, Lat, Lng, FileURL, FileID, Status, POWO_Data
        setSubmissions(result.data || []);
      } else {
        setError("Failed to load submissions.");
      }
    } catch (err) {
      setError("Network error.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    try {
      const result = await approveSubmission(id);
      if (result.success) {
        setSubmissions(submissions.filter(s => s.ID !== id));
      } else {
        alert("Failed to approve.");
      }
    } catch (e) {
      alert("Error approving.");
    }
  };

  const handleReject = async (id, fileId) => {
    if (!window.confirm("Are you sure you want to reject and delete this submission?")) return;
    
    try {
      const result = await rejectSubmission(id, fileId);
      if (result.success) {
        setSubmissions(submissions.filter(s => s.ID !== id));
      } else {
        alert("Failed to reject.");
      }
    } catch (e) {
      alert("Error rejecting.");
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
        <Link to="/" className="text-green-600 underline">Back Home</Link>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      {loading ? (
        <p className="text-gray-500">Loading pending submissions...</p>
      ) : submissions.length === 0 ? (
        <p className="text-gray-500">No pending submissions to review.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((sub, index) => (
            <div key={sub.ID || index} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
              {sub.FileURL ? (
                <img src={sub.FileURL} alt={sub.PlantName || 'Plant'} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">No Image</div>
              )}
              
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-1">{sub.PlantName || 'Unknown Plant'}</h3>
                <p className="text-sm text-gray-600 mb-1"><strong>Submitted by:</strong> {sub.Submitter}</p>
                <p className="text-sm text-gray-600 mb-1"><strong>Date:</strong> {new Date(sub.Timestamp).toLocaleDateString()}</p>
                
                {(sub.Lat || sub.Lng) && (
                  <p className="text-xs text-blue-600 mb-4 break-all">📍 {sub.Lat}, {sub.Lng}</p>
                )}

                <div className="mt-auto flex gap-2 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => handleApprove(sub.ID)}
                    className="flex-1 bg-green-600 text-white py-2 rounded shadow hover:bg-green-700 text-sm font-semibold"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(sub.ID, sub.FileID)}
                    className="flex-1 bg-red-600 text-white py-2 rounded shadow hover:bg-red-700 text-sm font-semibold"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPage;
