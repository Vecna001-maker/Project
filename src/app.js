import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import bodyParser from 'body-parser';




const app = express();

app.use(bodyParser.json());

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));



app.use(express.urlencoded({extended:true,limit:"16kb"}));

app.use(express.static("public"));

app.use(cookieParser());

//routes
import userRouter from './routes/user.routes.js'

app.use('/api/v1/users',userRouter);

export default app;