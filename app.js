import express from 'express';
import cors from "cors";
import userRouter from './Routes/user.routes.js';
import adminRouter from './Routes/admin.routes.js';
import driverRouter from './Routes/driver.routes.js'
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
const allowedOrigin = process.env.ORIGIN || 'http://localhost:5173';

app.use(cors({
    origin: allowedOrigin, // Specify the exact origin
    credentials: true, // Allow credentials
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(cookieParser())

app.use("/api/v1/user", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/driver",driverRouter)

export { app };
