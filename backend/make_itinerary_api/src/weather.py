import openmeteo_requests
import pandas as pd
from .slack_logger import dbg

# TODO: Need to build this better to extract the weather information
client = openmeteo_requests.Client()
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

def get_weather_today(lat, lng):
	dbg.info("Gathering weather data...")
	params = {
		"latitude": lat,
		"longitude": lng,
		"hourly": ["temperature_2m", "precipitation", "cloud_cover", "visibility"],
		"forecast_days": 1
	}
	try:
		responses = client.weather_api(OPEN_METEO_URL, params=params)
		response = responses[0]
		# Process hourly data. The order of variables needs to be the same as requested.
		hourly = response.Hourly()
		timestamps = pd.date_range(
			start=pd.to_datetime(hourly.Time(), unit="s", utc=True),
			end=pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True),
			freq=pd.Timedelta(seconds=hourly.Interval()),
			inclusive="left"
		)
		# Create concise meaningful dictionary
		weather_data = {
			ts.isoformat(): {
				"temperature_2m": t,
				"precipitation": p,
				"cloud_cover": c,
				"visibility": v
			}
			for ts, t, p, c, v in zip(
				timestamps,
				hourly.Variables(0).ValuesAsNumpy(),
				hourly.Variables(1).ValuesAsNumpy(),
				hourly.Variables(2).ValuesAsNumpy(),
				hourly.Variables(3).ValuesAsNumpy()
			)
		}
		return weather_data
	except Exception as e:
		dbg.severe(f"Unable to gather Weather Information: {e}")
		return {}

