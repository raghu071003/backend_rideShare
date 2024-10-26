import {app} from "./app.js";
import dotenv from "dotenv"
import {connectDB} from "./db/index.js";
dotenv.config({
    path:"./.env"
})
connectDB().then(
    app.listen(process.env.PORT,()=>{
        console.log("Server is Running at",process.env.PORT)
    })
).catch((err)=>{
    console.error("Error occured",err); 
    })