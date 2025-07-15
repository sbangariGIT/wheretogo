import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import defaultImage from './assets/default.png';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, logEvent } from "firebase/analytics";
import { collection, doc, getDoc, addDoc} from "firebase/firestore";
// Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import firebaseConfig, {API_URL} from './constants.tsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);
logEvent(analytics, 'wheretogotoday_opened');

// Function to get the latest document from a city collection
export async function getLatestCityDocument(city: string) {
  try {
    const cityRef = collection(db, city);
    const latestDocRef = doc(cityRef, 'latest');
    const docSnapshot = await getDoc(latestDocRef);

    if (!docSnapshot.exists()) {
      // Make the call to create the document, and write to firebase

    // Find city info from CITIES_BY_TIMEZONE
    let cityInfo: any = null;
    for (const tz in CITIES_BY_TIMEZONE) {
      cityInfo = CITIES_BY_TIMEZONE[tz].find((c: any) => c.city_name === city);
      if (cityInfo) break;
    }
    if (!cityInfo) {
      throw new Error(`City info not found for ${city}`);
    }

    const payload = {
      city: cityInfo.city_name,
      timezone: cityInfo.timezone,
      latitude: cityInfo.latitude,
      longitude: cityInfo.longitude
    };

    // Call the backend API to generate itinerary
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to generate itinerary for ${city}: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
    }

    return docSnapshot.data();
  } catch (error) {
    console.error(`Error fetching document for ${city}:`, error);
    throw error;
  }
} 

export async function logCityError(city: string, country: string, errorMessage: string) {
  try {
    // Get user's local time as ISO string
    const userLocalTime = new Date().toISOString();

    // Get browser type (user agent)
    const browserType = navigator.userAgent;

    // Reference to the 'errors' collection, document named after the city, with a new subdocument (auto-id)
    const errorsCollectionRef = collection(db, "errors", city, "logs");

    // Prepare error data
    const errorData = {
      city,
      country,
      errorMessage,
      userLocalTime,
      browserType,
      timestamp: new Date()
    };

    // @ts-ignore
    await addDoc(errorsCollectionRef, errorData);
  } catch (err) {
    console.error("Failed to log city error:", err);
  }
}


// City and timezone data (copied from backend)
const CITIES_BY_TIMEZONE = {
  "America/New_York": [
      {city_id: 1, city_name: "New York", latitude: 40.7128, longitude: -74.0060, country: "USA", timezone: "America/New_York"},
      {city_id: 2, city_name: "Philadelphia", latitude: 39.9526, longitude: -75.1652, country: "USA", timezone: "America/New_York"},
      {city_id: 3, city_name: "Jacksonville", latitude: 30.3322, longitude: -81.6557, country: "USA", timezone: "America/New_York"},
      {city_id: 4, city_name: "Columbus", latitude: 39.9612, longitude: -82.9988, country: "USA", timezone: "America/New_York"},
      {city_id: 5, city_name: "Charlotte", latitude: 35.2271, longitude: -80.8431, country: "USA", timezone: "America/New_York"},
      {city_id: 6, city_name: "Boston", latitude: 42.3601, longitude: -71.0589, country: "USA", timezone: "America/New_York"},
  ],
  "America/Chicago": [
      {city_id: 7, city_name: "Chicago", latitude: 41.8781, longitude: -87.6298, country: "USA", timezone: "America/Chicago"},
      {city_id: 8, city_name: "Houston", latitude: 29.7604, longitude: -95.3698, country: "USA", timezone: "America/Chicago"},
      {city_id: 9, city_name: "San Antonio", latitude: 29.4241, longitude: -98.4936, country: "USA", timezone: "America/Chicago"},
      {city_id: 10, city_name: "Dallas", latitude: 32.7767, longitude: -96.7970, country: "USA", timezone: "America/Chicago"},
      {city_id: 15, city_name: "Austin", latitude: 30.2672, longitude: -97.7431, country: "USA", timezone: "America/Chicago"}
  ],
  "America/Los_Angeles": [
      {city_id: 11, city_name: "Los Angeles", latitude: 34.0522, longitude: -118.2437, country: "USA", timezone: "America/Los_Angeles"},
      {city_id: 12, city_name: "San Diego", latitude: 32.7157, longitude: -117.1611, country: "USA", timezone: "America/Los_Angeles"},
      {city_id: 13, city_name: "San Jose", latitude: 37.3382, longitude: -121.8863, country: "USA", timezone: "America/Los_Angeles"},
      {city_id: 14, city_name: "San Francisco", latitude: 37.7749, longitude: -122.4194, country: "USA", timezone: "America/Los_Angeles"},
  ],
  "Asia/Kolkata": [
      {city_id: 101, city_name: "Mumbai", latitude: 19.0760, longitude: 72.8777, country: "India", timezone: "Asia/Kolkata"},
      {city_id: 102, city_name: "Delhi", latitude: 28.7041, longitude: 77.1025, country: "India", timezone: "Asia/Kolkata"},
      {city_id: 103, city_name: "Bengaluru", latitude: 12.9716, longitude: 77.5946, country: "India", timezone: "Asia/Kolkata"},
      {city_id: 104, city_name: "Hyderabad", latitude: 17.3850, longitude: 78.4867, country: "India", timezone: "Asia/Kolkata"},
      {city_id: 105, city_name: "Ahmedabad", latitude: 23.0225, longitude: 72.5714, country: "India", timezone: "Asia/Kolkata"},
      {city_id: 106, city_name: "Chennai", latitude: 13.0827, longitude: 80.2707, country: "India", timezone: "Asia/Kolkata"},
      {city_id: 107, city_name: "Kolkata", latitude: 22.5726, longitude: 88.3639, country: "India", timezone: "Asia/Kolkata"},
      {city_id: 108, city_name: "Pune", latitude: 18.5204, longitude: 73.8567, country: "India", timezone: "Asia/Kolkata"},
  ]
}

