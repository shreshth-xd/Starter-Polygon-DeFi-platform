// .mjs as I preferred to use Ecmascript to define schemas
import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema({
    _id:{
        type: Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true,
        minLength:8
    },
    // For key derivation:
    salt:{
        type: String,
        required: true        
    },
    vaults:[{
        type: Schema.Types.ObjectId,
        ref: "vault"
    }]
}, {timestamps: true})

export const User = mongoose.model("user", userSchema);