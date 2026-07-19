import React, { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

function CameraCapture({ onPhotoCapture }) {
  const [photo, setPhoto] = useState(null);

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt // Asks user to use Camera or Photos
      });

      // image.base64String contains the raw base64 data
      setPhoto(`data:image/jpeg;base64,${image.base64String}`);
      
      if (onPhotoCapture) {
        onPhotoCapture(image.base64String, image.exif); // Pass EXIF data if available
      }
    } catch (error) {
      console.error('Error taking photo', error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {photo ? (
        <div className="mb-4">
          <img src={photo} alt="Captured plant" className="w-full max-w-sm rounded-lg shadow-md" />
          <button 
            onClick={() => setPhoto(null)} 
            className="mt-2 text-red-600 underline text-sm"
          >
            Remove / Retake
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm h-48 bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center mb-4">
          <span className="text-gray-500">No image selected</span>
        </div>
      )}

      <button 
        onClick={takePhoto}
        className="bg-green-600 text-white font-semibold py-2 px-6 rounded shadow hover:bg-green-700 transition"
      >
        {photo ? 'Retake Photo' : 'Take / Select Photo'}
      </button>
    </div>
  );
}

export default CameraCapture;
