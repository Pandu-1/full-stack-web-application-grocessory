
import Order from "../models/Order.js"
import Product from "../models/product.js"
import stripe from "stripe"
import User from "../models/User.js"

// stripe Gateway Initialize
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

// Place Order COD : /api/order/cod
export const placeOrderCOD = async(req,res)=>{
    try {
        const {  items , address} = req.body
        const userId = req.userId;
        if(!address || items.length === 0){
            return res.json({success:false,message:"invalid Data"})
        }
        // calculate amount using items
        let amount = await items.reduce(async(acc,item)=>{
            const product = await Product.findById(item.product);
            return (await acc) + product.offerPrice * item.quantity;
        },0)
        // Add tax Charge 2%
        amount += Math.floor(amount * 0.02)
        await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "COD",
        });
        return res.json({success:true,message:"Order Placed Successfully"});
    } catch (error) {
        console.log(error.message);
        return  res.json({success:false,message:error.message})
    }
}

// Place Order stripe : /api/order/stripe
export const placeOrderStripe = async(req,res)=>{
    try {
        const {  items , address} = req.body
        const userId = req.userId;
        const {origin} = req.headers;

        if(!address || items.length === 0){
            return res.json({success:false,message:"invalid Data"})
        }
        let productData = [];
        // calculate amount using items
        let amount = await items.reduce(async(acc,item)=>{
            const product = await Product.findById(item.product);
            productData.push({
                name:product.name,
                price:product.offerPrice,
                quantity:item.quantity
            })
            return (await acc) + product.offerPrice * item.quantity;
        },0)
        // Add tax Charge 2%
        amount += Math.floor(amount * 0.02)
       const order =  await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "Online",
        });
        

        // create line items for stripe
        const line_items = productData.map((item)=>{
            return{
                price_data:{
                    currency: "usd",
                    product_data : {
                        name:item.name
                    },
                    unit_amount:Math.floor(item.price + item.price * 0.02) * 100
                },
                quantity:item.quantity,
            }
        })

        // create session
        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${origin}/loader?next=my-orders`,
            cancel_url: `${origin}/cart`,
            metadata:{
                orderId: order._id.toString(),
                userId,
            }
        })

        return res.json({success:true,url:session.url});
    } catch (error) {
        console.log(error.message);
        return  res.json({success:false,message:error.message})
    }
}

// Stripe Webhooks to verify payment Action :/stripe

export const stripeWebHooks = async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.log("Webhook signature verification failed:", error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        switch (event.type) {

            case "checkout.session.completed": {

                const session = event.data.object;

                const { orderId, userId } = session.metadata;

                await Order.findByIdAndUpdate(orderId, {
                    isPaid: true
                });

                await User.findByIdAndUpdate(userId, {
                    cartItems: {}
                });

                console.log("Order marked as paid:", orderId);

                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });

    } catch (error) {
        console.log("Webhook processing error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get order by User Id : /api/order/user

export const getUserOrders = async(req,res)=>{
    try {
        const userId = req.userId
        const orders = await Order.find({
            userId,
            $or:[{paymentType:"COD"},{isPaid:true}]
        }).populate("items.product address").sort({createdAt: -1});
        res.json({success:true, orders})
    } catch (error) {
        console.log(error.message);
        return  res.json({success:false,message:error.message})
    }
}

// Get All Orders ( for seller / admin ): /api/order/seller

export const getAllOrders = async(req,res)=>{
    try {
        const orders = await Order.find({
        
            $or:[{paymentType:"COD"},{isPaid:true}]
        }).populate("items.product address").sort({createdAt: -1});
        res.json({success:true, orders})
    } catch (error) {
        console.log(error.message);
        return  res.json({success:false,message:error.message})
    }
}