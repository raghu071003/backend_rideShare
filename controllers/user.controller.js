import { db } from '../db/index.js';
import jwt from 'jsonwebtoken';
import { generateRide } from '../utils/genai.js';
import axios from 'axios'

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use a strong secret key and store it securely
const JWT_EXPIRES_IN = '2d'; // Set the expiration time for access token
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // Set the expiration time for refresh token

export const validateRider = async (email, password) => {
    try {
        const query = "SELECT ID FROM riders WHERE email = ? AND password = ?";
        const [rows] = await db.promise().query(query, [email, password]);

        return rows.length > 0 ? rows[0].ID : null;
    } catch (error) {
        console.error('Error validating rider:', error);
        throw error;
    }
};

const updateRiderDetails = async (req, res) => {
    const { riderId, source, destination, pickupTime, pickupDate } = req.body;
    // console.log(riderId);
    
    try {
        // Check if the rider details exist
        const checkQuery = "SELECT * FROM rider_details WHERE rider_id = ?";
        const [rows] = await db.promise().query(checkQuery, [riderId]);

        if (rows.length > 0) {
            // If the rider details exist, update them
            const updateQuery = `
                UPDATE rider_details 
                SET source = ?, destination = ?, pickup_time = ?, pickup_date = ? 
                WHERE rider_id = ?`;
            const [updateResult] = await db.promise().query(updateQuery, [source, destination, pickupTime, pickupDate, riderId]);

            if (updateResult.affectedRows > 0) {
                console.log("Ride details updated successfully!");
                return res.status(200).json({ success: true, message: "Ride details updated successfully!" });
            } else {
                console.log("No rows updated. Check if the rider ID exists.");
                return res.status(404).json({ success: false, message: "No rows updated. Check if the rider ID exists." });
            }
        } else {
            // If the rider details do not exist, insert new details
            const insertQuery = `
                INSERT INTO rider_details (rider_id, source, destination, pickup_time, pickup_date) 
                VALUES (?, ?, ?, ?, ?)`;
            const [insertResult] = await db.promise().query(insertQuery, [riderId, source, destination, pickupTime, pickupDate]);

            console.log("Ride details inserted successfully!");
            return res.status(201).json({ success: true, message: "Ride details inserted successfully!", id: insertResult.insertId });
        }
    } catch (error) {
        console.error("Error updating rider details: ", error);
        return res.status(500).json({ success: false, message: "Error updating rider details." });
    }
};

const generateAccessToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

const generateTokens = async (riderId) => {
    try {
        const query = "SELECT * FROM riders WHERE ID = ?";
        const [rows] = await db.promise().query(query, [riderId]);

        if (rows.length === 0) {
            throw new ApiError(404, "User not found");
        }

        const user = rows[0]; 

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);
        
        const updateQuery = "UPDATE riders SET refreshToken = ? WHERE ID = ?";
        await db.promise().query(updateQuery, [refreshToken, riderId]);

        return { accessToken, refreshToken };

    } catch (error) {
        return error
    }
};

const riderLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const riderId = await validateRider(email, password);
    if (riderId) {
        const { accessToken, refreshToken } = await generateTokens(riderId);
        res.cookie('accessToken', accessToken, {
            httpOnly: true,  
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 1000,
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({ id: riderId, accessToken, refreshToken });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
};

const logoutUser = async (req, res) => {
    const riderId = req.user.id;
    // console.log(riderId);
    
    try {
        // Clear the refresh token in the database
        const updateQuery = "UPDATE riders SET refreshToken = NULL WHERE ID = ?";
        await db.promise().query(updateQuery, [riderId]);

        // Options for clearing cookies (set path according to your application)
        const options = {
            httpOnly: true, // Make cookie inaccessible to client-side JavaScript
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'Strict', // Adjust according to your CSRF protection requirements
            path: '/', // Specify the path
        };

        // Clear cookies
        res.clearCookie("accessToken", options)
           .clearCookie("refreshToken", options)
           .status(200)
           .json({ success: true, message: "Logged out successfully." });
    } catch (error) {
        console.error("Error logging out:", error);
        res.status(500).json({ success: false, message: "Error logging out." });
    }
};

const sessionCheck = async (req, res) => {
    const riderId = req.user.id;  // Get the user ID from the request
    
    if (riderId) {
        try {
            // Query to select the rider by their ID
            const query = "SELECT * FROM riders WHERE id = ?";
            const [rows] = await db.promise().query(query, [riderId]); // Destructure to get rows

            if (rows.length > 0) {
                // Return the rider data if found
                res.status(200).json(rows[0]); // Send the first rider found
            } else {
                // If no rider found with that ID
                res.status(404).json({ message: 'Rider not found' });
            }
        } catch (error) {
            console.error("Database query error:", error);
            res.status(500).json({ message: 'Internal server error' });
        }
    } else {
        // If no rider ID is provided
        res.status(401).json({ message: 'No session' });
    }
};

const generateRideSuggestions = async (req, res) => {
    const { userData } = req.body; 

    if (!userData) {
        return res.status(400).json({ message: 'User data is required.' });
    }

    const { userSource, userDestination, userPreferredTime } = userData;
    let availableRides = [];

    try {
        const query = `
            SELECT * FROM driver_details 
        `;
        
        const [rows] = await db.promise().query(query);

        if (rows.length > 0) {
            availableRides = rows;
            console.log(availableRides);
            
        } else {
            return res.status(404).json({ message: 'No available rides found.' });
        }
        const suggestions = await generateRide(userData, availableRides);

        res.status(200).json({ success: true, suggestions });
    } catch (error) {
        console.error('Error generating ride suggestions:', error);
        res.status(500).json({ success: false, message: 'Error generating ride suggestions.' });
    }
};
const requestRide = async (req, res) => {
    const riderId = req.user.id;
    const { driverId, source, destination, pickupTime, pickupDate } = req.body;

    // Validate input data
    if (!source || !destination || !pickupDate || !pickupTime) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    // URL to which the request will be sent (replace with the actual URL)
    const targetUrl = 'http://127.0.0.1:8080/ai/getRide'; // Replace this with the actual URL

    // Prepare the payload
    const payload = {
        source,
        destination,
        pickup_time:pickupTime,
        pickup_date:pickupDate,
    };

    try {
        // Send the request to the external URL
        const response = await axios.post(targetUrl, payload);
        // console.log(response.data);
        
        // Return the response from the external API
        return res.status(response.status).json(response.data);
        
    } catch (error) {
        // Handle errors
        // console.error('Error making request to external API:', error);
        return res.status(error.response ? error.response.status : 500).json({ error: 'Failed to request ride.' });
    }
};

const requestDriver = async (req, res) => {
    const riderId = req.user.id; // Assuming the authenticated rider's ID is in req.user
    const { driverId, source, destination, pickupTime, pickupDate,req_seating } = req.body;
    // console.log(driverId,riderId,source,destination,pickupDate,pickupTime);
    
    // Validate input data
    if (!driverId || !source || !destination || !pickupTime || !pickupDate) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
        // SQL query to insert a new ride request
        const query = `
            INSERT INTO ride_requests (rider_id, driver_id, source, destination, pickup_time, pickup_date, status,seating_required)
            VALUES (?, ?, ?, ?, ?, ?, 'pending',?)
        `;
        
        const values = [riderId, driverId, source, destination, pickupTime, pickupDate,req_seating];

        // Execute the query with db.promise()
        const [result] = await db.promise().query(query, values);

        // Return a success response with the inserted ID
        res.status(201).json({
            success: true,
            message: 'Ride request created successfully',
            requestId: result.insertId, // Inserted row ID
        });
    } catch (error) {
        console.error("Error creating ride request:", error);
        res.status(500).json({ success: false, message: 'Failed to create ride request' });
    }
};



export { riderLogin, updateRiderDetails,logoutUser,sessionCheck,generateRideSuggestions,requestRide ,requestDriver};
