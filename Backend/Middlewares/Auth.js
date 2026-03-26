const {getUser} = require("../Services/JWTAuth")

async function RestrictToLoggedInUsersOnly(req, res, next){
    const token = req.cookies?.JWT_token;
    if(!token) return res.status(404).json({"Status":"User not found"})
    
    try{
        let decodedPayload = getUser(token)
        req.user = decodedPayload;
        next()
    }catch(error){
        console.log(error)
        return res.status(403).json({"Status":"Invalid or expired token"})
    }
}


module.exports = {RestrictToLoggedInUsersOnly}