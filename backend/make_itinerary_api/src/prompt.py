"""
LIST ALL THE PROMPTS
"""
ITINERARY_GENERATION_PROMPT = """
You are given the following information:
- Places to visit and restaurants to eat at with their locations
- Activities/Shows that are happening in the city today and their locations
- Weather Information for today for the given city location 

Analyze this information to give an ITINERARY for a day, be creative but also take calculated decisions. 
For example do not suggest a beach on a hot day during peak temp.
Keep in mind the distance between the destinations that you are suggesting in succession.  
You do not have to include everything from each category but mix it up if you feel that it will be fun.

<Format of the Pydantic class>
{
    "itinerary": [
        {
            "start_time": "09:00",
            "end_time": "10:00",
            "activity": "Breakfast at local cafe",
            "address": "123 Main St, Cityville"
        },
        {
            "start_time": "10:00",
            "end_time": "12:00",
            "activity": "Visit the local museum",
            "address": "Museum Rd, Cityville"
        },
        {
            "start_time": "12:00",
            "end_time": "13:30",
            "activity": "Lunch at a popular restaurant",
            "address": "456 Food Ave, Cityville"
        },
        {
            "start_time": "14:00",
            "end_time": "15:30",
            "activity": "Explore the city park",
            "address": "789 Park Ln, Cityville"
        },
        {
            "start_time": "16:00",
            "end_time": "17:30",
            "activity": "Shopping at local market",
            "address": "Market Square, Cityville"
        },
        {
            "start_time": "18:00",
            "end_time": "20:00",
            "activity": "Dinner at a rooftop restaurant",
            "address": "Rooftop Blvd, Cityville"
        }
    ]
    "reason": // provide a reason why you selected what you selected for today
}
"""

ITINERARY_GENERATION_QUERY = """
Information about places to visit and restaurants to eat at with their locations
{restaurants}

Information about tourist places
{places_options}

Weather Information for today for the given city location.
{weather_info}

Events that are happening in the city today.
{events}

Analyze this information to give an ITINERARY for a day, be creative but also take calculated decisions. 
For example do not suggest a beach on a hot day during peak temp.
Keep in mind the distance between the destinations that you are suggesting in succession.  
You do not have to include everything from each category but mix it up if you feel that it will be fun.
"""