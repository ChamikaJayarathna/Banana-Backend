import mongoose from "mongoose";

const QuestSchema = new mongoose.Schema({
    question: String,
    solution: Number
}, {timestamps: true});

export default mongoose.model('question', QuestSchema);
