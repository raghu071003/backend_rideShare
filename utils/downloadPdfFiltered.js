import PDFDocument from 'pdfkit';
import { db } from '../db/index.js';

const downloadPdfFiltered = async (req, res) => {
    try {
        const { riderId, driverId } = req.query;
        
        const results = await fetchRideData(riderId, driverId);
        generatePdf(results, res);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};

// Fetch ride data from database with optional filtering
const fetchRideData = (riderId = null, driverId = null) => {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT 
                ride_id, driver_id, rider_id, 
                source, destination, pickup_time, 
                date, vehicle_type, seating_capacity, status 
            FROM rides
        `;

        const conditions = [];
        const queryParams = [];

        if (riderId) {
            conditions.push("rider_id = ?");
            queryParams.push(riderId);
        }

        if (driverId) {
            conditions.push("driver_id = ?");
            queryParams.push(driverId);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }
        console.log(query);
        
        db.query(query, queryParams, (err, results) => {
            if (err) reject(err);
            resolve(results);
        });
    });
};

// Configure table layout
const tableConfig = {
    startX: 50,
    rowHeight: 20,
    fontSize: {
        title: 16,
        header: 10,
        content: 9
    },
    columns: [
        { header: 'Ride ID', width: 50 },
        { header: 'Driver ID', width: 50 },
        { header: 'Rider ID', width: 50 },
        { header: 'Source', width: 70 },
        { header: 'Destination', width: 80 },
        { header: 'Pickup Time', width: 80 },
        { header: 'Date', width: 70 },
        { header: 'Vehicle Type', width: 70 },
        { header: 'Capacity', width: 50 },
        { header: 'Status', width: 60 }
    ]
};

// Format date values
const formatDate = (date) => {
    const parsedDate = new Date(date);
    return parsedDate.toLocaleDateString();
};

// Format time values
const formatTime = (date) => {
    return new Date(date).toLocaleTimeString();
};

// Generate PDF document
const generatePdf = (results, res) => {
    const doc = new PDFDocument({
        margin: 30,
        size: 'A4',
        layout: 'landscape'
    });

    res.setHeader('Content-disposition', 'attachment; filename=rides_data.pdf');
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    // Add title
    addTitle(doc);

    // Add table header
    const startY = doc.y;
    addTableHeader(doc, startY);

    // Add table content
    addTableContent(doc, results, startY + tableConfig.rowHeight);

    doc.end();
};

// Add document title
const addTitle = (doc) => {
    doc.fontSize(tableConfig.fontSize.title)
       .text('Ride Data Report', { align: 'center' })
       .moveDown();
};

// Add table header
const addTableHeader = (doc, startY) => {
    doc.fontSize(tableConfig.fontSize.header);
    
    let currentX = tableConfig.startX;
    tableConfig.columns.forEach(column => {
        doc.rect(currentX, startY, column.width, tableConfig.rowHeight)
           .stroke();
        doc.text(
            column.header,
            currentX + 5,
            startY + 5,
            { width: column.width - 10 }
        );
        currentX += column.width;
    });
};

// Add table content
const addTableContent = (doc, results, startY) => {
    doc.fontSize(tableConfig.fontSize.content);
    
    results.forEach((ride, rowIndex) => {
        const currentY = startY + (rowIndex * tableConfig.rowHeight);
        let currentX = tableConfig.startX;
        
        const rowData = [
            ride.ride_id,
            ride.driver_id,
            ride.rider_id,
            ride.source,
            ride.destination,
            ride.pickup_time,
            formatDate(ride.date),
            ride.vehicle_type,
            ride.seating_capacity,
            ride.status
        ];

        rowData.forEach((data, columnIndex) => {
            const column = tableConfig.columns[columnIndex];
            
            doc.rect(currentX, currentY, column.width, tableConfig.rowHeight)
               .stroke();
            doc.text(
                data.toString(),
                currentX + 5,
                currentY + 5,
                { 
                    width: column.width - 10,
                    lineBreak: false
                }
            );
            
            currentX += column.width;
        });
    });
};

export { downloadPdfFiltered };
