const mongoose = require("mongoose");
const crypto = require("crypto");
const {getUser} = require("../Services/JWTAuth")
const bcrypt = require("bcrypt")

const {User} = require("../Models/User.mjs")
const {Vault} = require("../Models/Vault.mjs")
const {cred} = require("../Models/Cred.mjs")

function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(
        password,
        salt,
        100000,     
        32,         
        "sha256"
    );
}


// AES-256-GCM encryption
function encryptAES(value, key) {
    const iv = crypto.randomBytes(12); 
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(value, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return {
        encrypted,
        iv: iv.toString("hex"),
        authTag
    };
}

// AES-256-CBC encryption
function encryptAES_CBC(value, key) {
    const iv = crypto.randomBytes(16); // CBC requires 16-byte IV
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encrypted = cipher.update(value, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
        encrypted,
        iv: iv.toString("hex"),
        authTag: "" // CBC doesn't use authTag
    };
}

// ChaCha20-Poly1305 encryption
function encryptChaCha20(value, key) {
    const iv = crypto.randomBytes(12); // ChaCha20-Poly1305 uses 12-byte nonce
    const cipher = crypto.createCipheriv("chacha20-poly1305", key, iv);

    let encrypted = cipher.update(value, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return {
        encrypted,
        iv: iv.toString("hex"),
        authTag
    };
}

// Twofish encryption (requires 'twofish' npm package)
function encryptTwofish(value, key) {
    try {
        // Note: This requires the 'twofish' npm package
        // Install with: npm install twofish
        const twofish = require('twofish');
        const iv = crypto.randomBytes(16);
        
        // Twofish uses 128-bit (16-byte) or 256-bit (32-byte) keys
        // We'll use the first 32 bytes of our derived key
        const twofishKey = key.slice(0, 32);
        const cipher = twofish.createCipheriv(twofishKey, iv);
        
        let encrypted = cipher.update(value, "utf8", "hex");
        encrypted += cipher.final("hex");

        return {
            encrypted,
            iv: iv.toString("hex"),
            authTag: "" // Twofish in CBC mode doesn't use authTag
        };
    } catch (error) {
        throw new Error("Twofish encryption requires 'twofish' npm package. Install with: npm install twofish");
    }
}

// Camellia encryption (Note: Node.js doesn't natively support Camellia)
// This would require an external library, which may not be readily available
function encryptCamellia(value, key) {
    // Camellia is not natively supported in Node.js crypto
    // This would require a third-party library
    // For now, we'll throw an error indicating it's not implemented
    throw new Error("Camellia encryption is not natively supported in Node.js. A third-party library would be required.");
}



async function EncryptCreds(req, res){
    try {
        const { password, creds } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: "Password is required" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const passwordCorrect = await bcrypt.compare(password, user.password);
        if (!passwordCorrect) {
            return res.status(401).json({ error: "Invalid master password" });
        }

        const encryptionKey = deriveKey(password, user.salt);
        const credsArray = Array.isArray(creds) ? creds : [creds];
        
        // Encrypt each credential based on selected algorithm
        const encryptedCreds = credsArray.map(item => {
            let encrypted, iv, authTag, algo;
            
            switch(item.Algorithm) {
                case "AES-256-GCM":
                case "AES-256": // Backward compatibility
                    const aesResult = encryptAES(item.Value, encryptionKey);
                    encrypted = aesResult.encrypted;
                    iv = aesResult.iv;
                    authTag = aesResult.authTag;
                    algo = "aes-256-gcm";
                    break;
                    
                case "AES-256-CBC":
                    const cbcResult = encryptAES_CBC(item.Value, encryptionKey);
                    encrypted = cbcResult.encrypted;
                    iv = cbcResult.iv;
                    authTag = cbcResult.authTag;
                    algo = "aes-256-cbc";
                    break;
                    
                case "ChaCha20-Poly1305":
                    const chachaResult = encryptChaCha20(item.Value, encryptionKey);
                    encrypted = chachaResult.encrypted;
                    iv = chachaResult.iv;
                    authTag = chachaResult.authTag;
                    algo = "chacha20-poly1305";
                    break;
                    
                case "Twofish":
                    const twofishResult = encryptTwofish(item.Value, encryptionKey);
                    encrypted = twofishResult.encrypted;
                    iv = twofishResult.iv;
                    authTag = twofishResult.authTag;
                    algo = "twofish";
                    break;
                    
                case "Camellia":
                    const camelliaResult = encryptCamellia(item.Value, encryptionKey);
                    encrypted = camelliaResult.encrypted;
                    iv = camelliaResult.iv;
                    authTag = camelliaResult.authTag;
                    algo = "camellia";
                    break;
                    
                default:
                    throw new Error(`Unsupported algorithm: ${item.Algorithm}`);
            }
            
            return {
                user: req.user.id,
                purpose: item.Name,
                algo: algo,
                cred: encrypted,
                iv,
                authTag
                // vault will be set when creating the vault in CreateVault controller
            };
        });

        return res.status(201).json({ Creds: encryptedCreds, message: "Encrypted and stored!" });
    } catch (error) {
        console.error("Encryption error:", error);
        return res.status(500).json({ error: "Encryption failed", details: error.message });
    }
}



async function DecryptCred(req, res){
    try {
        const { password, credId } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: "Password is required" });
        }

        if (!credId) {
            return res.status(400).json({ error: "Credential ID is required" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Verify password
        const passwordCorrect = await bcrypt.compare(password, user.password);
        if (!passwordCorrect) {
            return res.status(401).json({ error: "Invalid master password" });
        }

        // Derive decryption key using user's salt
        const decryptionKey = deriveKey(password, user.salt);

        // Find the credential in database
        const credential = await cred.findById(credId);
        if (!credential) {
            return res.status(404).json({ error: "Credential not found" });
        }


        if (credential.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: "Unauthorized access to credential" });
        }

        // Decrypt based on algorithm
        let decrypted;
        
        switch(credential.algo.toLowerCase()) {
            case "aes-256-gcm":
            case "aes-256": // Backward compatibility
                const decipherGCM = crypto.createDecipheriv(
                    "aes-256-gcm",
                    decryptionKey,
                    Buffer.from(credential.iv, "hex")
                );
                decipherGCM.setAuthTag(Buffer.from(credential.authTag, "hex"));
                decrypted = decipherGCM.update(credential.cred, "hex", "utf8");
                decrypted += decipherGCM.final("utf8");
                break;
                
            case "aes-256-cbc":
                const decipherCBC = crypto.createDecipheriv(
                    "aes-256-cbc",
                    decryptionKey,
                    Buffer.from(credential.iv, "hex")
                );
                decrypted = decipherCBC.update(credential.cred, "hex", "utf8");
                decrypted += decipherCBC.final("utf8");
                break;
                
            case "chacha20-poly1305":
                const decipherChaCha = crypto.createDecipheriv(
                    "chacha20-poly1305",
                    decryptionKey,
                    Buffer.from(credential.iv, "hex")
                );
                decipherChaCha.setAuthTag(Buffer.from(credential.authTag, "hex"));
                decrypted = decipherChaCha.update(credential.cred, "hex", "utf8");
                decrypted += decipherChaCha.final("utf8");
                break;
                
            case "twofish":
                try {
                    // Note: This always requires the 'twofish' npm package
                    const twofish = require('twofish');
                    const twofishKey = decryptionKey.slice(0, 32);
                    const decipherTwofish = twofish.createDecipheriv(
                        twofishKey,
                        Buffer.from(credential.iv, "hex")
                    );
                    decrypted = decipherTwofish.update(credential.cred, "hex", "utf8");
                    decrypted += decipherTwofish.final("utf8");
                } catch (error) {
                    return res.status(500).json({ 
                        error: "Twofish decryption requires 'twofish' npm package. Install with: npm install twofish" 
                    });
                }
                break;
                
            case "camellia":
                return res.status(500).json({ 
                    error: "Camellia decryption is not natively supported in Node.js. A third-party library would be required." 
                });
                
            // default:
            //     // For non-encrypted credentials or unknown algorithms, return as-is
            //     return res.status(200).json({ 
            //         decryptedValue: credential.cred,
            //         purpose: credential.purpose,
            //         message: "Credential retrieved" 
            //     });
        }

        return res.status(200).json({ 
            decryptedValue: decrypted,
            purpose: credential.purpose,
            message: "Decryption successful" 
        });
    } catch (error) {
        console.error("Decryption error:", error);
        if (error.message.includes("Unsupported state") || error.message.includes("bad decrypt")) {
            return res.status(400).json({ error: "Decryption failed - invalid password or corrupted data" });
        }
        return res.status(500).json({ error: "Decryption failed", details: error.message });
    }
}






