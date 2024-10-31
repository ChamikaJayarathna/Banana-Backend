import express from "express";
import axios from "axios";
import Question from '../models/Question.js';

const router = express.Router();

router.get('/quiz', async (req, res) => {
    try {

        const response = await axios.get('https://marcconrad.com/uob/banana/api.php?out=json');
        const { question, solution } = response.data;

        const newQuestion = new Question({
            question,
            solution
        });

        await newQuestion.save();
        res.json(newQuestion);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error" });
    }
});

export default router;