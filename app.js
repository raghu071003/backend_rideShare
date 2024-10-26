import express from 'express'
import cors from "cors"
import userRouter from './Routes/user.routes.js'
import adminRouter from './Routes/admin.routes.js'
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(cors({
    origin:'*',
    credentials:true,
}))
console.log(process.env.ORIGIN);

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use("/api/v1/user",userRouter)
app.use("/api/v1/admin",adminRouter)

export {app}