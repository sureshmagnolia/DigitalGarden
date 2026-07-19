import React, { useState, useEffect } from 'react';

function MetadataForm({ base64Image, exifData, autoPlantName, onSubmit }) {
  const [formData, setFormData] = useState({
    submitterName: '',
    plantName: '',
    lat: exifData?.GPSLatitude || '',
    lng: exifData?.GPSLongitude || '',
    notes: '',
    powoData: null
  });

  useEffect(() => {
    if (autoPlantName) {
      setFormData(prev => ({ ...prev, plantName: autoPlantName }));
      
      // Fetch POWO Data
      fetch(`https://powo.science.kew.org/api/2/search?q=${encodeURIComponent(autoPlantName)}`)
        .then(res => res.json())
        .then(data => {
          if (data.results && data.results.length > 0) {
            const bestMatch = data.results[0];
            setFormData(prev => ({ ...prev, powoData: bestMatch }));
          }
        })
        .catch(err => console.error("POWO Error:", err));
    }
  }, [autoPlantName]);

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!base64Image) {
      alert("Please capture an image first.");
      return;
    }

    setLoading(true);
    
    const payload = {
      ...formData,
      imageBase64: base64Image,
      fileName: `plant_${Date.now()}.jpg`,
      imageMimeType: 'image/jpeg'
    };

    if (onSubmit) {
      await onSubmit(payload);
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h3 className="text-xl font-bold mb-4">Plant Metadata</h3>
      
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-1">Submitter Name</label>
        <input 
          type="text" 
          name="submitterName" 
          required
          value={formData.submitterName} 
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="Jane Doe"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-1">Plant Name (if known)</label>
        <input 
          type="text" 
          name="plantName" 
          value={formData.plantName} 
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="e.g. Quercus robur"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Latitude</label>
          <input 
            type="text" 
            name="lat" 
            value={formData.lat} 
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Longitude</label>
          <input 
            type="text" 
            name="lng" 
            value={formData.lng} 
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-1">Notes / Location Name</label>
        <textarea 
          name="notes" 
          value={formData.notes} 
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2"
          rows="3"
        ></textarea>
      </div>

      {formData.powoData && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-6 text-sm">
          <p className="font-bold text-blue-800">Taxonomic Data (POWO)</p>
          <p className="text-blue-900"><strong>Accepted Name:</strong> {formData.powoData.accepted?.name || formData.powoData.name}</p>
          <p className="text-blue-900"><strong>Author:</strong> {formData.powoData.author}</p>
          <p className="text-blue-900"><strong>Synonyms:</strong> {formData.powoData.synonyms ? formData.powoData.synonyms.map(s => s.name).join(', ') : 'None'}</p>
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading || !base64Image}
        className="w-full bg-green-600 text-white font-bold py-3 rounded shadow hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit to Database'}
      </button>
    </form>
  );
}

export default MetadataForm;
