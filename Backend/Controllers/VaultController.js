const path = require("node:path");
const {Vault} = require("../Models/Vault.mjs")
const {User} = require("../Models/User.mjs")
const {cred} = require("../Models/Cred.mjs")
const jwt = require("jsonwebtoken")
const {getUser} = require("../Services/JWTAuth")
const crypto = require("crypto");


// Devise a way to write a controller to create a vault in such a way that it 
// returns all the vaults created by that specified user only:
async function GetVaults(req, res){
    const token = req.cookies?.JWT_token;
    if(!token){
        return res.status(401).json({"Status":"JWT token not found"});
    }

    try{
        const decoded = getUser(token);
        const vaults = await Vault.find({ user: decoded.id });

        if(vaults.length === 0){
            return res.status(200).json({ vaults: [], Status: "No vaults found here" });
        } else {
            return res.status(200).json({ vaults, Status: "Successfully fetched the vaults" });
        }
    } catch(error){
        return res.status(500).json({ Status: error.message || error.toString() });
    }
}



async function CreateVault(req, res){
    const token = req.cookies?.JWT_token;
    const {vault, creds} = req.body;
    const decoded = getUser(token)

    try{
        const NewVault = new Vault({name: vault, user: decoded.id})
        await NewVault.save()        

        // creds are already encrypted and have the structure: { purpose, cred, iv, authTag, algo, vault }
        const NewCreds = await Promise.all(
            creds.map(async (credential)=>{
                return await cred.create({
                    purpose: credential.purpose,
                    cred: credential.cred,
                    user: credential.user || decoded.id,
                    algo: credential.algo,
                    iv: credential.iv,
                    authTag: credential.authTag,
                    vault: NewVault._id // Use the new vault ID
                })
            })
        )

        NewVault.creds = NewCreds.map((credential) => credential._id);
        await NewVault.save()
        
        await User.findByIdAndUpdate(decoded.id, {
            $push: {vaults: NewVault._id}
        })

        res.status(200).json({"Status":"The vault was created successfully", vault: NewVault})

    }catch(error){
        console.log(error)
        res.status(401).json({"Status":"Something went wrong"})
    }
}



// To delete the specified vaults from the database:
async function DeleteVault(req, res){
    try{
        const VaultId = req.params.id;
        await cred.deleteMany({ vault: VaultId });
        await Vault.findByIdAndDelete(VaultId);
        
        const userId = req.user.id;
        const user = await User.findOne({_id: userId});
        user.vaults = user.vaults.filter((vault) => vault.toString()!=VaultId);
        await user.save();

        res.status(200).json({"Status":"Vault deleted successfully"})
    }catch(error){
        res.status(401).json({"Status":"Something went wrong"})
    }
}


// To delete all the present vaults with a single click
async function DeleteAllVaults(req, res){
    try{
        const userId = req.user.id;
        const Vaults = await Vault.find({user: userId})
        
        for (const node of Vaults) {
            await cred.deleteMany({ vault: node._id });
            await Vault.findByIdAndDelete(node._id);
        }
        
        await User.findByIdAndUpdate(userId, {
            $set: { vaults: [] }
        })
        
        res.status(200).json({"Status":"Deleted all the vaults successfully"})
    }catch(error){
        // console.log(error)
        res.status(401).json({"Status": "Something went wrong"})
    }
}

module.exports = {GetVaults, CreateVault, DeleteVault, DeleteAllVaults}