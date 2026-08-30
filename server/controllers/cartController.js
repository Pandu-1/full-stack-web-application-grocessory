import User from "../models/User.js"

// Update user CartData : /api/cart/update



export const updateCart = async(req,res)=>{
    try {
        const {cartItems} = req.body;
        await User.findByIdAndUpdate(req.userId,{cartItems})
        res.json({success:true,message:"cart Updated"})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}



