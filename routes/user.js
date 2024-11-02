import express from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import User from "../models/User.js";
import VefifyAuth from '../middleware/verifyJWT.js';

const router = express.Router();

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

const createToken = (_id) => {
    return jwt.sign({_id}, process.env.MY_SECRET_KEY, {expiresIn: '5d'});
}

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

    const hashpassword = await bcrypt.hash(password, 10); 

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

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(403).json({ "error": "Email not found" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(403).json({ "error": "Invalid Password" });
        }

        const token = createToken(user._id);
        res.status(200).json({ message: "Login successfully",email, token });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/score', VefifyAuth, async (req, res, ) => {

    const user_id = req.body._id;
    const { score } = req.body;

    try {
        const user = await User.findById(user_id);

        if(!user){
            return res.status(404).json({ error: "User not found" });
        }

        user.score = parseInt(score);
        await user.save();

        res.status(200).json({ message: "Game Score updated", score: user.score });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }

});

export default router;