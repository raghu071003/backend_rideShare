import PDFDocument from 'pdfkit'
import { db } from '../db/index.js';

const downloadPdf = async (req, res) => {
    try {
        const results = await fetchRideData();
        generatePdf(results, res);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};

// Fetch ride data from database
const fetchRideData = () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                ride_id, driver_id, rider_id, 
                source, destination, pickup_time, 
                date, vehicle_type, seating_capacity, status 
            FROM rides
        `;

        db.query(query, (err, results) => {
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
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Format time values
const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Generate PDF document
const generatePdf = (results, res) => {
    const doc = new PDFDocument({
        margin: 30,
        size: 'A4',
        layout: 'landscape'
    });

    // Set response headers
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
        // Draw header cell
        doc.rect(currentX, startY, column.width, tableConfig.rowHeight)
           .stroke();
        
        // Add header text
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
            formatTime(ride.pickup_time),
            formatDate(ride.date),
            ride.vehicle_type,
            ride.seating_capacity,
            ride.status
        ];

        rowData.forEach((data, columnIndex) => {
            const column = tableConfig.columns[columnIndex];
            
            // Draw cell border
            doc.rect(currentX, currentY, column.width, tableConfig.rowHeight)
               .stroke();
            
            // Add cell content
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

export {downloadPdf}