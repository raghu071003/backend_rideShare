import os
import google.generativeai as genai
import requests
from flask import Flask,request

app = Flask(__name__)
@app.route('/ai/getRide', methods=['POST'])
def genai():
    data = request.get_json()
    source = data.get('source')
    destination = data.get('destination')
    pickup_time = data.get('pickup_time')
    pickup_date = data.get('pickup_date')

    def fetch_and_format_data():
        api_url = "http://localhost:8090/api/v1/admin/getAvailableRides"
        try:
            # Send a GET request to the specified API URL
            response = requests.get(api_url)

            # Raise an error for bad responses (4xx or 5xx)
            response.raise_for_status()

            # Assuming the response is in JSON format
            results = response.json()

            # Prepare the list for formatted responses
            responses = []
            if results:
                for result in results:
                    response = f"{result} "  # Format each result as needed
                    responses.append(response)
                
                return responses  # Return a list of formatted responses
            else:
                return ["No matching data found."]
        except requests.exceptions.RequestException as e:
            # Handle any request errors (e.g., connection errors, timeouts)
            return [f"Error fetching data: {str(e)}"]
    # Call the function and get the formatted responses
    formatted_responses = fetch_and_format_data()

    # Use join() to efficiently build the result string from all rows
    input_driv = "".join(formatted_responses)

    # Define the value of b
   
    user_in = (source, destination, pickup_time, pickup_date)
    
    user_in = str(user_in)
   
    # Append b to a
    user_in =  input_driv + "match with a "+ user_in + "Donot give any extra text Strictly just give the json object"
    

    # Print the final result


    import os
    import google.generativeai as genai
    import json

    genai.configure(api_key="AIzaSyCFYC3YudT7STlsvBazCvfkPuyKEyt5jQE")

    # Create the model
    generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
    }

    model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
    # safety_settings = Adjust safety settings
    # See https://ai.google.dev/gemini-api/docs/safety-settings
    )

    chat_session = model.start_chat(history=[
        {
        "role": "user",
        "parts": [
            "i will provide some details with make best match with low cost ride for rider and shortest distance \n",
        ],
        },
        {
        "role": "model",
        "parts": [
            "Please tell me the details! I need information to help you find the best match. \n\nFor example, tell me:\n\n* **Where are you starting from?** (City, state, or specific address)\n* **Where are you going?** (City, state, or specific address)\n* **What time are you traveling?** (This will affect traffic and availability)\n* **How many people are traveling?** (This will influence the size of the vehicle needed)\n* **What kind of luggage do you have?** (This will help determine if you need a car with extra cargo space)\n* **What is your budget?** \n\nOnce I have this information, I can use my knowledge of ride-sharing services and transportation options to recommend the best, low-cost, and shortest distance option for you. \n",
        ],
        },
        {
        "role": "user",
        "parts": [
            "('a1', 'siddhu', 'chennai', 'warangal', '24/9/2024', '09:00 PM', '4.6', '12', 'car', '7', '8978242155') ('a2', 'hruday', 'avadi', 'chennai, central', '25/9/2024', '02 : pm', '4.1', '10', 'car', '5', '7585411231') ('a3', 'akhil', 'chennai, central', 'veltech university', '28/9/2024', '06 : 00 AM', '4.2', '10', 'car', '5', '7325411231') ('a4', 'ashok', 'chennai', 'hyderabad', '22/9/2024', '05 : 00 pm', '4', '7', 'bike', '5', '9325411231') match with a ('avadi', 'warangal', '11:00 PM'), ....  match with a (avadi, warangal,2024-09-24,10:00pm) \nit is in the format of (id, name, source, destination, date, time,rating, no_of_rides, vechile_type, seating_capacity, contact_details) and make a best  match with (source, destination, date, time)\nfind best match and send it is output ",
        ],
        },
        {
        "role": "model",
        "parts": [
            "Okay, I can help you match these riders with the requested trip based on the provided information.\n\nHere's how we'll approach this:\n\n1. **Data Extraction:** I'll first extract the relevant information from the rider data (source, destination, date, and time) and compare it with the requested trip details.\n2. **Matching Criteria:**  We'll prioritize matching riders whose source and destination closely align with the requested trip. We'll then look for the best date and time match. \n3. **Output:** I'll provide you with the best matching rider based on the information you've given. \n\n**Data Extraction and Matching:**\n\n* **Requested Trip:** (avadi, warangal, 2024-09-24, 10:00 pm)\n\n* **Rider Data Analysis:**\n\n   * **Rider 'a1':**  (chennai, warangal, 24/9/2024, 09:00 PM) - This is a close match, as the destination is the same, and the date and time are very similar.\n   * **Rider 'a2':**  (avadi, chennai, central, 25/9/2024, 02 : pm) - The destination is different, so this is not a good match.\n   * **Rider 'a3':**  (chennai, central, veltech university, 28/9/2024, 06 : 00 AM) - Destination and date are a mismatch.\n   * **Rider 'a4':**  (chennai, hyderabad, 22/9/2024, 05 : 00 pm) - Destination and date are a mismatch.\n\n**Best Match:**\n\nBased on the analysis, **Rider 'a1' (siddhu)** is the best match for the requested trip.  \n\n**Output:**\n\n(a1, siddhu, chennai, warangal, 24/9/2024, 09:00 PM, 4.6, 12, car, 7, 8978242155)\n\nThis rider has the same destination (warangal), a very close date and time match (24/9/2024, 09:00 PM), making them the most suitable candidate for your trip. \n\n**Important Notes:**\n\n* **Additional Factors:**  You might want to consider other factors like the rider's rating, the vehicle type, and seating capacity when making your final decision.\n* **Flexibility:**  If you are flexible with the time, it might be worth reaching out to other riders whose dates and times are slightly off, but who are otherwise a good match. \n",
        ],
        },
        {
        "role": "user",
        "parts": [
            "i need only output int his format \"\"ride_id\": \"a1\", \"driver_name\": \"John Doe\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"12/07/2024\",\n         \"time\": \"10:00 PM\", \"rating\": \"4.2\", \"total_number_of_trips\": \"10\", \"Vehicle\": \"car\", \"seating_capacity\": \"5\",\n         \"contact\": \"8978242155\", \"price\": \"19\"\"\n",
        ],
        },
        {
        "role": "model",
        "parts": [
            "You got it! Here's the output in the format you requested:\n\n```json\n{\n  \"ride_id\": \"a1\",\n  \"driver_name\": \"siddhu\",\n  \"source\": \"chennai\",\n  \"destination\": \"warangal\",\n  \"date\": \"24/9/2024\",\n  \"time\": \"09:00 PM\",\n  \"rating\": \"4.6\",\n  \"total_number_of_trips\": \"12\",\n  \"Vehicle\": \"car\",\n  \"seating_capacity\": \"7\",\n  \"contact\": \"8978242155\",\n  \"price\": \"19\" \n}\n```\n\n**Explanation:**\n\n* **ride_id:**  \"a1\" (from your input data)\n* **driver_name:** \"siddhu\" (from your input data)\n* **source:** \"chennai\" (from your input data)\n* **destination:** \"warangal\" (from your input data)\n* **date:** \"24/9/2024\" (from your input data)\n* **time:** \"09:00 PM\" (from your input data)\n* **rating:** \"4.6\" (from your input data)\n* **total_number_of_trips:** \"12\" (from your input data)\n* **Vehicle:** \"car\" (from your input data)\n* **seating_capacity:** \"7\" (from your input data)\n* **contact:** \"8978242155\" (from your input data)\n* **price:** \"19\"  (This is a placeholder, as you didn't provide pricing information in the input. You would need to determine this price based on factors like distance, time, etc.)\n\n**Remember:** This output is based on the data you provided and the format you specified. To calculate the price, you'll need to develop a pricing model for your rides. \n",
        ],
        },
        {
        "role": "user",
        "parts": [
            "the output should be in this format only\n=============================\ni need only this format {\"ride_id\": \"a1\", \"driver_name\": \"John Doe\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"12/07/2024\",\n\"time\": \"10:00 PM\", \"rating\": \"4.2\", \"total_number_of_trips\": \"10\", \"Vehicle\": \"car\", \"seating_capacity\": \"5\",\n\"contact\": \"8978242155\", \"price\": \"19\"}\n",
        ],
        },
        {
        "role": "model",
        "parts": [
            "You are absolutely right! I apologize for the formatting error in my previous response. \n\nHere is the correct output in the exact format you specified:\n\n```json\n{\"ride_id\": \"a1\", \"driver_name\": \"siddhu\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"24/9/2024\", \"time\": \"09:00 PM\", \"rating\": \"4.6\", \"total_number_of_trips\": \"12\", \"Vehicle\": \"car\", \"seating_capacity\": \"7\", \"contact\": \"8978242155\", \"price\": \"19\"} \n```\n\nThis output follows your exact format, including the double quotes, commas, and colons. I'll be more careful with formatting in the future. \n\nLet me know if you have any other questions! \n",
        ],
        },
        {
        "role": "user",
        "parts": [
            "dont print a single text except output",
        ],
        },
        {
        "role": "model",
        "parts": [
            "```json\n{\"",
        ],
        },
        {
        "role": "user",
        "parts": [
            "dont give \"You are absolutely right! I apologize for the formatting error in my previous response.\nHere is the correct output in the exact format you specified:\" such \nfive only this\n===================\n{\"ride_id\": \"a1\", \"driver_name\": \"siddhu\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"24/9/2024\", \"time\": \"09:00 PM\", \"rating\": \"4.6\", \"total_number_of_trips\": \"12\", \"Vehicle\": \"car\", \"seating_capacity\": \"7\", \"contact\": \"8978242155\", \"price\": \"19\"}",
        ],
        },
        {
        "role": "model",
        "parts": [
            "```json\n{\"ride_id\": \"a1\", \"driver_name\": \"siddhu\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"24/9/2024\", \"time\": \"09:00 PM\", \"rating\": \"4.6\", \"total_number_of_trips\": \"12\", \"Vehicle\": \"car\", \"seating_capacity\": \"7\", \"contact\": \"8978242155\", \"price\": \"19\"}\n``` \n",
        ],
        },
        {
        "role": "user",
        "parts": [
            "('a1', 'siddhu', 'chennai', 'warangal', '24/9/2024', '09:00 PM', '4.6', '12', 'car', '7', '8978242155') ('a2', 'hruday', 'anai, central', 'veltech university', '28/9/2024', '06 : 00 AM', '4.2', '10', 'car', '5', '7325411231') ('a4', 'ashok', 'chennai', 'hyderabad', '22/9/2024', '05 : 00 pm', '4', '7', 'bike', '5', '9325411231') match with a ('avadi', 'warangal', '11:00 PM') match with (chennai, wrangal,2024-09-25,10:00pm)",
        ],
        },
        {
        "role": "model",
        "parts": [
            "```json\n{\"ride_id\": \"a1\", \"driver_name\": \"siddhu\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"24/9/2024\", \"time\": \"09:00 PM\", \"rating\": \"4.6\", \"total_number_of_trips\": \"12\", \"Vehicle\": \"car\", \"seating_capacity\": \"7\", \"contact\": \"8978242155\", \"price\": \"19\"}\n``` \n",
        ],
        },
        {
        "role": "user",
        "parts": [
            "calculate distance average distance between two cities and add new column in above file to km and calcuate the price and update according to that 1 km is 5 update like this in price column",
        ],
        },
        {
        "role": "model",
        "parts": [
            "You're asking for a complex task that requires:\n\n1. **Distance Calculation:**  You need a way to calculate the distance between cities. This usually involves using a mapping API or a database of city distances.\n2. **Data Manipulation:** You need to add a new column to your JSON data and populate it with the calculated distance.\n3. **Price Calculation:**  You need to use the distance and a pricing rule (1 km = 5) to calculate the price for each ride. \n\n**Here's a breakdown of the process (assuming you have a way to calculate distances):**\n\n**1. Calculate Distances:**\n\n*   Use a mapping API like Google Maps API, or a database of city distances to get the distance between the source and destination for each ride. \n\n**2.  Update JSON Data:**\n\n*   You'll need to use a programming language like Python or JavaScript to manipulate the JSON data. \n*   Read the JSON data into a data structure (e.g., a Python dictionary or a JavaScript object).\n*   Add a new key-value pair to each ride object: `\"distance\": <calculated_distance>`. \n*   Calculate the price using: `price = distance * 5`\n*   Update the \"price\" key-value pair in each ride object.\n*   Write the updated JSON data to a file.\n\n**Example Python Code (requires a distance calculation function):**\n\n```python\nimport json\n\ndef calculate_distance(source, destination):\n  # Replace this with your actual distance calculation logic\n  # Using a mapping API or a distance database\n  return 100 # Example distance for now\n\nrides = [\n    {\"ride_id\": \"a1\", \"driver_name\": \"siddhu\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"24/9/2024\", \"time\": \"09:00 PM\", \"rating\": \"4.6\", \"total_number_of_trips\": \"12\", \"Vehicle\": \"car\", \"seating_capacity\": \"7\", \"contact\": \"8978242155\", \"price\": \"19\"}\n]\n\nfor ride in rides:\n  distance = calculate_distance(ride[\"source\"], ride[\"destination\"])\n  ride[\"distance\"] = distance\n  ride[\"price\"] = distance * 5\n\nwith open('updated_rides.json', 'w') as f:\n  json.dump(rides, f, indent=4)\n```\n\n**Remember:**\n\n*   You'll need to replace the placeholder distance calculation function (`calculate_distance`) with your actual distance calculation logic.\n*   The pricing rule (1 km = 5) is an example, you can customize it to fit your needs.\n\nLet me know if you have any more questions, and I'll do my best to help! \n",
        ],
        },
        {
        "role": "user",
        "parts": [
            "i need in this format as output dont give me code\n{\"ride_id\": \"a1\", \"driver_name\": \"siddhu\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"24/9/2024\", \"time\": \"09:00 PM\", \"rating\": \"4.6\", \"total_number_of_trips\": \"12\", \"Vehicle\": \"car\", \"seating_capacity\": \"7\", \"contact\": \"8978242155\", \"price\": \"19\"}",
        ],
        },
        {
        "role": "model",
        "parts": [
            "```json\n{\"ride_id\": \"a1\", \"driver_name\": \"siddhu\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"24/9/2024\", \"time\": \"09:00 PM\", \"rating\": \"4.6\", \"total_number_of_trips\": \"12\", \"Vehicle\": \"car\", \"seating_capacity\": \"7\", \"contact\": \"8978242155\", \"distance\": \"500\", \"price\": \"2500\"}\n``` \n\n**Explanation:**\n\n* **distance:** I added a new key \"distance\" with a value of \"500\" (assuming the distance between Chennai and Warangal is 500 km). You would need to replace this with the actual calculated distance.\n* **price:** I updated the \"price\" to \"2500\" based on the distance and the 1 km = 5 price rule (500 * 5 = 2500). \n\n\n",
        ],
        },
        {
        "role": "user",
        "parts": [
            "i aslo don't need explaination just that only\n{\"ride_id\": \"a1\", \"driver_name\": \"siddhu\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"24/9/2024\", \"time\": \"09:00 PM\", \"rating\": \"4.6\", \"total_number_of_trips\": \"12\", \"Vehicle\": \"car\", \"seating_capacity\": \"7\", \"contact\": \"8978242155\", \"distance\": \"500\", \"price\": \"2500\"}",
        ],
        },
        {
        "role": "model",
        "parts": [
            "{\"ride_id\": \"a1\", \"driver_name\": \"siddhu\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"24/9/2024\", \"time\": \"09:00 PM\", \"rating\": \"4.6\", \"total_number_of_trips\": \"12\", \"Vehicle\": \"car\", \"seating_capacity\": \"7\", \"contact\": \"8978242155\", \"distance\": \"500\", \"price\": \"2500\"}",
        ],
        },
        {
        "role": "user",
        "parts": [
            "it printing like this \n```json\n{\"ride_id\": \"a1\", \"driver_name\": \"siddhu\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"24/9/2024\", \"time\": \"09:00 PM\", \"rating\": \"4.6\", \"total_number_of_trips\": \"12\", \"Vehicle\": \"car\", \"seating_capacity\": \"7\", \"contact\": \"8978242155\", \"distance\": \"500\", \"price\": \"2500\"}\n```\ni need like this\n{\"ride_id\": \"a1\", \"driver_name\": \"siddhu\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"24/9/2024\", \"time\": \"09:00 PM\", \"rating\": \"4.6\", \"total_number_of_trips\": \"12\", \"Vehicle\": \"car\", \"seating_capacity\": \"7\", \"contact\": \"8978242155\", \"distance\": \"500\", \"price\": \"2500\"}",
        ],
        },
        {
        "role": "model",
        "parts": [
            "You are absolutely right!  I apologize for the formatting issue. I'm still under development and learning to be more precise with my outputs.\n\nHere is the output exactly as you requested:\n\n```json\n{\"ride_id\": \"a1\", \"driver_name\": \"siddhu\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"24/9/2024\", \"time\": \"09:00 PM\", \"rating\": \"4.6\", \"total_number_of_trips\": \"12\", \"Vehicle\": \"car\", \"seating_capacity\": \"7\", \"contact\": \"8978242155\", \"distance\": \"500\", \"price\": \"2500\"}\n```\n\nI will try my best to be more accurate in the future!  Please let me know if you have any other questions. \n",
        ],
        },
        {
        "role": "user",
        "parts": [
            "just give it dont this\n{\"ride_id\": \"a1\", \"driver_name\": \"siddhu\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"24/9/2024\", \"time\": \"09:00 PM\", \"rating\": \"4.6\", \"total_number_of_trips\": \"12\", \"Vehicle\": \"car\", \"seating_capacity\": \"7\", \"contact\": \"8978242155\", \"distance\": \"500\", \"price\": \"2500\"}",
        ],
        },
        {
        "role": "model",
        "parts": [
            "{\"ride_id\": \"a1\", \"driver_name\": \"siddhu\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"24/9/2024\", \"time\": \"09:00 PM\", \"rating\": \"4.6\", \"total_number_of_trips\": \"12\", \"Vehicle\": \"car\", \"seating_capacity\": \"7\", \"contact\": \"8978242155\", \"distance\": \"500\", \"price\": \"2500\"}",
        ],
        },
        {
        "role": "user",
        "parts": [
            "{\"ride_id\": \"a1\", \"driver_name\": \"siddhu\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"24/9/2024\", \"time\": \"09:00 PM\", \"rating\": \"4.6\", \"total_number_of_trips\": \"12\", \"Vehicle\": \"car\", \"seating_capacity\": \"7\", \"contact\": \"8978242155\", \"distance\": \"500\", \"price\": \"2500\"}",
        ],
        },
        {
        "role": "model",
        "parts": [
            "{\"ride_id\": \"a1\", \"driver_name\": \"siddhu\", \"source\": \"chennai\", \"destination\": \"warangal\", \"date\": \"24/9/2024\", \"time\": \"09:00 PM\", \"rating\": \"4.6\", \"total_number_of_trips\": \"12\", \"Vehicle\": \"car\", \"seating_capacity\": \"7\", \"contact\": \"8978242155\", \"distance\": \"500\", \"price\": \"2500\"}"
        ],
        },
    ]
    )
    response = chat_session.send_message(user_in)
    print(response)
    asp = response.text
    cleaned_a = asp.replace('```json', '').replace('```', '').strip()

    # The response is cleaned and converted to JSON
    a_json = json.loads(cleaned_a)

    # No need to use json.loads() again since a_json is already a dictionary
    available_ride = a_json
    

    # Output the dictionary
    return available_ride

if __name__ == '__main__':
    app.run(debug=True, port=8080)  # Change 8080 to your desired port number
