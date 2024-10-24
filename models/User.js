import mongoose from "mongoose";

let profile_imgs_name_list = ["bulging", "dizzy", "eva", "frame1", "frame2", "glow", "happy", "hearts", "robocop", "robocop", "roundFrame01", "roundFrame02", "sensor", "shade01"];
let profile_imgs_collections_list = ["bottts-neutral"];

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        default: 0
    },
    profile_img:{
        type:String,
        default: () => {
            return `https://api.dicebear.com/9.x/${profile_imgs_collections_list[Math.floor(Math.random() * profile_imgs_collections_list.length)]}/svg?seed=${profile_imgs_name_list[Math.floor(Math.random() * profile_imgs_name_list.length)]}`
        }
    }
});


export default mongoose.model('user', UserSchema)