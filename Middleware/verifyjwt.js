import jwt from 'jsonwebtoken';
import { db } from '../db/index.js'; // Adjust the path based on your project structure

const verifyJwt = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized Request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log(decodedToken);

        // Assuming decodedToken contains riderId or similar identifier
        const query = "SELECT * FROM riders WHERE ID = ?";
        const [rows] = await db.promise().query(query, [decodedToken.id]);

        if (rows.length === 0) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = rows[0]; // Attach the user data to the request object
        next();
    } catch (error) {
        console.error(error); // Log the error for debugging
        next(new ApiError(401, error?.message || "Something Went Wrong"));
    }
};

export default verifyJwt;