async function CreateCred(req, res){
    try {
        const { password, purpose, value, algorithm, vaultId } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: "Password is required" });
        }
        
        if (!purpose || !value || !algorithm || !vaultId) {
            return res.status(400).json({ error: "Purpose, value, algorithm, and vaultId are required" });
        }

        // Fetch user from database
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Verify password
        const passwordCorrect = await bcrypt.compare(password, user.password);
        if (!passwordCorrect) {
            return res.status(401).json({ error: "Invalid master password" });
        }

        // Derive encryption key using user's salt
        const encryptionKey = deriveKey(password, user.salt);

        // Encrypt the credential based on algorithm
        let encrypted, iv, authTag, algo;
        
        switch(algorithm) {
            case "AES-256-GCM":
            case "AES-256": // Backward compatibility
                const aesResult = encryptAES(value, encryptionKey);
                encrypted = aesResult.encrypted;
                iv = aesResult.iv;
                authTag = aesResult.authTag;
                algo = "aes-256-gcm";
                break;
                
            case "AES-256-CBC":
                const cbcResult = encryptAES_CBC(value, encryptionKey);
                encrypted = cbcResult.encrypted;
                iv = cbcResult.iv;
                authTag = cbcResult.authTag;
                algo = "aes-256-cbc";
                break;
                
            case "ChaCha20-Poly1305":
                const chachaResult = encryptChaCha20(value, encryptionKey);
                encrypted = chachaResult.encrypted;
                iv = chachaResult.iv;
                authTag = chachaResult.authTag;
                algo = "chacha20-poly1305";
                break;
                
            case "Twofish":
                const twofishResult = encryptTwofish(value, encryptionKey);
                encrypted = twofishResult.encrypted;
                iv = twofishResult.iv;
                authTag = twofishResult.authTag;
                algo = "twofish";
                break;
                
            default:
                return res.status(400).json({ error: `Unsupported algorithm: ${algorithm}` });
        }

        // Verify vault exists and belongs to user
        const {Vault} = require("../Models/Vault.mjs");
        const vault = await Vault.findById(vaultId);
        if (!vault) {
            return res.status(404).json({ error: "Vault not found" });
        }
        if (vault.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: "Unauthorized access to vault" });
        }

        // Create the credential
        const newCred = await cred.create({
            user: req.user.id,
            purpose: purpose,
            algo: algo,
            cred: encrypted,
            iv: iv,
            authTag: authTag,
            vault: vaultId
        });

        // Update vault's creds array
        vault.creds.push(newCred._id);
        await vault.save();

        return res.status(201).json({ 
            cred: newCred,
            message: "Credential created successfully" 
        });
    } catch (error) {
        console.error("Create credential error:", error);
        return res.status(500).json({ error: "Failed to create credential", details: error.message });
    }
}

