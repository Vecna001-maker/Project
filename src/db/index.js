// require('dotenv').config({path:'./env'});

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"
// const MONGODB_URI = "mongodb+srv://sanchit123:<sanchit123>@cluster0.mqttmqf.mongodb.net"

const connectDB = async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB connected to DB host : ${connectionInstance.connection.host}`)
        // console.log(connectionInstance);
    } catch (error) {
        console.log("MongoDB connection ERROR",error);
        // process.exit(1);
    }
}
// connectDB();

export default connectDB;