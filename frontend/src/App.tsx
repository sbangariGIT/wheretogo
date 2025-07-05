import React, { useState, useRef, useEffect } from 'react';
import './App.css';

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

// Mock function to get itinerary - replace with API call later
const getItineraryForCity = async (city: City): Promise<ItineraryResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    itinerary: [
      {
        activity: 'Breakfast at Local Cafe',
        address: `${city.city_name} Downtown, ${city.country}`,
        end_time: '10:00',
        google_maps_link: 'https://maps.google.com',
        picture_url: 'https://images.unsplash.com/photo-1504674900240-9f9d8b1b1b1b?w=400',
        start_time: '09:00',
      },
      {
        activity: 'Visit City Museum',
        address: `${city.city_name} Cultural District, ${city.country}`,
        end_time: '12:00',
        google_maps_link: 'https://maps.google.com',
        picture_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
        start_time: '10:30',
      },
      {
        activity: 'Lunch at Popular Restaurant',
        address: `${city.city_name} Food Street, ${city.country}`,
        end_time: '14:00',
        google_maps_link: 'https://maps.google.com',
        picture_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
        start_time: '12:30',
      },
      {
        activity: 'Explore City Park',
        address: `${city.city_name} Central Park, ${city.country}`,
        end_time: '16:00',
        google_maps_link: 'https://maps.google.com',
        picture_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
        start_time: '14:30',
      },
      {
        activity: 'Dinner at Fine Dining',
        address: `${city.city_name} Upscale District, ${city.country}`,
        end_time: '20:00',
        google_maps_link: 'https://maps.google.com',
        picture_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        start_time: '18:30',
      },
    ],
    reason: `A perfect day in ${city.city_name} featuring local cuisine, cultural experiences, and beautiful sights.`,
    request_process_time: 1.2,
  };
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

    try {
      const itineraryData = await getItineraryForCity(city);
      setItinerary(itineraryData);
      
      // Scroll to itinerary section
      setTimeout(() => {
        itineraryRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error fetching itinerary:', error);
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
    }
  };

  return (
    <div className="odi-bg">
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
