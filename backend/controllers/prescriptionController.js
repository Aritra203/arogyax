import prescriptionModel from "../models/prescriptionModel.js";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import userModel from "../models/userModel.js";

// Create a new prescription
const createPrescription = async (req, res) => {
    try {
        const { appointmentId, diagnosis, medications, notes, followUpDate } = req.body;
        const doctorId = req.body.docId;

        // Validate required fields
        if (!appointmentId || !diagnosis || !medications || medications.length === 0) {
            return res.json({ success: false, message: "Appointment ID, diagnosis, and medications are required" });
        }

        // Verify appointment exists and belongs to the doctor
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        if (appointment.docId !== doctorId) {
            return res.json({ success: false, message: "Unauthorized access to appointment" });
        }

        // Get patient and doctor data
        const patient = await userModel.findById(appointment.userId);
        const doctor = await doctorModel.findById(doctorId);

        if (!patient || !doctor) {
            return res.json({ success: false, message: "Patient or doctor not found" });
        }

        // Check if prescription already exists for this appointment
        const existingPrescription = await prescriptionModel.findOne({ appointmentId });
        if (existingPrescription) {
            return res.json({ success: false, message: "Prescription already exists for this appointment" });
        }

        // Create prescription
        const prescriptionData = {
            patientId: appointment.userId,
            doctorId,
            appointmentId,
            patientData: {
                name: patient.name,
                email: patient.email,
                phone: patient.phone,
                age: patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : 'N/A',
                gender: patient.gender
            },
            doctorData: {
                name: doctor.name,
                speciality: doctor.speciality,
                degree: doctor.degree
            },
            appointmentData: {
                slotDate: appointment.slotDate,
                slotTime: appointment.slotTime
            },
            diagnosis,
            medications,
            notes,
            followUpDate
        };

        const newPrescription = new prescriptionModel(prescriptionData);
        await newPrescription.save();

        // Mark appointment as completed if not already
        if (!appointment.isCompleted) {
            appointment.isCompleted = true;
            await appointment.save();
        }

        res.json({ success: true, message: "Prescription created successfully", prescription: newPrescription });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get prescriptions for a doctor
const getDoctorPrescriptions = async (req, res) => {
    try {
        const doctorId = req.body.docId;
        const prescriptions = await prescriptionModel.find({ doctorId }).sort({ createdAt: -1 });
        res.json({ success: true, prescriptions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get prescriptions for a patient
const getPatientPrescriptions = async (req, res) => {
    try {
        const { userId } = req.body;
        const prescriptions = await prescriptionModel.find({ patientId: userId }).sort({ createdAt: -1 });
        res.json({ success: true, prescriptions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get a specific prescription
const getPrescription = async (req, res) => {
    try {
        const { prescriptionId } = req.params;
        const prescription = await prescriptionModel.findById(prescriptionId);
        
        if (!prescription) {
            return res.json({ success: false, message: "Prescription not found" });
        }

        res.json({ success: true, prescription });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update prescription
const updatePrescription = async (req, res) => {
    try {
        const { prescriptionId } = req.params;
        const { diagnosis, medications, notes, followUpDate } = req.body;
        const doctorId = req.body.docId;

        const prescription = await prescriptionModel.findById(prescriptionId);
        if (!prescription) {
            return res.json({ success: false, message: "Prescription not found" });
        }

        // Verify doctor owns this prescription
        if (prescription.doctorId !== doctorId) {
            return res.json({ success: false, message: "Unauthorized access to prescription" });
        }

        // Update prescription
        const updatedPrescription = await prescriptionModel.findByIdAndUpdate(
            prescriptionId,
            { diagnosis, medications, notes, followUpDate },
            { new: true }
        );

        res.json({ success: true, message: "Prescription updated successfully", prescription: updatedPrescription });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get all prescriptions (admin only)
const getAllPrescriptions = async (req, res) => {
    try {
        const prescriptions = await prescriptionModel.find({}).sort({ createdAt: -1 });
        res.json({ success: true, prescriptions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { 
    createPrescription, 
    getDoctorPrescriptions, 
    getPatientPrescriptions, 
    getPrescription, 
    updatePrescription,
    getAllPrescriptions 
};
