import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser, SignedIn, SignedOut } from '@clerk/clerk-react';
import { getApprovedSubmissions } from '../services/api';

// Define Admin emails here. Anyone not on this list is a regular "Submitter".
export const ADMIN_EMAILS = [
  "sureshmagnolia@gmail.com", // Super Admin
  // Add other admin emails here, separated by commas:
  // "another.admin@gmail.com",
];

function Home() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin = isLoaded && isSignedIn && (
    ADMIN_EMAILS.includes(user.primaryEmailAddress?.emailAddress) || 
    user.publicMetadata?.role === 'admin'
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getApprovedSubmissions();
        if (result.success) {
          // Parse the POWO_Data string back to an object for each entry to make filtering/stats easier
          const parsedData = (result.data || []).map(entry => {
            let parsedPowo = {};
            try {
              if (entry.POWO_Data) {
                parsedPowo = JSON.parse(entry.POWO_Data);
              }
            } catch (e) {
              console.error("Failed to parse POWO_Data for entry", entry.ID);
            }
            return {
              ...entry,
              parsedPowo
            };
          });
          // Reverse to show newest first
          setEntries(parsedData.reverse());
        } else {
          setError("Failed to load entries.");
        }
      } catch (err) {
        console.error(err);
        setError("Network error fetching entries.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Compute Stats
  const stats = useMemo(() => {
    const families = new Set();
    const genera = new Set();
    const species = new Set();
    const submitters = {};

    entries.forEach(entry => {
      const powo = entry.parsedPowo;
      if (powo.plantNetFamily) families.add(powo.plantNetFamily);
      if (powo.plantNetGenus) genera.add(powo.plantNetGenus);
      
      const speciesName = powo.powoAcceptedName || powo.accepted?.name || powo.name || entry.PlantName;
      if (speciesName) species.add(speciesName);

      const submitter = entry.Submitter || 'Anonymous';
      submitters[submitter] = (submitters[submitter] || 0) + 1;
    });

    let topSubmitter = 'None';
    let maxSubmissions = 0;
    for (const [name, count] of Object.entries(submitters)) {
      if (count > maxSubmissions) {
        maxSubmissions = count;
        topSubmitter = name;
      }
    }

    return {
      totalEntries: entries.length,
      totalFamilies: families.size,
      totalGenera: genera.size,
      totalSpecies: species.size,
      topSubmitter,
      maxSubmissions
    };
  }, [entries]);

  // Multi-variable search
  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) return entries;
    const lowerTerm = searchTerm.toLowerCase();
    
    return entries.filter(entry => {
      const powo = entry.parsedPowo;
      
      const searchFields = [
        entry.PlantName,
        entry.Submitter,
        powo.plantNetFamily,
        powo.plantNetGenus,
        powo.powoAcceptedName,
        powo.accepted?.name,
        powo.name
      ].filter(Boolean).map(s => s.toLowerCase());

      return searchFields.some(field => field.includes(lowerTerm));
    });
  }, [entries, searchTerm]);


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <div className="bg-green-700 text-white p-8 md:py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">DigitalGarden</h1>
        <p className="text-lg text-green-100 max-w-2xl mx-auto mb-8">
          A community-driven digital plant database. Explore our collection, search by metadata, 
          and view high-resolution submissions.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <SignedIn>
            {isAdmin && (
              <Link to="/admin" className="bg-gray-800 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-gray-900 transition">
                Admin Dashboard
              </Link>
            )}
            <Link to="/submit" className="bg-white text-green-700 font-semibold px-6 py-3 rounded-lg shadow hover:bg-gray-100 transition">
              Submit a Plant
            </Link>
          </SignedIn>
          <SignedOut>
             <Link to="/submit" className="bg-white text-green-700 font-semibold px-6 py-3 rounded-lg shadow hover:bg-gray-100 transition">
              Sign In to Submit
            </Link>
          </SignedOut>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full p-4 md:p-8 flex-1">
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.totalEntries}</div>
            <div className="text-sm text-gray-500 font-medium">Total Entries</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalFamilies}</div>
            <div className="text-sm text-gray-500 font-medium">Families</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.totalGenera}</div>
            <div className="text-sm text-gray-500 font-medium">Genera</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.totalSpecies}</div>
            <div className="text-sm text-gray-500 font-medium">Species</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center col-span-2 md:col-span-1">
            <div className="text-lg font-bold text-gray-800 truncate px-2" title={stats.topSubmitter}>
              {stats.topSubmitter}
            </div>
            <div className="text-sm text-gray-500 font-medium">Top Submitter ({stats.maxSubmissions})</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
          <input
            type="text"
            list="search-suggestions"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm shadow-sm"
            placeholder="Search by plant name, family, genus, or submitter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <datalist id="search-suggestions">
            {Array.from(new Set(
              entries.flatMap(entry => {
                const p = entry.parsedPowo;
                return [
                  entry.PlantName, entry.Submitter, 
                  p.plantNetFamily, p.plantNetGenus, 
                  p.powoAcceptedName, p.accepted?.name, p.name
                ];
              }).filter(Boolean)
            )).sort().map(term => (
              <option key={term} value={term} />
            ))}
          </datalist>
        </div>

        {/* Gallery */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-lg text-center">{error}</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
            <span className="text-4xl mb-4 block">🌱</span>
            No approved plants yet. Be the first to submit!
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
            No entries found matching "{searchTerm}"
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEntries.map((entry) => {
              const powo = entry.parsedPowo;
              return (
                <div key={entry.ID} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                  <div className="h-48 overflow-hidden bg-gray-100 relative">
                    {entry.FileID ? (
                      <img 
                        src={`https://drive.google.com/thumbnail?id=${entry.FileID}&sz=w800`} 
                        alt={entry.PlantName} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-gray-900 mb-1 leading-tight line-clamp-1" title={entry.PlantName}>
                      {entry.PlantName || 'Unknown'}
                    </h3>
                    
                    {powo.powoAcceptedName || powo.accepted?.name || powo.name ? (
                      <p className="text-sm text-green-700 italic mb-2 line-clamp-1" title={powo.powoAcceptedName || powo.accepted?.name || powo.name}>
                        {powo.powoAcceptedName || powo.accepted?.name || powo.name}
                      </p>
                    ) : (
                      <div className="mb-2"></div>
                    )}
                    
                    <div className="mt-auto space-y-1">
                      {powo.plantNetFamily && (
                        <p className="text-xs text-gray-600 truncate"><strong className="text-gray-400 font-medium">Family:</strong> {powo.plantNetFamily}</p>
                      )}
                      {powo.plantNetGenus && (
                        <p className="text-xs text-gray-600 truncate"><strong className="text-gray-400 font-medium">Genus:</strong> {powo.plantNetGenus}</p>
                      )}
                      <p className="text-xs text-gray-600 truncate mt-2 pt-2 border-t border-gray-100">
                        <strong className="text-gray-400 font-medium">By:</strong> {entry.Submitter}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
