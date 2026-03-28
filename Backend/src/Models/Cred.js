import mongoose, { Schema } from "mongoose";

const credSchema = new Schema({
    _id:{
        type: Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId
    },
    user:{
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    purpose:{
        type: String,
        required: true
    },
    cred:{
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    algo:{
        type: String,
        required: true
    },
    vault:{
        type: Schema.Types.ObjectId,
        ref: "vault",
        required: true
    },
    iv: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: false
    },
    authTag: {
        type: String,
        required: false // required if algo is AES-GCM
    },
    encoding: {
        type: String,
        default: "base64"
    },
    CredStrength:{
        type: String
    },
})

export const cred = mongoose.model("cred", credSchema);