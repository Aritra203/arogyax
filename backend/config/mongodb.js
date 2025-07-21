import mongoose from "mongoose";

const connectDB = async () => {
    try {
        // Set connection options
        const options = {
            serverSelectionTimeoutMS: 30000, // 30 seconds timeout
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            retryWrites: true,
        }

        mongoose.connection.on('connected', () => {
            console.log("✅ Database Connected Successfully")
        })

        mongoose.connection.on('error', (err) => {
            console.log("❌ Database connection error:", err.message)
        })

        mongoose.connection.on('disconnected', () => {
            console.log("⚠️ Database disconnected")
        })

        console.log("🔄 Attempting to connect to MongoDB...")
        await mongoose.connect(process.env.MONGODB_URI, options)
        
    } catch (error) {
        console.log("❌ MongoDB connection failed:", error.message)
        
        // Provide helpful suggestions based on error type
        if (error.message.includes('IP')) {
            console.log("💡 Suggestion: Check if your IP is whitelisted in MongoDB Atlas")
        } else if (error.message.includes('authentication')) {
            console.log("💡 Suggestion: Check your MongoDB username/password")
        } else if (error.message.includes('SSL') || error.message.includes('TLS')) {
            console.log("💡 Suggestion: There might be a network/firewall issue")
        }
        
        // Exit process if connection fails
        process.exit(1)
    }
}

export default connectDB;
