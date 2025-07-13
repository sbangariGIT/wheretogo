import os
import json
import functions_framework
import openai
import time
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
load_dotenv() # Load environment variables from .env file
from .prompt import ITINERARY_GENERATION_PROMPT, ITINERARY_GENERATION_QUERY
from .google_places import get_restaurant_options, get_tourist_places
from .weather import get_weather_today
from .ticket_master import get_events_today
from .slack_logger import dbg
from firebase import firebaseHandler

class Activity(BaseModel):
    start_time: str
    end_time: str
    activity: str
    address: str
    picture_url: Optional[str]
    google_maps_link: Optional[str]

class Itinerary(BaseModel):
    itinerary: List[Activity]
    reason : str

openai_client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])

def generate_query(weather_info={}, restaurant_options={}, places_options={}, events={}):
    return ITINERARY_GENERATION_QUERY.format(
        weather_info=weather_info,
        restaurants=restaurant_options,
        places_options=places_options,
        events=events,
        today=datetime.now(timezone.utc)
        )

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
    time_zone = payload.get("timezone")
    dbg.info("Generating itinerary for {}, Current system time {}".format(city, datetime.now(timezone.utc)))
    # Validate the input
    if not latitude or not longitude:
        dbg.severe("Invalid input. Please provide city, latitude, and longitude.")
        return {"error": "Invalid input. Please provide city, latitude, and longitude."}, 400

    # Get information from different APIs
    failures = {}
    restaurant_options, error = get_restaurant_options(latitude, longitude)
    if error:
        failures["restaurant_options"] = restaurant_options
    places, error = get_tourist_places(latitude, longitude)
    if error:
        failures["places"] = places
    weather, error = get_weather_today(latitude, longitude)
    if error:
        failures["weather"] = weather
    events, error = get_events_today(latitude, longitude, time_zone)
    if error:
        failures["events"] = events
    question = generate_query(weather, restaurant_options, places, events)
    response = ask_gpt(question, ITINERARY_GENERATION_PROMPT, "gpt-4o-2024-08-06")
    failures['city'] = city
    dbg.info("Failures: {}".format(failures))
    data = json.loads(response.model_dump_json())
    firebaseHandler.add_document(city, "latest", data)
    return data, 200


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
            dbg.info("Start.")
            start_time = time.time()
            result, status_code = process_request(request.get_json())
            end_time = time.time()
            result.update({"request_process_time": end_time - start_time})
            dbg.info("Done.")
            return result, status_code, headers
        except Exception as e:
            dbg.severe(str(e))
            return "Something unexpected happened:", 200, headers
    return {}, 404, headers
