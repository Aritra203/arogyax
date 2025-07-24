import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    role: { 
        type: String, 
        required: true, 
        enum: ['Doctor', 'Nurse', 'Technician', 'Administrator', 'Support Staff']
    },
    department: { type: String, required: true },
    employeeId: { type: String, required: true, unique: true },
    dateOfJoining: { type: Date, required: true },
    qualification: { type: String, required: true },
    experience: { type: Number, required: true }, // in years
    salary: { type: Number, required: true },
    address: { 
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true }
    },
    emergencyContact: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        relationship: { type: String, required: true }
    },
    status: { 
        type: String, 
        enum: ['Active', 'Inactive', 'On Leave', 'Terminated'],
        default: 'Active'
    },
    shifts: [{
        day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        startTime: { type: String },
        endTime: { type: String }
    }],
    attendance: [{
        date: { type: Date },
        checkIn: { type: String },
        checkOut: { type: String },
        hoursWorked: { type: Number },
        status: { type: String, enum: ['Present', 'Absent', 'Late', 'Half Day'] }
    }],
    leaveBalance: {
        casual: { type: Number, default: 12 },
        sick: { type: Number, default: 10 },
        annual: { type: Number, default: 21 }
    },
    image: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

const staffModel = mongoose.models.staff || mongoose.model("staff", staffSchema);
export default staffModel;
