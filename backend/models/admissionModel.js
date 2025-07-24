import mongoose from "mongoose";

const admissionSchema = new mongoose.Schema({
    admissionId: { type: String, required: true, unique: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: false },
    patientName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    
    admissionType: { 
        type: String, 
        enum: ['Emergency', 'Planned', 'Transfer'],
        required: true 
    },
    
    admittedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'doctor', 
        required: true 
    },
    doctorName: { type: String, required: true },
    
    department: { type: String, required: true },
    
    roomDetails: {
        roomNumber: { type: String, required: true },
        roomType: { 
            type: String, 
            enum: ['General', 'Semi-Private', 'Private', 'ICU', 'CCU', 'Emergency'],
            required: true 
        },
        bedNumber: { type: String, required: true },
        dailyCharges: { type: Number, required: true }
    },
    
    admissionDate: { type: Date, default: Date.now },
    expectedDischargeDate: { type: Date },
    expectedStayDuration: { type: Number }, // Expected stay in days
    actualDischargeDate: { type: Date },
    
    admissionReason: { type: String, required: true },
    initialDiagnosis: { type: String, required: true },
    finalDiagnosis: { type: String },
    
    treatmentPlan: { type: String },
    
    attendingPhysicians: [{
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor' },
        doctorName: { type: String },
        role: { type: String }, // Primary, Consulting, etc.
        assignedDate: { type: Date, default: Date.now }
    }],
    
    vitals: [{
        recordedDate: { type: Date, default: Date.now },
        temperature: { type: Number },
        bloodPressure: {
            systolic: { type: Number },
            diastolic: { type: Number }
        },
        heartRate: { type: Number },
        respiratoryRate: { type: Number },
        oxygenSaturation: { type: Number },
        recordedBy: { type: String } // Staff ID
    }],
    
    medications: [{
        medicationName: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        prescribedBy: { type: String }, // Doctor name
        notes: { type: String }
    }],
    
    procedures: [{
        procedureName: { type: String, required: true },
        procedureDate: { type: Date, required: true },
        performedBy: { type: String, required: true },
        assistants: [{ type: String }],
        notes: { type: String },
        charges: { type: Number }
    }],
    
    labTests: [{
        testName: { type: String, required: true },
        testDate: { type: Date, required: true },
        results: { type: String },
        normalRange: { type: String },
        status: { 
            type: String, 
            enum: ['Ordered', 'In Progress', 'Completed', 'Cancelled'],
            default: 'Ordered'
        }
    }],
    
    dischargeDetails: {
        dischargeDate: { type: Date },
        dischargeType: { 
            type: String, 
            enum: ['Regular', 'Against Medical Advice', 'Transfer', 'Death', 'Absconded']
        },
        dischargeSummary: { type: String },
        followUpInstructions: { type: String },
        followUpDate: { type: Date },
        dischargedBy: { type: String }, // Doctor name
        finalBillAmount: { type: Number }
    },
    
    emergencyContact: {
        name: { type: String, required: true },
        relationship: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String }
    },
    
    insurance: {
        hasInsurance: { type: Boolean, default: false },
        insuranceProvider: { type: String },
        policyNumber: { type: String },
        preAuthNumber: { type: String },
        coverageAmount: { type: Number }
    },
    
    status: {
        type: String,
        enum: ['Admitted', 'Under Treatment', 'Ready for Discharge', 'Discharged', 'Transferred', 'Deceased'],
        default: 'Admitted'
    },
    
    totalCharges: { type: Number, default: 0 },
    
    notes: [{ 
        note: { type: String },
        addedBy: { type: String },
        addedAt: { type: Date, default: Date.now }
    }],
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Generate admission ID before validation
admissionSchema.pre('validate', function(next) {
    if (this.isNew && !this.admissionId) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.admissionId = `ADM${year}${month}${random}`;
    }
    next();
});

// Calculate charges before save
admissionSchema.pre('save', function(next) {
    // Calculate total room charges
    if (this.admissionDate && this.roomDetails?.dailyCharges) {
        const dischargeDate = this.actualDischargeDate || new Date();
        const days = Math.ceil((dischargeDate - this.admissionDate) / (1000 * 60 * 60 * 24));
        this.totalCharges = days * this.roomDetails.dailyCharges;
    }
    
    this.updatedAt = new Date();
    next();
});

const admissionModel = mongoose.models.admission || mongoose.model("admission", admissionSchema);
export default admissionModel;
