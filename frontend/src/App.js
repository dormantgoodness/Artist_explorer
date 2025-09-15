import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleSearch = async (e) => {
  e.preventDefault();
  setSelectedArtist(null);

  console.log("Searching for:", query); // Add this

  try {
    console.log("Making request to:", `http://localhost:3001/api/search?query=${query}`); // Add this
    
    const response = await fetch(`http://localhost:3001/api/search?query=${query}`);
    
    console.log("Response status:", response.status); // Add this
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    console.log("Response data:", data); // Add this
    
    setResults(data.artists || []);
  } catch (err) {
    console.error("Detailed fetch error:", err); // More detailed logging
    alert(`Search failed: ${err.message}`); // Show actual error message
  }
};

  const handleView = async (artist) => {
  try {
    const [tracksRes, albumsRes] = await Promise.all([
      fetch(`http://localhost:3001/api/artists/${artist.id}/top-tracks`),
      fetch(`http://localhost:3001/api/artists/${artist.id}/albums`)
    ]);

    const tracksData = await tracksRes.json();
    const albumsData = await albumsRes.json();

    setSelectedArtist({
      id: artist.id,
      name: artist.name,
      topTracks: tracksData.tracks || [], // Store full track objects, not just titles
      albums: (albumsData.albums || []).map(a => a.title)
      });
    } catch (err) {
      console.error("View fetch error:", err);
      alert("Failed to load artist details.");
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/favorites');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setFavorites(data.favorites || []);
    } catch (err) {
      console.error("Load favorites error:", err);
    }
  };

  const handleAdd = async (artist) => {
    try {
      const response = await fetch(`http://localhost:3001/api/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: artist.id,
          name: artist.name,
          picture: artist.picture
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      //alert("Artist added to your favorites!");
      loadFavorites(); // Refresh the favorites list
    } catch (err) {
      console.error("Add favorite error:", err);
      alert(`Failed to add artist: ${err.message}`);
    }
  };

  const handleRemove = async (artistId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/favorites/${artistId}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      loadFavorites(); // Refresh the favorites list
      //alert("Artist removed from favorites!");
    } catch (err) {
      console.error("Remove favorite error:", err);
      alert(`Failed to remove artist: ${err.message}`);
    }
  };

  return (
    <div className="container">
      <h1 className="title">🎵 Artist Explorer</h1>

      <form onSubmit={handleSearch} className="search-box">
        <input
          type="text"
          placeholder="Search for an artist..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">Search</button>
      </form>

      <h2 className="subtitle">Search Results</h2>
      <div className="results-grid">
        {results.map((artist) => (
          <div key={artist.id} className="card">
            {artist.picture && (   // ✅ fixed: use picture
              <img src={artist.picture} alt={artist.name} className="card-img" />
            )}
            <h3 className="card-title">{artist.name}</h3>
            <div className="button-row">
              <button onClick={() => handleView(artist)} className="btn view-btn">View</button>
              <button onClick={() => handleAdd(artist)} className="btn add-btn">Add</button>
            </div>
          </div>
        ))}
      </div>

      {favorites.length > 0 && (
        <>
          <h2 className="subtitle">Your Favorites</h2>
          <div className="results-grid">
            {favorites.map((artist) => (
              <div key={artist.artistId} className="card">
                {artist.picture && (
                  <img src={artist.picture} alt={artist.name} className="card-img" />
                )}
                <h3 className="card-title">{artist.name}</h3>
                <div className="button-row">
                  <button onClick={() => handleRemove(artist.artistId)} className="btn add-btn">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedArtist && (
        <div className="details">
          <h2>{selectedArtist.name}</h2>

          <h3>Top Tracks</h3>
            <ul className="list">
              {selectedArtist.topTracks.map((track, index) => (
                <li key={index} className="list-item">
                  <div>{track.title}</div>
                  {track.preview && (
                    <audio controls style={{ marginTop: '5px', width: '100%' }}>
                      <source src={track.preview} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  )}
                </li>
              ))}
            </ul>

          <h3>Albums</h3>
          <ul className="list">
            {selectedArtist.albums.map((album, index) => (
              <li key={index} className="list-item">{album}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
