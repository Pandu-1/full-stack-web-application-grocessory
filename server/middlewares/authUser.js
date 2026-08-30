import express from "express";
import jwt from "jsonwebtoken";



// ekkada middleware frst request ni check chestundhi okavle login or register route hit cheyalanukunte frst middle ware ni dhaatukoni route hit avutundhi
const authUser = async (req,res,next)=>{
    const {token}  = req.cookies;
    if(!token){ 
        return res.json({success:false,message:"not authorized"})
    }
    try {
        const tokenDecode = jwt.verify(token,process.env.JWT_SECRET);
        if(tokenDecode.id){
            req.userId = tokenDecode.id;
        }
        else{
            return res.json({success:false,message:"not authorized"});
        }
        next()
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

export default authUser