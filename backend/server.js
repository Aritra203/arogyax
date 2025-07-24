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
app.use(cors())

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

app.get("/", (req, res) => {
  res.send("API Working")
});

app.listen(port, () => console.log(`Server started on PORT:${port}`))