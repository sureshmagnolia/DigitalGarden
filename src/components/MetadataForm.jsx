import React, { useState, useEffect } from 'react';

function MetadataForm({ base64Image, exifData, autoPlantData, onSubmit }) {
  const [formData, setFormData] = useState({
    submitterName: '',
    plantName: '',
    lat: exifData?.GPSLatitude || '',
    lng: exifData?.GPSLongitude || '',
    notes: '',
    powoData: null
  });

  useEffect(() => {
    if (autoPlantData) {
      const sciName = autoPlantData.species.scientificNameWithoutAuthor;
      setFormData(prev => ({ ...prev, plantName: sciName }));
      
      const extendedData = {
        plantNetFamily: autoPlantData.species.family?.scientificNameWithoutAuthor || 'Unknown',
        plantNetGenus: autoPlantData.species.genus?.scientificNameWithoutAuthor || 'Unknown',
        plantNetCommonNames: autoPlantData.species.commonNames || [],
        powoAcceptedName: 'Unknown',
        powoAuthor: 'Unknown',
        powoSynonyms: []
      };

      // Fetch POWO Data
      fetch(`https://powo.science.kew.org/api/2/search?q=${encodeURIComponent(sciName)}`)
        .then(res => res.json())
        .then(data => {
          if (data.results && data.results.length > 0) {
            const bestMatch = data.results[0];
            extendedData.powoAcceptedName = bestMatch.accepted?.name || bestMatch.name || 'Unknown';
            extendedData.powoAuthor = bestMatch.author || 'Unknown';
            extendedData.powoSynonyms = bestMatch.synonyms ? bestMatch.synonyms.map(s => s.name) : [];
          }
          setFormData(prev => ({ ...prev, powoData: extendedData }));
        })
        .catch(err => {
          console.error("POWO Error:", err);
          setFormData(prev => ({ ...prev, powoData: extendedData }));
        });
    }
  }, [autoPlantData]);

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
          <p className="font-bold text-blue-800">Extended Plant Metadata</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <p className="text-blue-900"><strong>Family:</strong> {formData.powoData.plantNetFamily}</p>
              <p className="text-blue-900"><strong>Genus:</strong> {formData.powoData.plantNetGenus}</p>
              <p className="text-blue-900"><strong>Common:</strong> {formData.powoData.plantNetCommonNames.length > 0 ? formData.powoData.plantNetCommonNames.join(', ') : 'None'}</p>
            </div>
            <div>
              <p className="text-blue-900"><strong>POWO Match:</strong> {formData.powoData.powoAcceptedName}</p>
              <p className="text-blue-900"><strong>Author:</strong> {formData.powoData.powoAuthor}</p>
              <p className="text-blue-900"><strong>Synonyms:</strong> {formData.powoData.powoSynonyms.length > 0 ? formData.powoData.powoSynonyms.join(', ') : 'None'}</p>
            </div>
          </div>
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
