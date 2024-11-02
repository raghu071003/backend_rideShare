import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCFYC3YudT7STlsvBazCvfkPuyKEyt5jQE");

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});




const generateRide = async (userData, availableRides) => {

    const prompt = `
You are tasked with analyzing available rides data and a user's travel preferences to recommend the best ride options. The rides should be sorted based on the highest match to the user's preferences.

1. User Data:
   - User ID: ${userData.userId}
   - Source: ${userData.userSource}
   - Destination: ${userData.userDestination}
   - Preferred Time: ${userData.userPreferredTime}
   - Additional Preferences: ${JSON.stringify(userData.userAdditionalPreferences)}

2. Available Rides Data:
   ${availableRides.map(ride => `- Ride ID: ${ride.rideId}, Source: ${ride.source}, Destination: ${ride.destination}, Time: ${ride.time}, Car Type: ${ride.carType}, Price: ${ride.price}`).join('\n   ')}

3. Instructions:
   - Analyze the rides based on the user's source, destination, and any additional preferences.
   - Calculate a match score for each ride based on:
     - Nearest match of source and destination (highest score).
     - if the source city is far that is above 40km donot show that data 
     - Proximity of ride time to the preferred time (e.g., within 15 minutes).
     - Car type preferences.
     - Generate and give price for each ride in inr based on the distance between the cities and avg fuel cost and add a profit og 20rs
   - Sort the rides in descending order of match score and provide the results.

4. Output Format:
   - Return the sorted list of rides with the following details:
     - Ride ID (use the driver_id as ride Id )
     - driver_id
     - Source
     - Destination
     - Time
     -Seating capacity
     -distance

     Donot give any extra text or explanation strictly just give a json object array   
     I just want json objects donot explain any thing 

`;

    try {
        const result = await model.generateContent(prompt);
        console.log(result.response.text());
    } catch (error) {
        console.error('Error generating content:', error);
    }

}

export { generateRide }