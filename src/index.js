//require('dotenv').config({path:'./env'});
import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import app from './app.js';
import { asyncHandler } from './utils/asyncHandler.js';



dotenv.config({
    path:'./.env',
})

//asyncHandler(connectDB);
connectDB()
.then(()=>{
    app.on("errror",(error)=>{
        console.log(error);
        throw error;
    })
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is listening at ${process.env.PORT || 8000}`)
    })
})
.catch((err)=>{
    console.log("MongoDB connection failed",err);
})