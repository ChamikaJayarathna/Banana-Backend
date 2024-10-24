import express from "express";
import bcryt from 'bcrypt';
import User from "../models/User.js";

const router = express.Router();

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if(username.length < 5){
        return res.status(403).json({"error": "Username must be at least 5 letters long"})
    }

    if(!email.length){
        return res.status(403).json({"error": "Enter Email"});
    }

    if(!emailRegex.test(email)){
        return res.status(403).json({"error": "Email is invalid"});
    }

    if(!passwordRegex.test(password)){
        return res.status(403).json({"error": "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters"});
    }

    const hashpassword = await bcryt.hash(password, 10); 

    const newUser = new User({
        username,
        email,
        password: hashpassword
    })

    await newUser.save()
    .then((user) => {
        return res.status(200).json(user);
    })
    .catch(err => {
        return res.status(500).json({"error" : err.message});
    })
});

export default router;