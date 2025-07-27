import telemedicineModel from "../models/telemedicineModel.js";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import userModel from "../models/userModel.js";
import { v4 as uuidv4 } from 'uuid';

// Create telemedicine session
const createSession = async (req, res) => {
    try {
        const { appointmentId, sessionType, scheduledTime, duration, sessionFee } = req.body;

        // Get appointment details
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        // Generate unique session and room IDs
        const sessionId = uuidv4();
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const sessionData = {
            patient: appointment.userId,
            doctor: appointment.docId,
            appointmentId,
            sessionType,
            scheduledTime,
            duration,
            sessionId,
            roomId,
            sessionFee
        };

        const session = new telemedicineModel(sessionData);
        await session.save();

        // Update appointment to include telemedicine
        await appointmentModel.findByIdAndUpdate(appointmentId, {
            isTelemedicine: true,
            telemedicineSessionId: session._id
        });

        res.json({ success: true, message: "Telemedicine session created", session });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Create direct telemedicine session (without appointment)
const createDirectSession = async (req, res) => {
    try {
        const { patientId, doctorId, sessionType, scheduledTime } = req.body;

        // Validate patient and doctor
        const patient = await userModel.findById(patientId);
        const doctor = await doctorModel.findById(doctorId);
        
        if (!patient) {
            return res.json({ success: false, message: "Patient not found" });
        }
        
        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        // Set session fee based on session type and doctor
        let sessionFee = 50; // Default fee
        switch (sessionType) {
            case 'emergency':
                sessionFee = doctor.emergencyFee || 150;
                break;
            case 'follow-up':
                sessionFee = doctor.followUpFee || 30;
                break;
            case 'consultation':
            default:
                sessionFee = doctor.consultationFee || 50;
                break;
        }

        // Generate unique session and room IDs
        const sessionId = uuidv4();
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const sessionData = {
            patient: patientId,
            doctor: doctorId,
            sessionType,
            scheduledTime,
            duration: 30, // Default 30 minutes
            sessionId,
            roomId,
            sessionFee
        };

        const session = new telemedicineModel(sessionData);
        await session.save();

        // Populate the session with doctor and patient data
        await session.populate('doctor', 'name speciality image');
        await session.populate('patient', 'name email phone');

        res.json({ success: true, message: "Telemedicine session created", session });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get session details
const getSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const session = await telemedicineModel.findById(sessionId)
            .populate('patient', 'name email phone image')
            .populate('doctor', 'name email speciality image')
            .populate('appointmentId');

        if (!session) {
            return res.json({ success: false, message: "Session not found" });
        }

        res.json({ success: true, session });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Join session
const joinSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { userType } = req.body; // 'patient' or 'doctor'

        const session = await telemedicineModel.findById(sessionId);
        if (!session) {
            return res.json({ success: false, message: "Session not found" });
        }

        // Check if session is scheduled
        if (session.sessionStatus !== 'scheduled') {
            return res.json({ success: false, message: "Session is not available for joining" });
        }

        // Update session status to ongoing
        await telemedicineModel.findByIdAndUpdate(sessionId, {
            sessionStatus: 'ongoing',
            startTime: new Date()
        });

        res.json({ 
            success: true, 
            message: "Joined session successfully",
            roomId: session.roomId,
            sessionId: session.sessionId
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// End session
const endSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { prescriptionNotes, doctorNotes, followUpRequired, followUpDate } = req.body;

        const updateData = {
            sessionStatus: 'completed',
            endTime: new Date(),
            prescriptionNotes,
            doctorNotes,
            followUpRequired
        };

        if (followUpRequired && followUpDate) {
            updateData.followUpDate = followUpDate;
        }

        await telemedicineModel.findByIdAndUpdate(sessionId, updateData);

        res.json({ success: true, message: "Session ended successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Add chat message
const addChatMessage = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { sender, message, messageType } = req.body;

        const session = await telemedicineModel.findById(sessionId);
        if (!session) {
            return res.json({ success: false, message: "Session not found" });
        }

        session.chatHistory.push({
            sender,
            message,
            messageType: messageType || 'text'
        });

        await session.save();

        res.json({ success: true, message: "Message added successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get patient sessions
const getPatientSessions = async (req, res) => {
    try {
        const { patientId } = req.params;

        const sessions = await telemedicineModel.find({ patient: patientId })
            .populate('doctor', 'name speciality image')
            .populate('appointmentId')
            .sort({ scheduledTime: -1 });

        res.json({ success: true, sessions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get doctor sessions
const getDoctorSessions = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const sessions = await telemedicineModel.find({ doctor: doctorId })
            .populate('patient', 'name email phone image')
            .populate('appointmentId')
            .sort({ scheduledTime: -1 });

        res.json({ success: true, sessions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Rate session
const rateSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { rating } = req.body;

        if (rating < 1 || rating > 5) {
            return res.json({ success: false, message: "Rating must be between 1 and 5" });
        }

        await telemedicineModel.findByIdAndUpdate(sessionId, { patientRating: rating });

        res.json({ success: true, message: "Session rated successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Get all sessions
const getAllSessions = async (req, res) => {
    try {
        const sessions = await telemedicineModel.find({})
            .populate('doctor', 'name speciality image')
            .populate('patient', 'name email phone')
            .populate('appointmentId')
            .sort({ scheduledTime: -1 });

        res.json({ success: true, sessions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Cancel session
const cancelSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await telemedicineModel.findByIdAndUpdate(
            sessionId,
            { sessionStatus: 'cancelled' },
            { new: true }
        );

        if (!session) {
            return res.json({ success: false, message: "Session not found" });
        }

        res.json({ success: true, message: "Session cancelled successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Update doctor telemedicine fees
const updateDoctorFees = async (req, res) => {
    try {
        const { doctorId, consultationFee, followUpFee, emergencyFee } = req.body;

        const doctor = await doctorModel.findByIdAndUpdate(
            doctorId,
            {
                consultationFee,
                followUpFee,
                emergencyFee
            },
            { new: true }
        );

        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        res.json({ success: true, message: "Doctor fees updated successfully", doctor });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { 
    createSession,
    createDirectSession, 
    getSession, 
    joinSession, 
    endSession, 
    addChatMessage, 
    getPatientSessions, 
    getDoctorSessions, 
    rateSession,
    getAllSessions,
    cancelSession,
    updateDoctorFees
};
