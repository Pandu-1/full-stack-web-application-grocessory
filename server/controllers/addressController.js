import Address from "../models/Address.js";

// Add Address : /api/address/add

export const addAddress = async(req,res)=>{
    try {
        const { address } = req.body
        await Address.create({...address,userId:req.userId})
        res.json({success:true,message:"address added successfully"})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
        
    }
}

// Get Address : /api/address/get

export const getAddress = async(req,res)=>{
    try {
        const userId = req.userId
        const addresses = await Address.find({userId})
        res.json({success:true,addresses})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}