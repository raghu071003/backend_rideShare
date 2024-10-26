import mysql from 'mysql2';

// Create a MySQL connection pool for better performance
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'rideshare',
});

// Connect to the database
const connectDB = async () => {
    try {
        // Test connection
        await db.promise().getConnection();
        console.log('Connected to the MySQL database.');
    } catch (err) {
        console.error('Database connection failed: ', err);
        process.exit(1); // Exit process with failure
    }
};

// Export the pool and the connectDB function
export { db, connectDB };
