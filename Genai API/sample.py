import google.generativeai as genai
from langchain import PromptTemplate, LLMChain

# Configure Google Generative AI
genai.configure(api_key="AIzaSyCFYC3YudT7STlsvBazCvfkPuyKEyt5jQE")

# Function to use LangChain and GenAI to find the best rides
def filter_rides(available_rides, user_requirement):
    # Prepare the prompt template for Google Generative AI
    template = """
    You are an intelligent assistant for a ride-sharing app. Given the following available rides:
    {rides_data}

    and the user's requirement:
    - Location: {user_location}
    - Preferred Pickup Time: {user_time}

    Return a list of rides that best match the user's preferences. Consider the nearest source as the highest priority and then the pickup time.
    Provide only the ride IDs in a sorted list.
    Donot give any explaination just return json objects with all the driver details
    """
    
    # Convert input data to string for the prompt
    rides_data = "\n".join(
        [f"Ride ID {ride['ride_id']}: Source {ride['source']}, Pickup Time {ride['pickup_time']}" 
         for ride in available_rides]
    )
    user_location = user_requirement['location']
    user_time = user_requirement['pickup_time']

    # Prepare the prompt with LangChain
    prompt = PromptTemplate(template=template).format(
        rides_data=rides_data, user_location=user_location, user_time=user_time
    )
    
    # Use GenAI for prediction
    model = genai.GenerativeModel(model_name="gemini-1.5-flash")
    chat_session = model.start_chat()
    response = chat_session.send_message(prompt)
    
    # Parse the response
    return response

# Sample Data
available_rides = [
    {
        "ride_id": 1,
        "source": (40.748817, -73.985428),
        "destination": (40.73061, -73.935242),
        "pickup_time": "08:30",
        "driver_name": "John Doe"
    },
    {
        "ride_id": 2,
        "source": (40.712776, -74.005974),
        "destination": (40.773941, -73.871451),
        "pickup_time": "09:15",
        "driver_name": "Jane Smith"
    },
    {
        "ride_id": 3,
        "source": (40.758896, -73.985130),
        "destination": (40.670002, -73.940008),
        "pickup_time": "08:45",
        "driver_name": "Alice Johnson"
    },
    {
        "ride_id": 4,
        "source": (40.729515, -73.996460),
        "destination": (40.712217, -73.951156),
        "pickup_time": "07:50",
        "driver_name": "Robert Brown"
    }
]

user_requirement = {
    "location": (40.730610, -73.935242),
    "pickup_time": "08:00"
}

# Run the function
filtered_rides = filter_rides(available_rides, user_requirement)
print(filtered_rides)
