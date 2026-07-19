import React, { useState } from 'react';
import { identifyPlantFromImage } from '../services/api';

function PlantNetIdentifier({ base64Image, onSelectPlant }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const identify = async () => {
    if (!base64Image) return;
    setLoading(true);
    setError(null);
    try {
      // Remove the data:image/jpeg;base64, prefix if present, because Apps Script expects raw base64
      const rawBase64 = base64Image.split(',')[1] || base64Image;
      const res = await identifyPlantFromImage(rawBase64);
      
      if (res.results && res.results.length > 0) {
        setResults(res.results.slice(0, 3)); // Keep top 3
      } else {
        setError("No plants identified or error from PlantNet.");
      }
    } catch (err) {
      setError("Failed to contact PlantNet API.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!base64Image) return null;

  return (
    <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-green-800">PlantNet AI Identification</h3>
          <img src="/plantnet-logo.png" alt="Powered by PlantNet" className="h-6 mt-1" />
        </div>
        <button 
          onClick={identify}
          disabled={loading}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Identifying...' : 'Identify Photo'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-2">Click a suggestion to auto-fill the form:</p>
          {results.map((r, i) => (
            <button 
              key={i}
              onClick={() => onSelectPlant(r)}
              className="w-full text-left bg-white p-3 rounded border border-green-300 hover:bg-green-100 transition flex justify-between items-center"
            >
              <div>
                <p className="font-bold text-gray-800">{r.species.scientificNameWithoutAuthor}</p>
                <p className="text-xs text-gray-500">{r.species.commonNames?.join(', ')}</p>
              </div>
              <div className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full font-bold">
                {Math.round(r.score * 100)}% Match
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default PlantNetIdentifier;
