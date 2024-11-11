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
        // console.log(rides);
        
        res.status(200).json(rides);
    });
};
const logoutDriver = async (req, res) => {
    const driverId = req.user.id; // Assuming req.userId contains the driver's ID
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


const updateStatus = async (req, res) => {
    // Extracting ride_id from the request body (or params if applicable)
    const { ride_id } = req.body; 

    // SQL query to update the status of a ride
    const query = `
        UPDATE rides 
        SET status='completed'
        WHERE ride_id = ?
    `;

    try {
        // Execute the update query
        db.query(query, [ride_id], (err, result) => {
            if (err) {
                // Log the error and send a server error response
                console.error('Error updating ride status:', err);
                return res.status(500).json({ message: "Server error while updating ride status" });
            }

            // Check if any rows were affected
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "No ride found with the provided ride ID" });
            }

            // Successfully updated the ride status
            res.status(200).json({ message: "Ride status updated successfully!" });
        });
    } catch (error) {
        // Catch any unexpected errors and send a server error response
        console.error('Unexpected error:', error);
        res.status(500).json({ message: "Unexpected server error" });
    }
};

const acceptRide = async (req, res) => {
    const { ride_id, required_capacity } = req.body; // Assuming you pass required_capacity in the request body

    // First, check the seating capacity
    const capacityQuery = `
        SELECT seating_capacity 
        FROM rides 
        WHERE ride_id = ?
    `;

    try {
        // Fetch the current seating capacity for the ride
        db.query(capacityQuery, [ride_id], (err, capacityResult) => {
            if (err) {
                console.error('Error fetching seating capacity:', err);
                return res.status(500).json({ message: "Server error while fetching seating capacity" });
            }

            // Check if the ride was found
            if (capacityResult.length === 0) {
                return res.status(404).json({ message: "No ride found with the provided ride ID" });
            }

            const currentCapacity = capacityResult[0].seating_capacity;

            // Check if the current capacity is sufficient
            if (currentCapacity < required_capacity) {
                return res.status(400).json({ message: "Not enough seating capacity to accept the ride" });
            }

            // Proceed to accept the ride if capacity check passes
            const acceptQuery = `
                UPDATE rides 
                SET status='accepted', seating_capacity = seating_capacity - ?
                WHERE ride_id = ?
            `;

            db.query(acceptQuery, [required_capacity, ride_id], (err, result) => {
                if (err) {
                    console.error('Error accepting ride:', err);
                    return res.status(500).json({ message: "Server error while accepting ride" });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: "No ride found with the provided ride ID" });
                }

                res.status(200).json({ message: "Ride accepted successfully!" });
            });
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ message: "Unexpected server error" });
    }
};



const cancelRide = async (req, res) => {
    const { ride_id } = req.body; 

    const query = `
        UPDATE rides 
        SET status='cancelled'
        WHERE ride_id = ?
    `;

    try {
        db.query(query, [ride_id], (err, result) => {
            if (err) {
                console.error('Error cancelling ride:', err);
                return res.status(500).json({ message: "Server error while cancelling ride" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "No ride found with the provided ride ID" });
            }

            res.status(200).json({ message: "Ride cancelled successfully!" });
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ message: "Unexpected server error" });
    }
};


