import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
    try {
       
        await mongoose.connect(`${process.env.MONGODB_URI}/greencart`);

        console.log("MongoDB connected successfully");
    } 
    catch (error) {
        console.error("MongoDB Error:", error.message);
    }
};

export default connectDB;