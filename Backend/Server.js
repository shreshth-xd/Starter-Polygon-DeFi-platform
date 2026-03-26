// Libraries and middlewares
const dotenv = require("dotenv").config();
const express = require("express");
const path = require("node:path");
const fs = require("node:fs");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser")
const {RestrictToLoggedInUsersOnly} = require("./Middlewares/Authentication")

// DB Schemas
const {User} = require("./Models/User.mjs");
const vault = require("./Models/Vault.mjs");
const cred = require("./Models/Cred.mjs");


// Connecting to VaultDB
async function connectDB(){
    try{
        const connection = await mongoose.connect("mongodb://localhost:27017/VaultboxDB");
        console.log("Connection with VaultboxDB is made successfully")
    }catch(error){
        console.log(error)
    }
}
connectDB();

// Constants
const port = 3000;
const publicDir = path.join(__dirname, "Frontend/dist");


// Routes
const userRoute = require("./Routers/UsersRouter")
const vaultRoute = require("./Routers/VaultRouter")
const credRoute = require("./Routers/CredRouter")


// Applying middlewares, routes and dotenv config
app.use(cookieParser())
app.use(express.static("public")) // Accesing Public folder
app.use(express.json());
app.use(cors({origin: "http://localhost:5173", credentials: true}));
app.use("/user", userRoute);
app.use("/vault", vaultRoute);
app.use("/cred", credRoute);


app.get("/", (req, res)=>{
    res.sendFile("index.html", {root: publicDir})
})



app.get("/app", (req, res)=>{
    res.sendFile("index.html", {root: publicDir})
})


app.listen(port, ()=>{
    console.log(`App listening on PORT:${port}`)
})