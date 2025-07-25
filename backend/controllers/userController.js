import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import mongoose from "mongoose";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import billingModel from "../models/billingModel.js";
import { v2 as cloudinary } from 'cloudinary'
import stripe from "stripe";
import razorpay from 'razorpay';

// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

// Temporarily disable Razorpay to test reports
// const razorpayInstance = new razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET,
// })

// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, email, password } = req.body;

        // checking for all data to register user
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword,
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to login user
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {

    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update user profile
const updateProfile = async (req, res) => {

    try {

        const { 
            userId, name, phone, address, dob, gender, 
            emergencyContact, governmentId, medicalHistory, 
            currentMedications, insurance, referral, 
            bloodType, height, weight, occupation, maritalStatus,
            currentMedicationsText
        } = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Basic data missing (name, phone, dob, gender)" })
        }

        // Prepare update data
        const updateData = {
            name, 
            phone, 
            address: address ? JSON.parse(address) : undefined, 
            dob, 
            gender,
            bloodType: bloodType || '',
            height: height || '',
            weight: weight || '',
            occupation: occupation || '',
            maritalStatus: maritalStatus || '',
            currentMedicationsText: currentMedicationsText || '',
            updatedAt: new Date()
        }

        // Parse JSON fields if they exist
        if (emergencyContact) {
            updateData.emergencyContact = JSON.parse(emergencyContact)
        }
        
        if (governmentId) {
            updateData.governmentId = JSON.parse(governmentId)
        }
        
        if (medicalHistory) {
            updateData.medicalHistory = JSON.parse(medicalHistory)
        }
        
        if (currentMedications) {
            updateData.currentMedications = JSON.parse(currentMedications)
        }
        
        if (insurance) {
            updateData.insurance = JSON.parse(insurance)
        }
        
        if (referral) {
            updateData.referral = JSON.parse(referral)
        }

        // Update user profile
        await userModel.findByIdAndUpdate(userId, updateData)

        if (imageFile) {
            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageURL })
        }

        res.json({ success: true, message: 'Profile Updated Successfully' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to book appointment 
const bookAppointment = async (req, res) => {

    try {

        const { userId, docId, slotDate, slotTime } = req.body

        console.log('Book appointment request:', { userId, docId, slotDate, slotTime });

        if (!userId || !docId || !slotDate || !slotTime) {
            return res.json({ success: false, message: 'Missing required fields' })
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.json({ success: false, message: 'Invalid User ID format' })
        }

        if (!mongoose.Types.ObjectId.isValid(docId)) {
            return res.json({ success: false, message: 'Invalid Doctor ID format' })
        }

        const docData = await doctorModel.findById(docId).select("-password")

        if (!docData) {
            return res.json({ success: false, message: 'Doctor Not Found' })
        }

        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' })
        }

        let slots_booked = docData.slots_booked

        // checking for slot availablity 
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: 'Slot Not Available' })
            }
            else {
                slots_booked[slotDate].push(slotTime)
            }
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select("-password")

        console.log('Retrieved userData:', userData);

        if (!userData) {
            console.log('User not found with ID:', userId);
            
            // Try to find any user with this ID to debug
            const userExists = await userModel.findById(userId);
            console.log('Raw user query result:', userExists);
            
            // Also try to count users to see if there are any users in the database
            const userCount = await userModel.countDocuments();
            console.log('Total users in database:', userCount);
            
            return res.json({ success: false, message: 'User not found' })
        }

        // Additional validation to ensure userData has required fields
        if (!userData.name || !userData.email) {
            console.log('User data is incomplete:', userData);
            return res.json({ success: false, message: 'User data is incomplete' })
        }

        delete docData.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        console.log('About to create appointment with data:', appointmentData);

        // Additional validation before creating appointment
        if (!appointmentData.userData || typeof appointmentData.userData !== 'object') {
            console.log('Invalid userData in appointmentData:', appointmentData.userData);
            return res.json({ success: false, message: 'Invalid user data for appointment' })
        }

        const newAppointment = new appointmentModel(appointmentData)
        
        console.log('Appointment model created, about to save...');
        
        try {
            await newAppointment.save()
            console.log('Appointment saved successfully');
        } catch (saveError) {
            console.log('Error saving appointment:', saveError);
            console.log('AppointmentData that failed:', JSON.stringify(appointmentData, null, 2));
            throw saveError; // Re-throw to be caught by outer try-catch
        }

        // save new slots data in docData
        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: 'Appointment Booked' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {

        const { userId, appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appointment user 
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // releasing doctor slot 
        const { docId, slotDate, slotTime } = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {

        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        // creating options for razorpay payment
        // Temporarily disabled
        // const options = {
        //     amount: appointmentData.amount * 100,
        //     currency: process.env.CURRENCY,
        //     receipt: appointmentId,
        // }

        // creation of an order
        // const order = await razorpayInstance.orders.create(options)

        res.json({ success: false, message: "Payment temporarily disabled" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
    try {
        // const { razorpay_order_id } = req.body
        // const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        // if (orderInfo.status === 'paid') {
        //     await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: true })
        //     res.json({ success: true, message: "Payment Successful" })
        // }
        res.json({ success: false, message: "Payment verification temporarily disabled" })
        // else {
        //     res.json({ success: false, message: 'Payment Failed' })
        // }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const { origin } = req.headers

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        const currency = process.env.CURRENCY.toLocaleLowerCase()

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: "Appointment Fees"
                },
                unit_amount: appointmentData.amount * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
            line_items: line_items,
            mode: 'payment',
        })

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const verifyStripe = async (req, res) => {
    try {

        const { appointmentId, success } = req.body

        if (success === "true") {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true })
            return res.json({ success: true, message: 'Payment Successful' })
        }

        res.json({ success: false, message: 'Payment Failed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to make dummy payment for appointment
const paymentDummy = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        // Simulate successful payment
        await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true })
        
        res.json({ 
            success: true, 
            message: "Dummy payment successful! (No real payment processed)" 
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user bills
const getUserBills = async (req, res) => {
    try {
        const { userId } = req.body;
        
        const bills = await billingModel.find({ patientId: userId });
        
        res.json({ success: true, bills });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to pay a bill
const payBill = async (req, res) => {
    try {
        const { billId, paymentMethod } = req.body;
        
        const bill = await billingModel.findById(billId);
        
        if (!bill) {
            return res.json({ success: false, message: 'Bill not found' });
        }
        
        if (bill.paymentStatus === 'Paid') {
            return res.json({ success: false, message: 'Bill already paid' });
        }
        
        // Update bill payment status
        const updatedBill = await billingModel.findByIdAndUpdate(billId, {
            paymentStatus: 'Paid',
            paymentMethod: paymentMethod || 'Dummy Payment',
            paidDate: new Date().toISOString().split('T')[0]
        }, { new: true });
        
        res.json({ success: true, message: 'Bill paid successfully', bill: updatedBill });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export {
    loginUser,
    registerUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    paymentRazorpay,
    verifyRazorpay,
    paymentStripe,
    verifyStripe,
    paymentDummy,
    getUserBills,
    payBill
}