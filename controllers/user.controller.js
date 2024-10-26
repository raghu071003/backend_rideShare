import { db } from '../db/index.js';

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




const riderLogin = async (req, res) => {
    const { email, password } = req.body;
    // console.log(email,password);

    if (!email || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }


    const riderId = await validateRider(email, password);
    if (riderId) {
        res.status(200).json({ id: riderId });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
}



export { riderLogin,updateRiderDetails }