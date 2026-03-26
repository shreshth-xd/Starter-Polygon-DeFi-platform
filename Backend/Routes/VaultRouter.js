const express = require("express");
const router = express.Router();
const {GetVaults, CreateVault, DeleteVault, DeleteAllVaults} = require("../Controllers/VaultController")
const {RestrictToLoggedInUsersOnly} = require("../Middlewares/Authentication")

router.get("/getVaults", RestrictToLoggedInUsersOnly, GetVaults);
router.post("/createVault", RestrictToLoggedInUsersOnly, CreateVault);
router.delete("/deleteVault/:id", RestrictToLoggedInUsersOnly, DeleteVault);
router.delete("/deleteAllVaults", RestrictToLoggedInUsersOnly, DeleteAllVaults);


module.exports = router;