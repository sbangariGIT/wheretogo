import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, logEvent } from "firebase/analytics";
import { collection, doc, getDoc } from "firebase/firestore";
// Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import firebaseConfig from './constants.tsx';
console.log(firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);
logEvent(analytics, 'notification_received');

// Function to get the latest document from a city collection
export async function getLatestCityDocument(city: string) {
  try {
    const cityRef = collection(db, city);
    const latestDocRef = doc(cityRef, 'latest');
    const docSnapshot = await getDoc(latestDocRef);

    if (!docSnapshot.exists()) {
      throw new Error(`Document not found for: ${city}`);
    }

    return docSnapshot.data();
  } catch (error) {
    console.error(`Error fetching document for ${city}:`, error);
    throw error;
  }
} 

// City and timezone data (copied from backend)
const CITIES_BY_TIMEZONE = {
  "America/New_York": [
    { city_id: 1, city_name: "New York", country: "USA", timezone: "America/New_York" },
    { city_id: 2, city_name: "Philadelphia", country: "USA", timezone: "America/New_York" },
    { city_id: 3, city_name: "Jacksonville", country: "USA", timezone: "America/New_York" },
    { city_id: 4, city_name: "Columbus", country: "USA", timezone: "America/New_York" },
    { city_id: 5, city_name: "Charlotte", country: "USA", timezone: "America/New_York" },
    { city_id: 6, city_name: "Boston", country: "USA", timezone: "America/New_York" },
  ],
  "America/Chicago": [
    { city_id: 7, city_name: "Chicago", country: "USA", timezone: "America/Chicago" },
    { city_id: 8, city_name: "Houston", country: "USA", timezone: "America/Chicago" },
    { city_id: 9, city_name: "San Antonio", country: "USA", timezone: "America/Chicago" },
    { city_id: 10, city_name: "Dallas", country: "USA", timezone: "America/Chicago" },
  ],
  "America/Los_Angeles": [
    { city_id: 11, city_name: "Los Angeles", country: "USA", timezone: "America/Los_Angeles" },
    { city_id: 12, city_name: "San Diego", country: "USA", timezone: "America/Los_Angeles" },
    { city_id: 13, city_name: "San Jose", country: "USA", timezone: "America/Los_Angeles" },
    { city_id: 14, city_name: "San Francisco", country: "USA", timezone: "America/Los_Angeles" },
  ],
  "Asia/Kolkata": [
    { city_id: 101, city_name: "Mumbai", country: "India", timezone: "Asia/Kolkata" },
    { city_id: 102, city_name: "Delhi", country: "India", timezone: "Asia/Kolkata" },
    { city_id: 103, city_name: "Bengaluru", country: "India", timezone: "Asia/Kolkata" },
    { city_id: 104, city_name: "Hyderabad", country: "India", timezone: "Asia/Kolkata" },
    { city_id: 105, city_name: "Ahmedabad", country: "India", timezone: "Asia/Kolkata" },
    { city_id: 106, city_name: "Chennai", country: "India", timezone: "Asia/Kolkata" },
    { city_id: 107, city_name: "Kolkata", country: "India", timezone: "Asia/Kolkata" },
    { city_id: 108, city_name: "Pune", country: "India", timezone: "Asia/Kolkata" },
  ],
};

type City = { city_id: number; city_name: string; country: string; timezone: string };

type ItineraryItem = {
  activity: string;
  address: string;
  end_time: string;
  google_maps_link: string;
  picture_url: string;
  start_time: string;
};

type ItineraryResponse = {
  itinerary: ItineraryItem[];
  reason: string;
  request_process_time: number;
};

// Real function to get itinerary from Firebase
const getItineraryForCity = async (city: City): Promise<ItineraryResponse> => {
  try {
    const cityData = await getLatestCityDocument(city.city_name);
    return cityData as ItineraryResponse;
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    throw new Error(`Failed to fetch itinerary for ${city.city_name}`);
  }
};

