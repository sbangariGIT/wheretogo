"""
This script is going to be run every half an hour
"""
from dotenv import load_dotenv
load_dotenv() # Load environment variables from .env file
import os
import time
import functions_framework
from cities import CITIES_BY_TIMEZONE
from datetime import datetime, time
from zoneinfo import ZoneInfo
import asyncio
from firebase import firebaseHandler
from slack_logger import dbg

async def delete_latest(city):
    dbg.info(f"Deleting LATEST for {city['city_name']} in timezone {city['timezone']}")
    try:
        firebaseHandler.delete_document(city['city_name'], "latest")
        return {"city": city["city_name"], "status": "success"}
    except Exception as e:
        return {"city": city["city_name"], "status": "failed", "error": str(e)}

async def process_all_cities(cities):
    tasks = [delete_latest(city) for city in cities]
    return await asyncio.gather(*tasks)


def get_cities():
    """
    Get the cities where the current time in the timezone is between [4:00am - 4:30am], inclusive.
    """
    cities = []
    now_utc = datetime.utcnow()
    for timezone_str, city_list in CITIES_BY_TIMEZONE.items():
        try:
            local_time = now_utc.replace(tzinfo=ZoneInfo("UTC")).astimezone(ZoneInfo(timezone_str)).time()
            if time(0, 0) <= local_time < time(1, 0):
                cities.extend(city_list)
        except Exception as e:
            dbg.severe(f"Error with timezone {timezone_str}: {e}")
            continue
    return cities


def process_request():
    # Check if there are cities that need to be run in this window -> current time between 4:00 am - 4:30 am
    cities = get_cities()
    if len(cities) == 0:
        return {"message": "No cities to run right now, thank you!"}
    results = asyncio.run(process_all_cities(cities))
    dbg.info(f"Result: {results}")
    return {"message": "Successfully processed all cities", "results": results}

@functions_framework.http
def clean_up(request):
    """
    Orchestrator that generates a city itinerary for cities
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

    # Get the payload from the request
    try:
        dbg.info("Trigger Hourly City Scheduler.")
        result = process_request()
        return result, 200, headers
    except Exception as e:
        dbg.severe(e)
        return "Something unexpected happened:", 200, headers
