import React, { useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import EXIF from 'exif-js';

function CameraCapture({ onPhotoCapture }) {
  const [photo, setPhoto] = useState(null);
  const fileInputRef = useRef(null);

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

  const processImage = async (image, isLivePhoto) => {
    let locationExif = null;

    // 1. Try to get GPS from the original photo's EXIF data (Native iOS/Android or Pre-filled)
    if (image.exif && (image.exif.Latitude || image.exif.GPSLatitude)) {
      locationExif = {
        GPSLatitude: image.exif.Latitude || image.exif.GPSLatitude,
        GPSLongitude: image.exif.Longitude || image.exif.GPSLongitude
      };
    }

    // 2. Fallback to current live location ONLY if it was taken live via Camera
    if (!locationExif && isLivePhoto) {
      try {
        const position = await Geolocation.getCurrentPosition();
        locationExif = {
          GPSLatitude: position.coords.latitude,
          GPSLongitude: position.coords.longitude
        };
      } catch (geoErr) {
        console.warn("Location access denied or unavailable", geoErr);
      }
    }

    // 3. Compress the image locally via Canvas
    const compressedBase64 = await compressImage(image.base64String, 1024, 0.6);

    setPhoto(`data:image/jpeg;base64,${compressedBase64}`);
    
    if (onPhotoCapture) {
      onPhotoCapture(compressedBase64, locationExif);
    }
  };

  const captureLivePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 100, 
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        exif: true
      });
      await processImage(image, true);
    } catch (error) {
      console.error('Error taking photo', error);
    }
  };

  const selectGalleryPhoto = async () => {
    if (Capacitor.getPlatform() === 'web') {
      // Capacitor Web strips EXIF data during its internal file handling.
      // Use native HTML file input to get untouched raw binary for EXIF extraction.
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else {
      try {
        const image = await Camera.getPhoto({
          quality: 100, 
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Photos,
          exif: true
        });
        await processImage(image, false);
      } catch (error) {
        console.error('Error selecting photo', error);
      }
    }
  };

  const handleWebFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const extractExif = (fileObj) => new Promise((resolve) => {
      let resolved = false;

      // Safety timeout in case EXIF.getData gets stuck
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }, 1000);

      try {
        EXIF.getData(fileObj, function() {
          if (resolved) return;
          resolved = true;
          clearTimeout(timer);

          let locationExif = null;
          const lat = EXIF.getTag(this, "GPSLatitude");
          const lng = EXIF.getTag(this, "GPSLongitude");
          
          if (lat && lng) {
            const latRef = EXIF.getTag(this, "GPSLatitudeRef") || "N";
            const lngRef = EXIF.getTag(this, "GPSLongitudeRef") || "W";
            
            const toDec = (arr) => {
               const d = arr[0].numerator ? arr[0].numerator/arr[0].denominator : arr[0];
               const m = arr[1].numerator ? arr[1].numerator/arr[1].denominator : arr[1];
               const s = arr[2].numerator ? arr[2].numerator/arr[2].denominator : arr[2];
               return d + (m/60) + (s/3600);
            };
            
            let latDec = toDec(lat);
            let lngDec = toDec(lng);
            if (latRef === "S") latDec = -latDec;
            if (lngRef === "W") lngDec = -lngDec;

            locationExif = {
              Latitude: latDec.toFixed(6),
              Longitude: lngDec.toFixed(6)
            };
          }
          resolve(locationExif);
        });
      } catch (err) {
        console.warn("EXIF extraction error", err);
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(null);
        }
      }
    });

    const locationExif = await extractExif(file);

    // Now read the file to get the base64 image data for preview and upload
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Str = event.target.result.split(',')[1];
      const pseudoImage = {
        base64String: base64Str,
        exif: locationExif || {} // Pass extracted EXIF to processImage natively
      };
      await processImage(pseudoImage, false);
    };
    reader.readAsDataURL(file);

    e.target.value = null; // Reset input
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

      {!photo && (
        <div className="flex gap-4 w-full">
          <button 
            onClick={captureLivePhoto}
            className="flex-1 bg-green-600 text-white font-semibold py-2 px-4 rounded shadow hover:bg-green-700 transition"
          >
            📷 Camera
          </button>
          <button 
            onClick={selectGalleryPhoto}
            className="flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow hover:bg-blue-700 transition"
          >
            🖼️ Gallery
          </button>
          {/* Hidden native file input strictly for Web Gallery uploads */}
          <input 
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleWebFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

export default CameraCapture;
