import mongoose from "mongoose";

const telemedicineSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor',
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'appointment',
        required: true
    },
    sessionType: {
        type: String,
        enum: ['video', 'audio', 'chat'],
        default: 'video'
    },
    sessionStatus: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    scheduledTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // in minutes
        default: 30
    },
    sessionId: {
        type: String, // Video call session ID
        unique: true
    },
    roomId: {
        type: String, // Video call room ID
        unique: true
    },
    startTime: Date,
    endTime: Date,
    recordingUrl: String,
    chatHistory: [{
        sender: {
            type: String,
            enum: ['patient', 'doctor'],
            required: true
        },
        message: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        messageType: {
            type: String,
            enum: ['text', 'image', 'file'],
            default: 'text'
        }
    }],
    prescriptionNotes: String,
    followUpRequired: {
        type: Boolean,
        default: false
    },
    followUpDate: Date,
    sessionFee: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    technicalIssues: [{
        issue: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        resolved: {
            type: Boolean,
            default: false
        }
    }],
    patientRating: {
        type: Number,
        min: 1,
        max: 5
    },
    doctorNotes: String
}, {
    timestamps: true
});

const telemedicineModel = mongoose.model('telemedicine', telemedicineSchema);

export default telemedicineModel;
