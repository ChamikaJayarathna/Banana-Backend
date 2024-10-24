import express from "express";
import mongoose from "mongoose";
import 'dotenv/config';
import userRoutes from './routes/user.js';

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


app.use('/api', userRoutes);


app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
});