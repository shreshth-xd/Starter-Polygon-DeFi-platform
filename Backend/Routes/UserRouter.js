const express = require("express");
const {signUp, signIn, GetUser, logout} = require("../Controllers/UserControllers");
const router = express.Router();
const {RestrictToLoggedInUsersOnly} = require("../Middlewares/Authentication");

router.get("/getUser", GetUser);
router.post("/sign-up", signUp);
router.post("/sign-in", signIn);
router.get("/verify", RestrictToLoggedInUsersOnly, (req, res)=>{
    return res.status(200).json({"Status":"Verified successfully"})
}) 
router.get("/logout", logout)

module.exports = router;