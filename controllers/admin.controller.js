import { db } from '../db/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use a strong secret key and store it securely
const JWT_EXPIRES_IN = '2d'; // Set the expiration time for access token
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // Set the expiration time for refresh token

export const validateAdmin = async (username, password) => {
    try {
        const query = "SELECT ID FROM admin WHERE username = ? AND password = ?";
        const [rows] = await db.promise().query(query, [username, password]);
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

const generateTokens = async (adminId) => {
    try {
        const query = "SELECT * FROM admin WHERE ID = ?";
        const [rows] = await db.promise().query(query, [adminId]);

        if (rows.length === 0) {
            throw new ApiError(404, "Admin not found");
        }

        const user = rows[0]; 
        
        const admin_accessToken = generateAccessToken(user.id);
        const admin_refreshToken = generateRefreshToken(user.id);
        
        const updateQuery = "UPDATE drivers SET refreshToken = ? WHERE ID = ?";
        await db.promise().query(updateQuery, [admin_refreshToken, adminId]);

        return { admin_accessToken, admin_refreshToken };

    } catch (error) {
        return error
    }
};
const adminLogin = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const adminId = await validateAdmin(username, password);

        if (adminId) {
            const tokens = await generateTokens(adminId);
            // console.log("Tokens received:", tokens); // Debug log

            const { admin_accessToken, admin_refreshToken } = tokens;

            res.cookie('admin_accessToken', admin_accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 1000,
            });

            res.cookie('admin_refreshToken', admin_refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });

            res.status(200).json({ id: adminId, admin_accessToken, admin_refreshToken });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const getRides = async (req, res) => {
    const query = 'SELECT * FROM rides'; // Adjust to your actual table name
    db.query(query, (err, results) => {
        if (err) {
            console.error("Database query error:", err); // Log the error for debugging
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
};

const adminLogout = async (req, res) => {
    const driverId = req.userId; // Assuming req.userId contains the driver's ID
    try {
        const updateQuery = "UPDATE admin SET refreshToken = NULL WHERE ID = ?";
        await db.promise().query(updateQuery, [driverId]);
        const options = {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'Strict', 
        }
        // Clear cookies
        res.clearCookie("admin_accessToken", options)
           .clearCookie("admin_refreshToken", options)
           .status(200)
           .json({ success: true, message: "Logged out successfully." });
    } catch (error) {
        console.error("Error logging out:", error);
        res.status(500).json({ success: false, message: "Error logging out." });
    }
};

const addRider = async (req, res) => {
    const { name, email, password, empId } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    try {
    
        const query = 'INSERT INTO riders (name, email, password, refreshToken ,emp_id) VALUES (?, ?, ?, ?, ?)';
        const values = [name, email, password, null,empId]; 

        
        const [result] = await db.promise().query(query, values);

        res.status(201).json({ success: true, riderId: result.insertId, message: 'Rider added successfully.' });
    } catch (error) {
        console.error('Error adding rider:', error);
        res.status(500).json({ success: false, message: 'Failed to add rider.' });
    }
};


const addDriver = async (req, res) => {
    const { name, email, password, mobile_no ,empId} = req.body;

    if (!name || !email || !password || !mobile_no) {
        return res.status(400).json({ message: 'Name, email, password, and mobile number are required.' });
    }

    try {
        const query = 'INSERT INTO drivers (name, email, password, mobile_no, refreshToken,emp_id) VALUES (?, ?, ?, ?, ?,?)';
        const values = [name, email, password, mobile_no, null,empId];
        const [result] = await db.promise().query(query, values);

        res.status(201).json({ success: true, driverId: result.insertId, message: 'Driver added successfully.' });
    } catch (error) {
        console.error('Error adding driver:', error);
        res.status(500).json({ success: false, message: 'Failed to add driver.' });
    }
};

const getAvailableRides = async (req, res) => {
    try {
        // Define the query to fetch available rides
        const query = `
            SELECT * FROM driver_details 
            WHERE  seating_capacity > 0
        `;

        const [results] = await db.promise().query(query); // Execute the query

        // Check if there are any available rides
        if (results.length === 0) {
            return res.status(404).json({ message: 'No available rides found.' });
        }

        // Return the list of available rides
        res.status(200).json(results);
    } catch (error) {
        console.error("Database query error:", error); // Log the error for debugging
        res.status(500).json({ error: 'Failed to retrieve available rides.' });
    }
};


export {adminLogin,getRides,adminLogout,addRider,addDriver,getAvailableRides}