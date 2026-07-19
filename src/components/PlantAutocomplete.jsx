import React, { useState, useEffect, useRef } from 'react';

function PlantAutocomplete({ value, onChange, onSelect }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const fetchSuggestions = async (searchTerm) => {
    if (searchTerm.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Append wildcard for partial word matching (e.g. "Quercus al*")
      const wildcardSearch = searchTerm + '*';
      const res = await fetch(`https://powo.science.kew.org/api/2/search?q=${encodeURIComponent(wildcardSearch)}`);
      const data = await res.json();
      if (data.results) {
        setSuggestions(data.results.slice(0, 5));
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("POWO Autocomplete Error:", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setShowDropdown(true);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
  };

  const handleSelect = (item) => {
    let newName = item.name;
    
    // If they selected a Genus, append a space to prompt for species
    if (item.rank === 'Genus') {
      newName = newName + ' ';
      setQuery(newName);
      onChange(newName);
      // Keep dropdown open but fetch new suggestions for the genus space
      fetchSuggestions(newName);
    } else {
      setQuery(newName);
      onChange(newName);
      setShowDropdown(false);
      onSelect(item); // Only trigger full extended metadata fetch if it's a specific species selection
    }
  };

  return (
    <div className="relative">
      <input 
        type="text" 
        value={query} 
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        className="w-full border border-gray-300 rounded px-3 py-2"
        placeholder="e.g. Quercus robur"
        autoComplete="off"
      />
      
      {showDropdown && (query.length >= 3) && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded shadow-lg max-h-60 overflow-y-auto">
          {loading && <div className="p-2 text-sm text-gray-500">Searching POWO...</div>}
          
          {!loading && suggestions.length === 0 && (
            <div className="p-2 text-sm text-gray-500">No matches found.</div>
          )}
          
          {!loading && suggestions.map((item, index) => (
            <div 
              key={item.fqId || index}
              onClick={() => handleSelect(item)}
              className="p-2 border-b last:border-b-0 hover:bg-green-50 cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800">{item.name}</span>
                {item.rank && <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded">{item.rank}</span>}
              </div>
              {item.author && <div className="text-xs text-gray-500">{item.author}</div>}
              {item.accepted && item.accepted.name && (
                <div className="text-xs text-blue-600 mt-1">Accepted: {item.accepted.name}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PlantAutocomplete;
