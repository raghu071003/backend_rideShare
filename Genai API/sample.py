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

# # Run the function
# filtered_rides = filter_rides(available_rides, user_requirement)
# print(filtered_rides)











import os
from typing import Dict, List
from langchain_core.prompts import PromptTemplate
from langchain_community.chat_models import ChatGooglePalm
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
from datetime import datetime
import google.generativeai as genai

# Environment setup
os.environ["GOOGLE_API_KEY"] = "your-google-api-key-here"

class RideshareChatbot:
    def __init__(self):
        # Initialize the Google PaLM model
        self.llm = ChatGooglePalm(temperature=0.7)
        
        # Initialize conversation memory
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Define the chat prompt template
        self.prompt = PromptTemplate(
            input_variables=["chat_history", "user_input", "context"],
            template="""
            You are a helpful assistant for a rideshare app. You can help with booking rides,
            checking ride status, handling customer support queries, and providing fare estimates.
            
            Current context: {context}
            
            Chat history: {chat_history}
            Human: {user_input}
            Assistant: Let me help you with that.
            """
        )
        
        # Create the conversation chain
        self.conversation = LLMChain(
            llm=self.llm,
            prompt=self.prompt,
            memory=self.memory,
            verbose=True
        )
        
        # Initialize mock database for ride information
        self.rides_db = {}
        
    def get_ride_status(self, ride_id: str) -> Dict:
        """Mock function to get ride status from database"""
        return self.rides_db.get(ride_id, {
            "status": "not_found",
            "message": "Ride not found"
        })
    
    def estimate_fare(self, pickup: str, dropoff: str) -> float:
        """Mock function to calculate estimated fare"""
        # In a real application, this would use maps API and pricing algorithm
        return 25.00
    
    def book_ride(self, pickup: str, dropoff: str, user_id: str) -> Dict:
        """Mock function to book a new ride"""
        ride_id = f"RIDE_{len(self.rides_db) + 1}"
        ride_info = {
            "ride_id": ride_id,
            "user_id": user_id,
            "pickup": pickup,
            "dropoff": dropoff,
            "status": "booked",
            "timestamp": datetime.now().isoformat(),
            "estimated_fare": self.estimate_fare(pickup, dropoff)
        }
        self.rides_db[ride_id] = ride_info
        return ride_info
    
    def get_context(self, user_input: str) -> str:
        """Generate context based on user input"""
        context = {
            "current_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "available_drivers": 5,  # Mock value
            "surge_pricing": False,
            "service_status": "operational"
        }
        return str(context)
    
    def process_message(self, user_input: str) -> str:
        """Process user message and return response"""
        try:
            # Generate context for the current interaction
            context = self.get_context(user_input)
            
            # Get response from the LLM
            response = self.conversation.predict(
                user_input=user_input,
                context=context
            )
            
            return response.strip()
            
        except Exception as e:
            return f"I apologize, but I encountered an error: {str(e)}"

def main():
    # Initialize the chatbot
    chatbot = RideshareChatbot()
    
    print("Rideshare Chatbot: Hello! How can I help you today? (Type 'exit' to quit)")
    
    while True:
        user_input = input("You: ").strip()
        
        if user_input.lower() == 'exit':
            print("Chatbot: Thank you for using our service. Goodbye!")
            break
            
        response = chatbot.process_message(user_input)
        print("Chatbot:", response)

if __name__ == "__main__":
    main()