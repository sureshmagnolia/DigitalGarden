import React, { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

function CameraCapture({ onPhotoCapture }) {
  const [photo, setPhoto] = useState(null);

  const compressImage = (base64Str, maxWidth = 1024, quality = 0.6) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = `data:image/jpeg;base64,${base64Str}`;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Output compressed base64 (without the data:image/jpeg;base64, prefix)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl.split(',')[1]);
      };
    });
  };

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 60,
        width: 1024, // Works on Native mobile
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt
      });

      // Fetch exact GPS coordinates at time of capture since compression strips EXIF
      let locationExif = null;
      try {
        const position = await Geolocation.getCurrentPosition();
        locationExif = {
          GPSLatitude: position.coords.latitude,
          GPSLongitude: position.coords.longitude
        };
      } catch (geoErr) {
        console.warn("Location access denied or unavailable", geoErr);
      }

      // Force compression on Web/Desktop using Canvas
      const compressedBase64 = await compressImage(image.base64String);

      setPhoto(`data:image/jpeg;base64,${compressedBase64}`);
      
      if (onPhotoCapture) {
        onPhotoCapture(compressedBase64, locationExif);
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
