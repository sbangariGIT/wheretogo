import requests
import os
from datetime import datetime, time
from zoneinfo import ZoneInfo
# Define your base URL
TICKETMASTER_BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json"

# Different Event types we want to consider
EVENT_TYPES = [
    "concert",
    "sports",
    "theater",
]

# Filter these fields out of the event payload, we do not want to bloat the prompt
UNWANTED_KEYS = [
    "id",
    "outlets",
    "seatmap",
    "ticketing",
    "_links",
    "_embedded",
    "test"
]
# Search for events within 40 miles of the GeoPoint
RADIUS = "40"

def get_start_of_day_iso(tz_name: str) -> str:
    tz = ZoneInfo(tz_name)
    now = datetime.now(tz)
    start_of_day = datetime.combine(now.date(), time.min, tzinfo=tz)
    return start_of_day.isoformat()

def _clean_event(event):
    sanitized_event = {}
    for key in event.keys():
        if key in UNWANTED_KEYS:
            continue
        if key == "images":
            sanitized_event["image_url"] = event["images"][0]["url"]
            continue
        sanitized_event[key] = event[key]
    return  sanitized_event

def get_events_from_ticket_master(lat, lng, date):
    params = {
        "apikey": os.environ["TICKETMASTER_API_KEY"],
        "geoPoint": f"{lat},{lng}",
        "startDateTime": date,
        "radius": RADIUS,
        "units": "miles",
    }
    events = []
    top_k = 3
    # Make the GET request
    for evt_type in EVENT_TYPES:
        index = 0
        params["keyword"] = evt_type
        response = requests.get(TICKETMASTER_BASE_URL, params=params)
        entries = response.json()["_embedded"]["events"]
        for entry in entries:
            if index > top_k:
                break
            # clean the entr
            events.append(_clean_event(entry))
            index += 1
    return events



def get_events_today(lat, lng, timezone):
    try:
        events = get_events_from_ticket_master(lat=lat, lng=lng, date=get_start_of_day_iso(timezone))
        return events, False
    except Exception as e:
        return {"error": str(e)}, True