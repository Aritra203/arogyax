import express from "express"
import cors from 'cors'
import 'dotenv/config'
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import adminRouter from "./routes/adminRoute.js"
import staffRouter from "./routes/staffRoute.js"
import inventoryRouter from "./routes/inventoryRoute.js"
import billingRouter from "./routes/billingRoute.js"
import admissionRouter from "./routes/admissionRoute.js"
import reportsRouter from "./routes/reportsRoute.js"
import prescriptionRouter from "./routes/prescriptionRoute.js"
import telemedicineRouter from "./routes/telemedicineRoute.js"

// app config
const app = express()
const port = process.env.PORT || 4000

// Debug: Check if environment variables are loaded
console.log('Environment check:')
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL)
console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? 'Set' : 'Not set')
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set')

connectDB()
connectCloudinary()

// middlewares
app.use(express.json())

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        console.log('CORS request from origin:', origin);
        
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:5173',  // Admin panel local
            'http://localhost:5174',  // Frontend local  
            'http://localhost:5175',  // Frontend local (new port)
            'http://localhost:5176',  // Admin panel local (new port)
            'https://arogyax.vercel.app',  // Frontend production
            'https://arogyax-admin.vercel.app',  // Admin panel production
            'https://arogya-x-admin.vercel.app',  // Alternative admin domain
            'https://arogya-x.vercel.app',  // Alternative frontend domain
            'https://arogyax-frontend.vercel.app',  // Alternative frontend domain
            'https://arogyax-admin.onrender.com',  // Admin on Render
            'https://arogya-x-backend.onrender.com',  // Backend on Render
            'https://arogyax-frontend.onrender.com',  // Frontend on Render
            // Add more Vercel variations
            'https://arogyax-git-main.vercel.app',
            'https://arogyax-aritra203.vercel.app'
        ];
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            console.log('✅ Origin allowed (in allowedOrigins):', origin);
            return callback(null, true);
        }
        
        // Allow any Vercel deployment of arogyax
        if (origin && (origin.includes('arogyax') || origin.includes('arogya-x')) && origin.includes('vercel.app')) {
            console.log('✅ Origin allowed (Vercel arogyax):', origin);
            return callback(null, true);
        }
        
        // For development, allow localhost on any port
        if (origin && origin.includes('localhost')) {
            console.log('✅ Origin allowed (localhost):', origin);
            return callback(null, true);
        }
        
        console.log('❌ Origin blocked:', origin);
        return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,  // Allow credentials (cookies, authorization headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token', 'dtoken', 'atoken', 'aToken'],
    optionsSuccessStatus: 200  // For legacy browser support
}

app.use(cors(corsOptions))

// api endpoints
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/doctor", doctorRouter)
app.use("/api/staff", staffRouter)
app.use("/api/inventory", inventoryRouter)
app.use("/api/billing", billingRouter)
app.use("/api/admission", admissionRouter)
app.use("/api/reports", reportsRouter)
app.use("/api/prescription", prescriptionRouter)
app.use("/api/telemedicine", telemedicineRouter)

app.get("/", (req, res) => {
  res.send("API Working")
});

// Health check endpoint for CORS testing
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running and CORS is configured",
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'No origin header'
  });
});

app.listen(port, () => console.log(`Server started on PORT:${port}`))