async function GetCreds(req,res){
    const token = req.cookies?.JWT_token;
    
    const user_id = req.user.id;
    const vault_id = req.body.id;


    try{
        const creds = await cred.find({
            user: mongoose.Types.ObjectId.createFromHexString(user_id), 
            vault: mongoose.Types.ObjectId.createFromHexString(vault_id)
        })
        
        if(creds.length===0){
            return res.status(404).json({creds: [], "Status":"No creds found here"})
        }else{
            return res.status(200).json({creds, "Status":"Successfully found all the creds"})
        }
    }catch(error){
        console.log(error)
    }
}

async function DeleteCred(req, res){
    const credId = req.body.credId;
    const vaultId = req.body.vaultId;

    await cred.deleteOne({_id: credId});
    const vault = await Vault.find({_id: vaultId});
    // console.log(vault.creds)
    vault.creds = vault.creds.filter((cred) => cred.toString()!==credId)
    await vault.save();

    return res.status(200).json({"Status":"Credential deleted successfully"});
}

async function DeleteCreds(req, res){

    const vaultId = req.body.vaultId;
    const vault = await Vault.findOne({_id: vaultId})
    const creds = vault.creds;

    for (const cred of creds){
        await cred.deleteOne({_id: cred._id})
    }
    await Vault.deleteOne({_id: vaultId})

    const userId = req.user.id;
    const user = await User.findOne({_id: userId});
    user.vaults = user.vaults.filter((vault) => vault.toString()!=vaultId)       
    await user.save();

    return res.status(200).json({"Status":"All the creds were deleted succesfully."});
}

module.exports = {EncryptCreds, GetCreds, DecryptCred, CreateCred, DeleteCred, DeleteCreds};