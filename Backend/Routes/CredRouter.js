const express = require("express");
const router = express.Router();
const {EncryptCreds, GetCreds, DecryptCred, CreateCred, DeleteCred, DeleteCreds} = require("../Controllers/CredController");
const {RestrictToLoggedInUsersOnly} = require("../Middlewares/Authentication")
const {verifyPasswordMiddleware} = require("../Middlewares/KdfDerivation")

router.post("/encryptCreds", RestrictToLoggedInUsersOnly, verifyPasswordMiddleware, EncryptCreds);
router.post("/GetCreds", RestrictToLoggedInUsersOnly, GetCreds);
router.post("/decryptCred", RestrictToLoggedInUsersOnly, DecryptCred);
router.post("/createCred", RestrictToLoggedInUsersOnly, CreateCred);
router.delete("/deleteCred", RestrictToLoggedInUsersOnly, DeleteCred);
router.delete("/deleteCreds", RestrictToLoggedInUsersOnly, DeleteCreds);
module.exports = router;