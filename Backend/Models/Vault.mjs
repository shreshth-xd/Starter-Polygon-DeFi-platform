import mongoose, { Schema } from "mongoose";

const vaultSchema = new Schema({
    _id:{
        type: Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId
    },
    name:{
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    creds:[{
        type: Schema.Types.ObjectId,
        ref: "cred",
        required: "true"
    }],
    VaultStrength:{
        type: String,        
    },
}, {timestamps: true})

vaultSchema.index({ name: 1, user: 1 }, { unique: true });

export const Vault = mongoose.model("vault", vaultSchema);