// Flatten all cities for search
const ALL_CITIES = Object.values(CITIES_BY_TIMEZONE).flat();

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itineraryRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const today = new Date().toLocaleDateString();

  // Filter cities based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCities([]);
      setShowDropdown(false);
      return;
    }

    const filtered = ALL_CITIES.filter(city =>
      city.city_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.country.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCities(filtered);
    setShowDropdown(true);
  }, [searchTerm]);

  // Handle city selection
  const handleCitySelect = async (city: City) => {
    setSelectedCity(city);
    setSearchTerm(`${city.city_name}, ${city.country}`);
    setShowDropdown(false);
    setLoading(true);
    setError(null); // Clear any previous errors

    try {
      const itineraryData = await getItineraryForCity(city);
      setItinerary(itineraryData);
      
      // Scroll to itinerary section
      setTimeout(() => {
        itineraryRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch itinerary');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!e.target.value) {
      setSelectedCity(null);
      setItinerary(null);
      setError(null);
    }
  };

  // Close error dialog
  const closeError = () => {
    setError(null);
  };

  return (
    <div className="odi-bg">
      {/* Error Dialog */}
      {error && (
        <div className="odi-error-overlay">
          <div className="odi-error-dialog">
            <div className="odi-error-header">
              <h3>Oops! Something went wrong</h3>
              <button onClick={closeError} className="odi-error-close">×</button>
            </div>
              <p className="odi-error-content">
                Please try selecting a different city or check back later.
              </p>
            <div className="odi-error-actions">
              <button onClick={closeError} className="odi-error-button">
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="odi-hero">
        <div className="odi-hero-content">
          <h1 className="odi-hero-title">Discover the perfect day in the city</h1>
          <p className="odi-hero-subtitle">Smart itineraries crafted daily using live weather, events, and local vibes — tailored for your city adventures.</p>
          
          {/* Search Bar */}
          <div className="odi-search-container" ref={searchRef}>
            <div className="odi-search-wrapper">
              <input
                type="text"
                className="odi-search-input"
                placeholder="Search for a city..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && filteredCities.length > 0 && (
                <div className="odi-search-dropdown">
                  {filteredCities.map((city) => (
                    <div
                      key={city.city_id}
                      className="odi-dropdown-item"
                      onClick={() => handleCitySelect(city)}
                    >
                      <span className="odi-dropdown-city">{city.city_name}</span>
                      <span className="odi-dropdown-country">{city.country}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Itinerary Section */}
      {selectedCity && (
        <section className="odi-itinerary-section" ref={itineraryRef}>
          <div className="odi-container">
            <div className="odi-itinerary-header">
              <h2 className="odi-itinerary-title">
                {loading ? 'Loading itinerary...' : `Itinerary for ${selectedCity.city_name}`}
              </h2>
              <div className="odi-date">Date: {today}</div>
            </div>

            {loading && (
              <div className="odi-loading">
                <div className="odi-spinner"></div>
                <p>Creating your perfect day...</p>
              </div>
            )}

            {itinerary && !loading && (
              <>
                <div className="odi-reason">
                  <p>{itinerary.reason}</p>
                </div>
                <ul className="odi-itinerary-list">
                  {itinerary.itinerary.map((item, idx) => (
                    <li key={idx} className="odi-itinerary-card">
                      <div className="odi-card-img-wrap">
                        <img src={item.picture_url} alt={item.activity} className="odi-card-img" />
                      </div>
                      <div className="odi-card-content">
                        <h3 className="odi-card-activity">{item.activity}</h3>
                        <div className="odi-card-time">
                          <strong>Time:</strong> {item.start_time} - {item.end_time}
                        </div>
                        <div className="odi-card-address">
                          <strong>Address:</strong> {item.address}
                        </div>
                        <a 
                          href={item.google_maps_link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="odi-card-link"
                        >
                          View on Google Maps
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
