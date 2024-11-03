

import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';

const verifyJwt = async (req, res, next) => {
    try {
        const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        // console.log(token);
        
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET || "your_jwt_secret"
        );
        // console.log(decodedToken);
        
        
        const query = "SELECT * FROM riders WHERE ID = ?";
        const [rows] = await db.promise().query(query, [decodedToken.id]);

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid access token" });
        }
        req.user = rows[0];
        next();
    } catch (error) {
        console.error("Token verification failed:", error);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token has expired" });
        } else if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }

        // Fallback for other types of errors
        return res.status(401).json({ message: "Unauthorized" });
    }
};
const verifyJwt2 = async (req, res, next) => {
    try {
        const token = req.cookies?.Driver_accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET || "your_jwt_secret"
        );
        
        const query = "SELECT * FROM riders WHERE ID = ?";
        const [rows] = await db.promise().query(query, [decodedToken.id]);

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid access token" });
        }
        req.user = rows[0];
        next();
    } catch (error) {
        console.error("Token verification failed:", error);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token has expired" });
        } else if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }

        // Fallback for other types of errors
        return res.status(401).json({ message: "Unauthorized" });
    }
};
const verifyJwt3 = async (req, res, next) => {
    try {
        const token = req.cookies?.admin_accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET || "your_jwt_secret"
        );
        console.log(decodedToken);
        
        const query = "SELECT * FROM admin WHERE ID = ?";
        const [rows] = await db.promise().query(query, [decodedToken.id]);

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid access token" });
        }
        req.user = rows[0];
        next();
    } catch (error) {
        console.error("Token verification failed:", error);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token has expired" });
        } else if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }

        // Fallback for other types of errors
        return res.status(401).json({ message: "Unauthorized" });
    }
};



export  {verifyJwt,verifyJwt2,verifyJwt3};
