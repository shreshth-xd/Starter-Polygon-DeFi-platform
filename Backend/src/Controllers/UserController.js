const path = require("node:path")
const {User} = require("../Models/User.mjs")
const {setUser, getUser} = require("../Services/JWTAuth")
const bcrypt = require("bcrypt")
const crypto = require("crypto")

async function GetUser(req, res){
    const token = req.cookies?.JWT_token;
    try{
        const user = getUser(token);
        return res.status(200).json({"username":user.username,"Status":"User fetched successfully"})
    }catch(error){
        return res.status(500).json({"Status":"Something went wrong"})
    }
}

async function signUp(req, res){
    const {username, email, password} = req.body;
    const KdfSalt = crypto.randomBytes(32);
    let user = User.findOne({username, email, password: hashedPassword})
    if(user){
        return res.status(409).json({"Status":"User already exists"})
    }
    try{
        const hashedPassword = await bcrypt.hash(password, 10)
        let newUser = new User({username, salt:KdfSalt, email, password: hashedPassword})
        await newUser.save()
        return res.status(200).json({"Status": "User created successfully"})
    }catch(error){
        console.log(error)
        return res.json({"Status":error})
    }
}

async function signIn(req, res){
    try{
        const {username, password} = req.body;
        let user = await User.findOne({username})
        if(!user || !(await bcrypt.compare(password, user.password))){
            return res.status(404).json({"Status":"Invalid username or password"})
        }else{
            const token = setUser({_id: user._id, username: user.username})
            res.cookie("JWT_token", token, {
                maxAge: 15 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                sameSite: "lax",
                secure: false,
                path: "/"
            })
            req.user = token;
            return res.status(200).json({"Status":"Signed in successfully"})
        }
    }catch(error){
        console.log(error)
        return res.json({"Error: ":error})
    }
}

async function logout(req,res){
    try{
        res.clearCookie("JWT_token", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
        })
        return res.status(200).json({"Status":"Logged out the user successfully"})
    }catch(error){
        return res.status(401).json({"Status":"Something went wrong"})
    }
}



module.exports = {
    signUp, signIn, GetUser, logout
}