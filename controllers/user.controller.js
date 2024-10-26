import { db } from '../db/index.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use a strong secret key and store it securely
const JWT_EXPIRES_IN = '15m'; // Set the expiration time for access token
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
    console.log(riderId);
    
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
        // Retrieve the user from the database using riderId
        const query = "SELECT * FROM riders WHERE ID = ?";
        const [rows] = await db.promise().query(query, [riderId]);

        if (rows.length === 0) {
            throw new ApiError(404, "User not found");
        }

        const user = rows[0]; // Assuming rows contain the user data

        // Generate tokens using user methods
        const accessToken = generateAccessToken(user.ID);
        const refreshToken = generateRefreshToken(user.ID);

        // Save the refresh token to the database
        const updateQuery = "UPDATE riders SET refreshToken = ? WHERE ID = ?";
        await db.promise().query(updateQuery, [refreshToken, riderId]);

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid Request");
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
    const riderId = req.userId;
    try {
        const updateQuery = "UPDATE riders SET refreshToken = NULL WHERE ID = ?";
        await db.promise().query(updateQuery, [riderId]);

        res.status(200).json({ success: true, message: "Logged out successfully." });
    } catch (error) {
        console.error("Error logging out:", error);
        res.status(500).json({ success: false, message: "Error logging out." });
    }
};





export { riderLogin, updateRiderDetails,logoutUser };
