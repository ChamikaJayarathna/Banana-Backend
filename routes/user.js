import express from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import User from "../models/User.js";
import verifyJWT from '../middleware/verifyJWT.js';

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
        res.status(200).json({ message: "Login successfully",email, token, _id: user._id });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/score', verifyJWT, async (req, res) => {
    const { score, level } = req.body;
  
    try {
      const userId = req.user._id;
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      user.levelScores[level] = (user.levelScores[level] || 0) + score;
      await user.save();
  
      res.status(200).json({ message: "Game Score updated", levelScores: user.levelScores });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
});

router.get('/userdetails', async (req, res) => {
    const mode = req.query.mode;
  
    try {
      const users = await User.find({}, 'username levelScores');
  
      const transformedUsers = users
        .map(user => ({
          username: user.username,
          score: user.levelScores[mode] || 0
        }))
        .filter(user => user.score > 0);
  
      res.status(200).json(transformedUsers);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
});

router.get('/user/:id', verifyJWT, async (req, res) => {

    const { id } = req.params;

    try {
        const user = await User.findById(id, 'username email levelScores profile_img');

        if(!user){
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(user);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }

});

export default router;