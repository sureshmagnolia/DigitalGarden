import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import MetadataForm from '../components/MetadataForm';
import PlantNetIdentifier from '../components/PlantNetIdentifier';
import { submitPlantData } from '../services/api';

function SubmitPage() {
  const [base64Image, setBase64Image] = useState(null);
  const [exifData, setExifData] = useState(null);
  const [autoPlantData, setAutoPlantData] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handlePhotoCapture = (base64, exif) => {
    setBase64Image(base64);
    setExifData(exif);
  };

  const handleFormSubmit = async (payload) => {
    setError(null);
    try {
      const result = await submitPlantData(payload);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to submit.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    }
  };

  if (success) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-green-700 mb-4">Submission Successful!</h2>
        <p className="mb-6 text-gray-600">Your plant has been sent to the admin for review.</p>
        <Link to="/" className="bg-gray-800 text-white px-6 py-2 rounded shadow hover:bg-gray-900">Back Home</Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Submit a Plant</h2>
        <Link to="/" className="text-green-600 underline">Back Home</Link>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">1. Select Photo</h3>
          <CameraCapture onPhotoCapture={handlePhotoCapture} />
          <PlantNetIdentifier 
            base64Image={base64Image} 
            onSelectPlant={(plantNetData) => setAutoPlantData(plantNetData)} 
          />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">2. Plant Details</h3>
          <MetadataForm 
            base64Image={base64Image} 
            exifData={exifData}
            autoPlantData={autoPlantData}
            onSubmit={handleFormSubmit}
          />
        </div>
      </div>
    </div>
  );
}

export default SubmitPage;
