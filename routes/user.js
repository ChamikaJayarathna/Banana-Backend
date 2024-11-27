import express from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import nodemailer from 'nodemailer';
import User from "../models/User.js";
import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

const createToken = (_id) => {
    return jwt.sign({_id}, process.env.MY_SECRET_KEY, {expiresIn: '5d'});
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MY_GMAIL_ACCOUNT,
        pass: process.env.MY_GMAIL_PASSWORD
    }
});

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

router.post('/forgot-password', async (req, res) => {

    const { email } = req.body;

    try {
        
        const user = await User.findOne({"email" : email });

        if (!user){
            return res.status(404).json({ error : "Email not found" });
        }

        const resetToken = jwt.sign({ id: user._id }, process.env.MY_SECRET_KEY, { expiresIn: "15m" });
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: {
                name: "Password Reset",
                address: process.env.MY_GMAIL_ACCOUNT
            },
            to: email,
            subject: "Reset Password",
            text: `Please click on the link to reset your password: ${resetLink}`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Password reset link sent" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});

router.post('/reset-password-verify', (req, res) => {

    const { token } = req.body;

    jwt.verify(token, process.env.MY_SECRET_KEY, (err, decoded) => {
        if (err){
            return res.status(403).json({ error: "Access token is invalid" });
        }
        else {
            res.status(200).json({ data: "Access token is valid" });
        }
    });
});

router.post('/reset-password', async (req, res) => {

    const { token, newPassword } = req.body;

    if(!passwordRegex.test(newPassword)){
        return res.status(403).json({ error: "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters" });
    }

    try {
        const decoded = jwt.verify(token, process.env.MY_SECRET_KEY);

        const user = await User.findOne({_id: decoded.id});

        if(!user){
            return res.status(404).json({ error: "User not found" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.findOneAndUpdate({ _id: decoded.id }, { "password": hashedPassword });

        res.status(200).json({ status: "Password has been reset successfully" });

    } catch (error) {
        console.log(error);
        return res.status(403).json({ error: "Invalid or expired token" });
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