import google.generativeai as genai
from datetime import datetime, timedelta
import json
import requests

class RideShareChatbot:
    def __init__(self, api_key):
        """Initialize the chatbot with Google API credentials"""
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        self.context = self.get_initial_context()
        self.current_booking = {
            'source': None,
            'destination': None,
            'pickup_date': None,
            'pickup_time': None
        }
        self.API_ENDPOINT = 'http://127.0.0.1:8080/ai/getRide'
        self.DRIVER_REQUEST_ENDPOINT = 'http://localhost:8090/api/v1/user/requestDriver'

    def get_initial_context(self):
        """Set up the initial context and instructions for the model"""
        return """You are a helpful ride-sharing assistant. Your job is to:
        1. Collect pickup location (source)
        2. Collect drop-off location (destination)
        3. Get pickup date and time
        4. Help book the ride

        Important: Always collect all required information:
        - Source location
        - Destination location
        - Pickup date
        - Pickup time

        Keep responses natural and friendly. If any information is missing,
        ask for it specifically."""

    def process_message(self, user_input):
        """Process user input and generate appropriate response"""
        self.extract_booking_info(user_input)
        current_status = f"\nCurrent booking information:"
        for key, value in self.current_booking.items():
            current_status += f"\n- {key}: {value}"
        
        prompt = f"{self.context}\n{current_status}\n\nUser message: {user_input}\n\nProvide a natural response and ask for any missing required information."
        
        try:
            response = self.model.generate_content(prompt)
            if all(self.current_booking.values()):
                booking_response = self.request_ride()
                if booking_response:
                    driver_response = self.send_request_to_driver(booking_response)
                    if driver_response:
                        return f"{response.text}\n\nGreat! Your ride has been booked with these details:\n{json.dumps(driver_response, indent=2)}"
            
            return response.text
            
        except Exception as e:
            return f"I apologize, but I'm having trouble processing your request. Error: {str(e)}"

    def extract_booking_info(self, text):
        """Extract booking information from text"""
        text_lower = text.lower()
        if 'from' in text_lower and 'to' in text_lower:
            parts = text_lower.split('from')[1].split('to')
            self.current_booking['source'] = parts[0].strip()
            self.current_booking['destination'] = parts[1].split()[0].strip()
        
        try:
            for word in text.split():
                if ':' in word:
                    self.current_booking['pickup_time'] = word.strip()
                    
            if 'today' in text_lower:
                self.current_booking['pickup_date'] = datetime.now().strftime('%Y-%m-%d')
            elif 'tomorrow' in text_lower:
                tomorrow = datetime.now() + timedelta(days=1)
                self.current_booking['pickup_date'] = tomorrow.strftime('%Y-%m-%d')
        except Exception:
            pass

    def request_ride(self):
        """Send ride request to the API"""
        try:
            response = requests.post(
                self.API_ENDPOINT,
                json=self.current_booking
            )
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            print(f"Error booking ride: {str(e)}")
            return None

    def send_request_to_driver(self, ride_details):
        """Send request to the driver with specific ride details"""
        formatted_pickup_date = self.current_booking['pickup_date']
        selected_capacity = ride_details.get('req_seating', 1)  # Assuming default seat selection

        try:
            response = requests.post(
                self.DRIVER_REQUEST_ENDPOINT,
                json={
                    'rideId': ride_details['ID'],
                    'driverId': ride_details['driver_id'],  # Adjust if needed
                    'source': ride_details['source'],
                    'destination': ride_details['destination'],
                    'pickupTime': ride_details['pickup_time'],
                    'pickupDate': formatted_pickup_date,
                    'req_seating': selected_capacity,
                    'price': ride_details['price']
                },
                headers={
                    'Content-Type': 'application/json'
                },
                cookies={
                    # Add cookies if required for authentication
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Driver request failed with status {response.status_code}: {response.text}")
                return None
        except Exception as e:
            print(f"Error sending request to driver: {str(e)}")
            return None
