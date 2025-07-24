import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String, default: '' }
});

const prescriptionSchema = new mongoose.Schema({
    patientId: { type: String, required: true },
    doctorId: { type: String, required: true },
    appointmentId: { type: String, required: true },
    patientData: { type: Object, required: true },
    doctorData: { type: Object, required: true },
    appointmentData: { type: Object, required: true },
    diagnosis: { type: String, required: true },
    medications: [medicationSchema],
    notes: { type: String, default: '' },
    followUpDate: { type: String, default: '' },
    prescriptionDate: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

const prescriptionModel = mongoose.models.prescription || mongoose.model("prescription", prescriptionSchema);
export default prescriptionModel;