const availableRides = async(req,res)=>{
    const { source, destination } = req.query;

    const query = `
        SELECT * FROM rides 
        WHERE source = ? AND destination = ? AND status = 'available'
    `;

    try {
        db.query(query, [source, destination], (err, results) => {
            if (err) {
                console.error('Error fetching available rides:', err);
                return res.status(500).json({ success: false, message: 'Server error while fetching rides.' });
            }

            res.status(200).json({ success: true, rides: results });
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ success: false, message: 'Unexpected server error.' });
    }
}
const respondToRideRequest = async (req, res) => {
    const { requestId, response, requiredCapacity } = req.body;
    const driverId = req.user.id;

    if (!['accepted', 'rejected'].includes(response)) {
        return res.status(400).json({ message: "Invalid response. Must be 'accepted' or 'rejected'." });
    }

    try {
        const checkQuery = "SELECT * FROM ride_requests WHERE id = ? AND status = 'pending'";
        const [rows] = await db.promise().query(checkQuery, [requestId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Ride request not found or already responded to." });
        }
        
        if (response === 'accepted') {
            const { source, destination, pickup_time, pickup_date, rider_id,price } = rows[0];
            
            const dateObject = new Date(pickup_date);
            const formatedDate = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${String(dateObject.getDate()).padStart(2, '0')}`;
        
            const insertRideQuery = `
                INSERT INTO rides (driver_id, rider_id, source, destination, pickup_time, date, vehicle_type, seating_capacity, status,price)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'accepted', ?)
            `;
            await db.promise().query(insertRideQuery, [driverId, rider_id, source, destination, pickup_time, formatedDate, "Car", requiredCapacity,price]);
        
            const updateCapacityQuery = `
                UPDATE driver_details 
                SET seating_capacity = seating_capacity - ?
                WHERE driver_id = ?
            `;
            await db.promise().query(updateCapacityQuery, [requiredCapacity, driverId]);
            
            // Update the ride request status to 'accepted'
            const updateRequestQuery = `
                UPDATE ride_requests 
                SET status = 'accepted' 
                WHERE id = ?
            `;
            await db.promise().query(updateRequestQuery, [requestId]);
        }
        
        else if (response === 'rejected') {
            const { source, destination, pickup_time, pickup_date, rider_id } = rows[0];
            const dateObject = new Date(pickup_date);
            const formatedDate = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${String(dateObject.getDate()).padStart(2, '0')}`;
            const insertRideQuery = `
                INSERT INTO rides (driver_id, rider_id, source, destination, pickup_time, date, status)
                VALUES (?, ?, ?, ?, ?, ?, 'cancelled')
            `;
            await db.promise().query(insertRideQuery, [driverId, rider_id, source, destination, pickup_time, formatedDate]);

            // Update the ride request status to 'rejected'
            const updateRequestQuery = `
                UPDATE ride_requests 
                SET status = 'rejected' 
                WHERE id = ?
            `;
            await db.promise().query(updateRequestQuery, [requestId]);
        }

        console.log(`Ride request ${response} by driver ${driverId}`);
        res.status(200).json({ success: true, message: `Ride request ${response} successfully!` });
    } catch (error) {
        console.error("Error responding to ride request:", error);
        res.status(500).json({ success: false, message: "Error responding to ride request." });
    }
};



 const getRideRequests = async (req, res) => {
    const driverId = req.user.id; // Assuming authMiddleware adds the driver's ID to req.user

    try {
        const query = `
            SELECT rr.id, rr.rider_id, rr.source, rr.destination, rr.pickup_time, rr.pickup_date, rr.status,rr.seating_required,rr.price
            FROM ride_requests AS rr
            WHERE rr.driver_id = ? AND rr.status = 'pending'
        `;

        const [requests] = await db.promise().query(query, [driverId]);

        if (requests.length > 0) {
            res.status(200).json({ success: true, requests });
        } else {
            res.status(404).json({ success: false, message: "No ride requests found." });
        }
    } catch (error) {
        console.error("Error fetching ride requests:", error);
        res.status(500).json({ success: false, message: "Error fetching ride requests." });
    }
};

const getCurrentRides = async (req, res) => {
    const driverId = req.user.id; // Assuming authMiddleware adds the driver's ID to req.user
  
    // Basic validation
    if (!driverId) {
      return res.status(400).json({ success: false, message: "Driver ID is required" });
    }
  
    try {
      const query = `
        SELECT * FROM rides
        WHERE driver_id = ?
        AND status = 'accepted'
      `;
  
      const [requests] = await db.promise().query(query, [driverId]);
  
      if (requests.length > 0) {
        res.status(200).json({ success: true, requests });
      } else {
        res.status(404).json({ success: false, message: "No ride requests found." });
      }
    } catch (error) {
      console.error("Error fetching ride requests for driver ID:", driverId, error);
      res.status(500).json({ success: false, message: "Error fetching ride requests." });
    }
  };
  

  const completeRide = async (req, res) => {
    const { rideId } = req.body

    try {
        const [result] = await db.promise().query(
            'UPDATE rides SET status = ? WHERE ride_id = ?',
            ['completed', rideId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        res.status(200).json({ message: 'Ride status updated to completed' });
    } catch (error) {
        console.error('Error updating ride status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
const updateDriverLocation = async (req, res) => {
    const  driverId = req.user.id;
    
    const { latitude, longitude } = req.body;
        
    try {
        const query = `
            INSERT INTO driver_locations (driver_id, latitude, longitude, last_updated)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            latitude = VALUES(latitude),
            longitude = VALUES(longitude),
            last_updated = NOW()`;
            
        await db.promise().query(query, [driverId, latitude, longitude]);
        
        res.status(200).json({
            success: true,
            message: "Location updated successfully"
        });
    } catch (error) {
        console.error("Error updating driver location:", error);
        res.status(500).json({
            success: false,
            message: "Error updating driver location"
        });
    }
};

const getDriverDetails = async (req, res) => {
    const driverId = req.user.id; 

    try {
        // SQL query to get driver details and ride request details (source, destination, pickup_time, pickup_date)
        const query = `
            SELECT * from driver_details WHERE ID = ?;
        `;

        // Execute the query
        const [rows] = await db.promise().query(query, [driverId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Driver not found or no ride requests found" });
        }

        // Send the driver and ride request details in the response
        const driverDetails = rows[0];  // Assuming one driver, one or more ride requests
        return res.status(200).json({ success: true, data: driverDetails });
    } catch (error) {
        console.error("Error fetching driver details:", error);
        return res.status(500).json({ success: false, message: "An error occurred while retrieving driver details" });
    }
};


export {driverLogin,updateDriverDetails,getDriverRides,logoutDriver,sessionCheck,updateStatus,acceptRide, cancelRide,availableRides,respondToRideRequest,getRideRequests,getCurrentRides,completeRide,updateDriverLocation,getDriverDetails}