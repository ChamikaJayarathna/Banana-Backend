import express from "express";
import mongoose from "mongoose";
import cors from 'cors';
import 'dotenv/config';
import userRoutes from './routes/user.js';
import questionRoutes from './routes/question.js';

const app = express();
let PORT = 3000;

mongoose.connect(process.env.MY_DB_LOCATION)
.then(() => {
    console.log("Connected to MongoDB");
})
.catch(err => {
    console.log(err);
})

app.use(express.json());
app.use(cors());

app.use('/api', userRoutes);
app.use('/api', questionRoutes);


app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
});