type City = {
  city_id: number;
  city_name: string;
  latitude: number;
  longitude: number;
  country: string;
  timezone: string;
};

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

  // const today = new Date().toLocaleDateString();

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
      // Scroll to itinerary section
      setTimeout(() => {
        itineraryRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      const itineraryData = await getItineraryForCity(city);
      setItinerary(itineraryData);
    } catch (error) {
      logEvent(
        analytics,
        `wheretogotoday_itinerary_failed_${city.city_name}_${city.country}`
      );
      logCityError(city.city_name, city.country, error instanceof Error ? error.message : 'Failed to fetch itinerary')
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
                The team has been notified. We will fix this soon. Meanwhile try selecting a different city or check back later.
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
            <div className="odi-search-wrapper" style={{ position: 'relative' }}>
              <input
                type="text"
                className="odi-search-input"
                placeholder="Search for a city..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setShowDropdown(true)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="odi-search-clear"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCity(null);
                    setItinerary(null);
                    setError(null);
                  }}
                >
                  ×
                </button>
              )}
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
              
                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div className="odi-travel-loader" style={{ marginBottom: 20 }}>
                      <svg width="120" height="80" viewBox="0 0 120 80">
                        {/* Background trail */}
                        <path
                          d="M10 60 Q30 50 50 55 Q70 60 90 50 Q110 40 120 45"
                          stroke="#e0e0e0"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray="5,5"
                        />
                        
                        {/* Walking person */}
                        <g className="hiker">
                          {/* Head */}
                          <circle cx="20" cy="45" r="4" fill="#4f8cff" />
                          
                          {/* Body */}
                          <line x1="20" y1="49" x2="20" y2="58" stroke="#4f8cff" strokeWidth="2" />
                          
                          {/* Arms */}
                          <line x1="20" y1="52" x2="16" y2="55" stroke="#4f8cff" strokeWidth="2" className="arm-left" />
                          <line x1="20" y1="52" x2="24" y2="55" stroke="#4f8cff" strokeWidth="2" className="arm-right" />
                          
                          {/* Legs */}
                          <line x1="20" y1="58" x2="18" y2="65" stroke="#4f8cff" strokeWidth="2" className="leg-left" />
                          <line x1="20" y1="58" x2="22" y2="65" stroke="#4f8cff" strokeWidth="2" className="leg-right" />
                          
                          {/* Backpack */}
                          <rect x="18" y="50" width="4" height="6" fill="#4f8cff" rx="1" />
                        </g>
                        
                        {/* Map */}
                        <g className="map" transform="translate(35, 35)">
                          <rect x="0" y="0" width="12" height="8" fill="#fff" stroke="#4f8cff" strokeWidth="1" />
                          <line x1="2" y1="2" x2="10" y2="2" stroke="#4f8cff" strokeWidth="0.5" />
                          <line x1="2" y1="4" x2="8" y2="4" stroke="#4f8cff" strokeWidth="0.5" />
                          <line x1="2" y1="6" x2="6" y2="6" stroke="#4f8cff" strokeWidth="0.5" />
                          <circle cx="8" cy="3" r="0.5" fill="#4f8cff" />
                        </g>
                        
                        {/* Compass */}
                        <g className="compass" transform="translate(70, 25)">
                          <circle cx="0" cy="0" r="6" fill="#fff" stroke="#4f8cff" strokeWidth="1" />
                          <line x1="0" y1="-6" x2="0" y2="6" stroke="#4f8cff" strokeWidth="1" />
                          <line x1="-6" y1="0" x2="6" y2="0" stroke="#4f8cff" strokeWidth="1" />
                          <polygon points="0,-4 -1,-2 1,-2" fill="#4f8cff" />
                          <text x="0" y="8" textAnchor="middle" fontSize="4" fill="#4f8cff">N</text>
                        </g>
                        
                        {/* Floating dots representing discovery */}
                        <circle cx="40" cy="20" r="2" fill="#4f8cff" opacity="0.6" className="discovery-dot">
                          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="80" cy="15" r="1.5" fill="#4f8cff" opacity="0.6" className="discovery-dot">
                          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="0.5s" />
                        </circle>
                        <circle cx="100" cy="25" r="1" fill="#4f8cff" opacity="0.6" className="discovery-dot">
                          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" begin="1s" />
                        </circle>
                      </svg>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: "0.8em", color: "#4f8cff" }}>
                      Looks like you're the first to request for <span style={{ color: "#222" }}>{selectedCity.city_name}</span> today!
                    </span>
                    <span style={{ fontSize: "0.6em", color: "#555", marginTop: 4, textAlign: "center" }}>
                      We are generating the perfect day for today.<br />
                      This usually takes around <b>1 minute</b>.<br />
                      Thanks for your patience!
                    </span>
                  </div>
                ) : (
                  `${selectedCity.city_name} Today`
                )}
              </h2>
              {/* <div className="odi-date">Date: {today}</div> */}
            </div>

            {/* Download as PDF Button */}
            {itinerary && !loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button
                  className="odi-download-pdf"
                  onClick={async () => {
                    if (!itineraryRef.current) return;
                    const element = itineraryRef.current;
                    const canvas = await html2canvas(element, { scale: 2 });
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
                    // Calculate width/height for A4
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    // Keep aspect ratio
                    const imgWidth = pageWidth - 40;
                    const imgHeight = canvas.height * (imgWidth / canvas.width);
                    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
                    pdf.save(`${selectedCity.city_name}_itinerary.pdf`);
                  }}
                  style={{
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0.7rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    marginBottom: 8
                  }}
                >
                  Download as PDF
                </button>
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
                        <img
                          src={item.picture_url && item.picture_url !== "null" ? item.picture_url : defaultImage}
                          alt={item.activity}
                          className="odi-card-img"
                          onError={e => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== defaultImage) {
                              target.src = defaultImage;
                            }
                          }}
                        />
                      </div>
                      <div className="odi-card-content">
                        <h3 className="odi-card-activity">{item.activity}</h3>
                        <div className="odi-card-time">
                          <strong>Time:</strong> {item.start_time} - {item.end_time}
                        </div>
                        <div className="odi-card-address">
                          <strong>Address:</strong> {item.address}
                        </div>
                        {item.google_maps_link && item.google_maps_link !== "null" && (
                          <a 
                            href={item.google_maps_link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="odi-card-link"
                          >
                            View on Google Maps
                          </a>
                        )}
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
