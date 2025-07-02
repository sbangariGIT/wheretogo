import os
import googlemaps
import random
from .slack_logger import dbg

_KEYS = [
    "address_components",
    "current_opening_hours",
    "adr_address",
    "icon",
    "icon_background_color",
    "icon_mask_base_uri",
    "photos",
    "plus_code",
    "reviews",
    "types",
    "opening_hours",
    "geometry",
    "vicinity",
]

VALID_CUISINES = [
    "Italian",
    "Mexican",
    "Indian",
    "Chinese",
    "French",
    "Mediterranean",
    "Thai",
    "Japanese",
]

VALID_AMBIENCES = ["Relaxed", "Family-Oriented", "Cozy", "Lively", "Casual", "Fine"]

TOURIST_ACTIVITIES = [
    # Culture & History
    "Museums",
    "Historical Sites",
    "Monuments",
    "Heritage Walks",
    "Temples",
    "Churches",
    "Mosques",
    "Forts & Palaces",
    "Local Architecture",
    "Art Galleries",

    # Nature & Outdoors
    "Beaches",
    "Treks",
    "Hiking Trails",
    "Parks & Gardens",
    "Nature Reserves",
    "National Parks",
    "Lakes",
    "Rivers",
    "Caves",
    "Waterfalls",

    # Food & Drink
    "Local Eateries",
    "Street Food",
    "Fine Dining",
    "Food Tours",
    "Breweries",
    "Cafes",
    "Night Markets",
    "Wine Tasting",

    # Entertainment & Nightlife
    "Live Music",
    "Theatres",
    "Cinemas",
    "Bars",
    "Nightclubs",
    "Comedy Shows",
    "Cultural Performances",

    # Shopping & Local Experiences
    "Local Markets",
    "Shopping Malls",
    "Souvenir Shops",
    "Handicraft Stores",
    "Artisan Workshops",
    "Street Shopping",

    # Adventure & Sports
    "Cycling Tours",
    "Rock Climbing",
    "Kayaking",
    "Snorkeling",
    "Scuba Diving",
    "Zip-lining",
    "Paragliding",
    "Surfing",

    # Wellness & Relaxation
    "Spas",
    "Yoga Studios",
    "Meditation Centers",
    "Hot Springs",
    "Ayurvedic Treatments",
    "Wellness Retreats",

    # Unique Local Attractions
    "Graffiti Tours",
    "Boat Rides",
    "City Viewpoints",
    "Local Festivals",
    "Pet Cafes",
    "Theme Parks",
    "Aquariums",
    "Zoos"
]
GOOGLE_PLACES_URL = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=%s&key="  + os.environ["GOOGLEMAPS"]
client = googlemaps.Client(os.environ["GOOGLEMAPS"])

def _generate_cuisine_ambience_pairs(n=3):
    return [
        (random.choice(VALID_CUISINES), random.choice(VALID_AMBIENCES))
        for _ in range(n)
    ]

def rank_places_based_on_review(places):
    """
    Returns a list of restaurant place_id tuples of top 7 restaurants
    """
    ranking = []
    for restaurant in places:
        rank = 0
        rank += restaurant.get("rating", 0.0) * 20
        rank += restaurant.get("user_ratings_total", 0) // 100
        rank += random.randint(1, 30)
        ranking.append((restaurant.get("place_id"), rank))
    sorted_list = sorted(ranking, key=lambda x: x[1], reverse=True)
    last_rank = 7 if len(sorted_list) > 7 else len(sorted_list)
    final_restaurants = [place[0] for place in sorted_list[:last_rank]]
    return final_restaurants


def convert_operational_hours(hours_data):
    try:
        days_mapping = {
            0: "mon",
            1: "tue",
            2: "wed",
            3: "thu",
            4: "fri",
            5: "sat",
            6: "sun",
        }
        operational_hours = {}
        if len(hours_data) == 1:
            for day_index in range(7):
                day_name = days_mapping[day_index]
                operational_hours[day_name] = {"start": "00:00", "end": "00:00"}
            return {"operational_hours": operational_hours}

        for entry in hours_data:
            open_day = entry["open"]["day"]
            open_time = entry["open"]["time"]
            close_time = entry["close"]["time"]

            # Convert time to HH:MM format
            open_hour, open_minute = open_time[:2], open_time[2:]
            close_hour, close_minute = close_time[:2], close_time[2:]
            formatted_open_time = f"{open_hour}:{open_minute}"
            formatted_close_time = f"{close_hour}:{close_minute}"

            # Map day index to abbreviated day name
            day_name = days_mapping[open_day]

            operational_hours[day_name] = {
                "start": formatted_open_time,
                "end": formatted_close_time,
            }
        return {"operational_hours": operational_hours}
    except Exception as e:
        dbg.severe(f"Unable to comprehend operational_hours {hours_data}, error: {e}")
        return {"operational_hours": {}}

def get_place_info(place_id):
    response = client.place(place_id)
    if response.get("status") == "OK":
        detail = response.get("result")
        # Convert url key to googlemaps
        detail["googleMapsLink"] = detail.get("url", "")
        # Convert the weekday_text into operation_hours
        operational_hours = detail.get("opening_hours", {}).get("periods", {})
        detail.update(convert_operational_hours(operational_hours))
        # Convert rating from out of 5 to 100
        detail["rating"] = int(detail.get("rating", 0) * 20)
        detail["photo_url"] = _get_place_picture_url(detail.get("photos"))
        # Remove unwanted information from the info
        for key in _KEYS:
            if key in detail:
                del detail[key]
        return detail
    return {}

def get_places_info(places):
    """
    Input should be a list of place_id
    """
    places_info = []
    for placeId in places:
        places_info.append(get_place_info(placeId))
    return places_info

def get_restaurant_options(lat, long):
    try:
        restaurants = get_restaurants_from_google(lat, long)
        restaurant_ids = rank_places_based_on_review(restaurants)
        information = get_places_info(restaurant_ids)
        return information, False
    except Exception as e:
        return {"error": f"Unable to gather Restaurant Information: {e}"}, True


def _get_random_tourist_activities(n=5):
    return random.sample(TOURIST_ACTIVITIES, n)

def get_restaurants_from_google(lat: float, lng: float):
    location = (
        lat,
        lng
    )
    places = []
    try:
        for cuisine, ambience in _generate_cuisine_ambience_pairs(1):
            response = client.places_nearby(
                keyword="Best {} {} restaurants".format(cuisine, ambience),
                location=location,
                radius=10000,
            )
            for place in response["results"]:
                places.append(place)
        return places
    except Exception as e:
        dbg.severe(str(e))
        return []

def get_tourist_place_from_google(lat: float, lng: float):
    location = (
        lat,
        lng
    )
    places = []
    try:
        for activity in _get_random_tourist_activities(1):
            response = client.places_nearby(
                keyword="Best {} in the city".format(activity),
                location=location,
                radius=10000,
            )
            for place in response["results"]:
                places.append(place)
        return places
    except Exception as e:
        dbg.severe(str(e))
        return []

def _get_place_picture_url(photos) -> str:
    if len(photos) > 0:
        photo_reference = photos[0].get("photo_reference", "")
        if photo_reference:
            return GOOGLE_PLACES_URL % photos[0].get("photo_reference")
    return ""
    
def get_tourist_places(lat, long):
    try:
        places = get_tourist_place_from_google(lat, long)
        place_ids = rank_places_based_on_review(places)
        information = get_places_info(place_ids)
    except Exception as e:
        return {"error": f"Unable to gather Tourist Information: {e}"}, True
    return information, False
