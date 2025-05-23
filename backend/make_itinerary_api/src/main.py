import os
import json
import functions_framework
import openai
import time
from datetime import datetime, timezone
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from .prompt import ITINERARY_GENERATION_PROMPT, ITINERARY_GENERATION_QUERY
from dotenv import load_dotenv
# Load environment variables from .env file
load_dotenv()
from .google_places import get_restaurant_options, get_tourist_places

class Activity(BaseModel):
    start_time: str
    end_time: str
    activity: str
    address: str
    picture_url: Optional[str]
    google_maps_link: Optional[str]

class Itinerary(BaseModel):
    itinerary: List[Activity]

openai_client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])


def get_shows_today():
    print("Gathering Shows Information...")
    # TODO: Get events from Ticket Master
    return "Sample shows today: Jazz Night at City Hall @ 4pm, Outdoor Theater - Hamlet @ 6:30pm, Rock Concert at Arena @ 7am"

def get_weather_today(lat, lng):
    print("Gathering Weather Information...")
    # TODO: Get the weather today from Open Meteo
    return (
        f"Sample weather for coordinates ({lat}, {lng}): "
        "Sunny, 24°C, humidity 55%, light breeze. Sunrise at 06:00, sunset at 20:15"
    )

def generate_query(weather_info, restaurant_options, places_options, events):
    return ITINERARY_GENERATION_QUERY.format(
        weather_info=weather_info,
        restaurants=restaurant_options,
        places_options=places_options,
        events=events)

def ask_gpt(question, prompt, model):
    try:
        response = openai_client.responses.parse(
            model=model,
            instructions=prompt,
            input=question,
            text_format=Itinerary
        )
        return response.output_parsed
    except Exception as e:
        return {"error": str(e)}

def process_request(payload):
    """
    Processes the request to generate a one-day itinerary based on the provided latitude and longitude.
    """
    city = payload.get("city")
    latitude = float(payload.get("latitude"))
    longitude = float(payload.get("longitude"))
    date = payload.get("date")
    print("Generating itinerary for {}, Date {},Current system time {}".format(city, date, datetime.now(timezone.utc)))
    # Validate the input
    if not latitude or not longitude:
        return {"error": "Invalid input. Please provide city, latitude, and longitude."}, 400

    # Get information from different APIs
    print("Gathering information...")
    restaurant_options = get_restaurant_options(latitude, longitude)
    places = get_tourist_places(latitude, longitude)
    weather = get_weather_today(latitude, longitude)
    events = get_shows_today()
    question = generate_query(weather, restaurant_options, places, events)
    print("Making the itinerary...")
    response = ask_gpt(question, ITINERARY_GENERATION_PROMPT, "gpt-4o-2024-08-06")
    return json.loads(response.model_dump_json()), 200


@functions_framework.http
def one_day_itinerary(request):
    """
    Handles a request to retrieve one day itinerary based on the provided city and optional payload.
    """
    # Set CORS headers
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    # Handle preflight OPTIONS request
    if request.method == "OPTIONS":
        return "", 204, headers


    if request.data:
        # Get the payload from the request
        try:
            print("Start.")
            start_time = time.time()
            result, status_code = process_request(request.get_json())
            end_time = time.time()
            result.update({"request_process_time": end_time - start_time})
            print("Done.")
            return result, status_code, headers
        except Exception as e:
            print(e)
            return "Something unexpected happened:", 200, headers
    return {}, 404, headers
