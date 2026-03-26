const {User} = require("../Models/User.mjs")
const bcrypt = require("bcrypt")
const crypto = require("crypto")

async function verifyPasswordMiddleware(req, res, next) {
    try{
        const { password } = req.body;
        const user = await User.findById(req.user.id);
    
        const passwordCorrect = await bcrypt.compare(password, user.password);
        if (!passwordCorrect) {
            return res.status(401).json({ error: "Invalid master password" });
        }
    
        req.encryptionKey = crypto.pbkdf2Sync(password, user.salt, 100000, 32, "sha256");
    
        next();
    
        // must be cleaned up after request
        req.encryptionKey = undefined;
    }catch(error){
        console.log(error)
        return res.status(401).json({"Status":"Something went wrong"})
    }
}

module.exports = {verifyPasswordMiddleware}