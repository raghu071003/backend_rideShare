

import os
import google.generativeai as genai
import requests
import json
from flask import Flask, request, jsonify








def process_feedback():
    generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
    }
    genai.configure(api_key="AIzaSyCFYC3YudT7STlsvBazCvfkPuyKEyt5jQE")
    model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
    )
    data = {
    "feedback": "The ride was smooth and the driver was polite.",
    "rating": 4.5,
    "previous_average": 4.2,
    "num_ratings": 150
    }


    feedback = data.get('feedback')
    rating = data.get('rating')
    previous_average = data.get('previous_average', 0)
    num_ratings = data.get('num_ratings', 0)
    if not feedback or rating is None:
        return jsonify({'error': 'Missing feedback or rating'}), 400

    # Create the prompt for Google Gemini
    prompt = f"""
    The user has given a rating of {rating} and their feedback is: "{feedback}". 
    The current overall rating is {previous_average} from {num_ratings} total ratings. 
    Considering the feedback and rating, calculate the new overall rating.
    Donot give any other text give the rating only without any explanation
    """

    # Assuming you have integrated Google Gemini (or another AI service) for prediction here
    try:
        chat_session = model.start_chat()
        response = chat_session.send_message(prompt)
        print(response.text)
        new_rating = float(response.text) 
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return new_rating

process_feedback()