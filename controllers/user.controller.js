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
    const { driverId, source, destination, pickupTime, pickupDate,req_seating,price } = req.body;
    // console.log(driverId,riderId,source,destination,pickupDate,pickupTime);
    
    // Validate input data
    if (!driverId || !source || !destination || !pickupTime || !pickupDate) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
        // SQL query to insert a new ride request
        const query = `
            INSERT INTO ride_requests (rider_id, driver_id, source, destination, pickup_time, pickup_date, status,seating_required,price)
            VALUES (?, ?, ?, ?, ?, ?, 'pending',?,?)
        `;
        
        const values = [riderId, driverId, source, destination, pickupTime, pickupDate,req_seating,price];

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

const upcomingRides = async (req, res) => {
    const userId = req.user.id;
    const currentDate = new Date().toISOString().slice(0, 10); 
    const query = `
        SELECT rides.*, drivers.mobile_no 
        FROM rides 
        JOIN drivers ON rides.driver_id = drivers.id
        WHERE rides.rider_id = ? AND rides.date >= ? AND rides.status = 'accepted'`;

    try {
        const [results] = await db.promise().query(query, [userId, currentDate]); 
        if (results.length > 0) {
            return res.status(200).json(results); 
        } else {
            return res.status(404).json({ message: 'No upcoming rides found.' }); 
        }
    } catch (error) {
        console.error('Error fetching upcoming rides:', error);
        return res.status(500).json({ error: 'Failed to fetch upcoming rides.' });
    }
};

const completedRides = async (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT 
            rides.*, 
            drivers.name AS driver_name, 
            drivers.mobile_no AS driver_mobile
        FROM rides
        INNER JOIN drivers ON rides.driver_id = drivers.id
        WHERE rides.rider_id = ? AND rides.status = 'completed'`;

    try {
        const [results] = await db.promise().query(query, [userId]); 
        if (results.length > 0) {
            return res.status(200).json(results); 
        } else {
            return res.status(404).json({ message: 'No completed rides found.' }); 
        }
    } catch (error) {
        console.error('Error fetching completed rides:', error);
        return res.status(500).json({ error: 'Failed to fetch completed rides.' });
    }
};


const updatePaymentStatus = async (req, res) => {
    const { ride_id } = req.params;
  
    try {
      // Execute the update query with promise-based syntax
      const [result] = await db.promise().query(
        'UPDATE rides SET payment_status = ? WHERE ride_id = ?',
        ['paid', ride_id]
      );
  
      // Check if the ride was found and updated
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Ride not found' });
      }
  
      // Send a success response
      res.status(200).json({ message: 'Payment status updated to paid' });
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  const getSuggestions = async (req, res) => {
    try {
      // Execute the select query with promise-based syntax
      const [rows] = await db.promise().query(
        'SELECT DISTINCT name FROM places'
      );
  
      // Send a response with the list of names
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching names:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  const getDriverLocation = async (req, res) => {
    const { driverId } = req.params;
    
    try {
        const query = `
            SELECT latitude, longitude, last_updated
            FROM driver_locations 
            WHERE driver_id = ?
            ORDER BY last_updated DESC 
            LIMIT 1`;
            
        const [rows] = await db.promise().query(query, [driverId]);
        
        if (rows.length > 0) {
            res.status(200).json({
                success: true,
                location: {
                    latitude: rows[0].latitude,
                    longitude: rows[0].longitude,
                    lastUpdated: rows[0].last_updated
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Driver location not found"
            });
        }
    } catch (error) {
        console.error("Error fetching driver location:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching driver location"
        });
    }
};

const updateRating = async(req,res)=>{
    const { driver_id,rating, feedback } = req.body;
    const user_id = req.user.id;
  if (!user_id || !rating || !feedback) {
    return res.status(400).send('Missing required fields');
  }

  // Step 1: Get the current overall rating and num_ratings from the database
  db.query('SELECT overall_rating, num_ratings FROM ratings WHERE driver_id = ?', [driver_id], async (err, results) => {
    if (err) {
      return res.status(500).send('Error fetching current rating data');
    }

    let previous_average = 0;
    let num_ratings = 0;

    if (results.length > 0) {
      previous_average = results[0].overall_rating;
      num_ratings = results[0].num_ratings;
    }

    // Step 2: Send feedback and rating to Python server
    try {
      const response = await axios.post('http://localhost:8080/ai/process_feedback', {
        feedback,
        rating,
        previous_average,
        num_ratings,
      });

      // Step 3: Process the response from Python server
      const new_rating = response.data;
    //   console.log(new_rating);
      
      // Step 4: Update the overall rating in the database
      const new_overall_rating = (previous_average * num_ratings + new_rating) / (num_ratings + 1);
      const new_num_ratings = num_ratings + 1;

      // Insert or update the database
      if (results.length > 0) {
        db.query('UPDATE ratings SET overall_rating = ?, num_ratings = ? WHERE driver_id = ? AND user_id =?', 
          [new_overall_rating, new_num_ratings,driver_id, user_id], 
          (err) => {
            if (err) return res.status(500).send('Error updating the rating');
            res.status(200).send({ new_rating: new_overall_rating });
        });
      } else {
        // console.log("updating");
        
        db.query('INSERT INTO ratings (user_id, overall_rating, num_ratings,driver_id) VALUES (?, ?, ?, ?)', 
          [user_id, new_overall_rating, new_num_ratings,driver_id], 
          (err) => {
            if (err) {
                console.log(err);
                
                return res.status(500).send('Error inserting new rating');
            }
            res.status(200).send({ new_rating: new_overall_rating });
        });
      }
    } catch (error) {
      console.error('Error calling Python server:', error);
      res.status(500).send('Error processing feedback');
    }
  });
    
}

const reportDriver = async (req, res) => {
    const { rideId, driverId, driverName, driverContact, reportDetails } = req.body;

    if (!rideId || !driverId || !reportDetails) {
        return res.status(400).json({
            success: false,
            message: 'Ride ID, Driver ID, and Report Details are required'
        });
    }

    try {
        const query = `
            INSERT INTO reports (ride_id, driver_id, driver_name, driver_contact, report_details)
            VALUES (?, ?, ?, ?, ?);
        `;
        await db.promise().query(query, [rideId, driverId, driverName, driverContact, reportDetails]);

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully'
        });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting report'
        });
    }
};

const sendDeatils = async(req,res)=>{
    const userId = req.user.id;
    if(!userId){
        return res.status(401)
    }
    return res.status(200).json({userId})
}

export { sendDeatils,riderLogin, updateRiderDetails,logoutUser,sessionCheck,requestRide ,requestDriver,upcomingRides,completedRides,updatePaymentStatus,getSuggestions,getDriverLocation,updateRating,reportDriver};
