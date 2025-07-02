import React, { useState } from 'react';
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

const sampleItinerary: ItineraryItem[] = [
  {
    activity: 'Breakfast at Won Kok Restaurant',
    address: '210 Alpine St, Los Angeles, CA 90012, USA',
    end_time: '10:00',
    google_maps_link: 'https://maps.google.com/?cid=4012018546653054497',
    picture_url: 'https://example.com/breakfast.jpg',
    start_time: '09:00',
  },
  // ... more sample items ...
];

function App() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const today = new Date().toLocaleDateString();

  return (
    <div className="App">
      <header className="App-header">
        <h1>One Day Itinerary</h1>
        <div style={{ margin: '1rem 0' }}>
          <label htmlFor="city-select">Select a city: </label>
          <select
            id="city-select"
            value={selectedCity?.city_id || ''}
            onChange={e => {
              const cityId = Number(e.target.value);
              let found: City | undefined;
              Object.values(CITIES_BY_TIMEZONE).forEach((cities) => {
                if (!found) found = cities.find(city => city.city_id === cityId);
              });
              setSelectedCity(found || null);
            }}
          >
            <option value="">-- Choose a city --</option>
            {Object.entries(CITIES_BY_TIMEZONE).map(([tz, cities]) => (
              <optgroup key={tz} label={tz}>
                {cities.map(city => (
                  <option key={city.city_id} value={city.city_id}>{city.city_name} ({city.country})</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div style={{ margin: '1rem 0' }}>
          <strong>Date:</strong> {today}
        </div>
        {selectedCity && (
          <div style={{ margin: '2rem 0', width: '100%', maxWidth: 600 }}>
            <h2>Itinerary for {selectedCity.city_name}</h2>
            {/* Replace with real itinerary fetch logic */}
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {sampleItinerary.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '1.5rem', border: '1px solid #ccc', borderRadius: 8, padding: 16, background: '#222' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src={item.picture_url} alt={item.activity} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginRight: 16 }} />
                    <div>
                      <h3 style={{ margin: 0 }}>{item.activity}</h3>
                      <div><strong>Time:</strong> {item.start_time} - {item.end_time}</div>
                      <div><strong>Address:</strong> {item.address}</div>
                      <a href={item.google_maps_link} target="_blank" rel="noopener noreferrer" style={{ color: '#61dafb' }}>View on Google Maps</a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
