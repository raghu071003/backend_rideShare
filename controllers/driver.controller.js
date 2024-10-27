import { db } from '../db/index.js';
import jwt from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use a strong secret key and store it securely
const JWT_EXPIRES_IN = '2d'; // Set the expiration time for access token
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // Set the expiration time for refresh token


export const validateDriver = async (email, password) => {
    try {
        const query = "SELECT ID FROM drivers WHERE email = ? AND password = ?";
        const [rows] = await db.promise().query(query, [email, password]);
        return rows.length > 0 ? rows[0].ID : null;
    } catch (error) {
        console.error('Error validating rider:', error);
        throw error;
    }
};

const generateAccessToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

const generateTokens = async (driverId) => {
    try {
        const query = "SELECT * FROM drivers WHERE ID = ?";
        const [rows] = await db.promise().query(query, [driverId]);

        if (rows.length === 0) {
            throw new ApiError(404, "User not found");
        }

        const user = rows[0]; 

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);
        
        const updateQuery = "UPDATE drivers SET refreshToken = ? WHERE ID = ?";
        await db.promise().query(updateQuery, [refreshToken, driverId]);

        return { accessToken, refreshToken };

    } catch (error) {
        return error
    }
};

const driverLogin = async (req, res) => {
    const { email, password } = req.body;
        // console.log(email,password);
        
    if (!email || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const driverId = await validateDriver(email, password);
    
    if (driverId) {
        
        const { accessToken, refreshToken } = await generateTokens(driverId);
        res.cookie('Driver_accessToken', accessToken, {
            httpOnly: true,  
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 1000,
        });

        res.cookie('Driver_refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({ id: driverId, accessToken, refreshToken });
    } else {
        
        res.status(401).json({ message: 'Invalid username or password' });
    }
};
const updateDriverDetails = async (req, res) => {
    const driverId = req.user.id;
    const { source, destination, pickupTime, date, vehicleType, seatingCapacity } = req.body;

    // Step 1: Check if the driver details exist
    const checkQuery = 'SELECT ID FROM driver_details WHERE driver_id = ?';
    
    db.query(checkQuery, [driverId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Server error during checking" });
        }
        
        if (result.length === 0) {
            // Step 2: If no record exists, insert new driver details
            const insertQuery = `
                INSERT INTO driver_details (driver_id, source, destination, pickup_time, date_t, vehicle_t, seating_capacity)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(insertQuery, [driverId, source, destination, pickupTime, date, vehicleType, seatingCapacity], (insertErr) => {
                if (insertErr) {
                    return res.status(500).json({ message: "Server error during insert" });
                }
                return res.status(201).json({ message: "Ride details created successfully" });
            });
        } else {
            // Step 3: If a record exists, update the existing driver details
            const updateQuery = `
                UPDATE driver_details 
                SET source = ?, destination = ?, pickup_time = ?, date_t = ?, vehicle_t = ?, seating_capacity = ?
                WHERE driver_id = ?
            `;
            db.query(updateQuery, [source, destination, pickupTime, date, vehicleType, seatingCapacity, driverId], (updateErr) => {
                if (updateErr) {
                    return res.status(500).json({ message: "Server error during update" });
                }
                return res.status(200).json({ message: "Ride details updated successfully" });
            });
        }
    });
};

const getDriverRides = async (req, res) => {
    // console.log(req.user.id);
    
    const driverId = req.user.id; 
    const query = 'SELECT * FROM rides WHERE driver_id = ?';
    db.query(query, [driverId], (err, rides) => {
        if (err) {
            return res.status(500).json({ message: "Server error while fetching rides" });
        }
        res.status(200).json(rides);
    });
};
const logoutDriver = async (req, res) => {
    const driverId = req.userId; // Assuming req.userId contains the driver's ID
    try {
        const updateQuery = "UPDATE drivers SET refreshToken = NULL WHERE ID = ?";
        await db.promise().query(updateQuery, [driverId]);
        const options = {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'Strict', 
        }
        // Clear cookies
        res.clearCookie("Driver_accessToken", options)
           .clearCookie("Driver_refreshToken", options)
           .status(200)
           .json({ success: true, message: "Logged out successfully." });
    } catch (error) {
        console.error("Error logging out:", error);
        res.status(500).json({ success: false, message: "Error logging out." });
    }
};
const sessionCheck = (req, res) => {
    if (req.cookies.Driver_accessToken) {
        
        jwt.verify(req.cookies.Driver_accessToken, 'your_jwt_secret', (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid token' });
            }
            
            res.status(200).json(user);
        });
    } else {
        res.status(401).json({ message: 'No session' });
    }
};




export {driverLogin,updateDriverDetails,getDriverRides,logoutDriver,sessionCheck}