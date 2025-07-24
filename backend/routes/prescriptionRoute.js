import express from "express";
import { 
    createPrescription, 
    getDoctorPrescriptions, 
    getPatientPrescriptions, 
    getPrescription, 
    updatePrescription,
    getAllPrescriptions 
} from "../controllers/prescriptionController.js";
import authDoctor from "../middleware/authDoctor.js";
import authUser from "../middleware/authUser.js";
import authAdmin from "../middleware/authAdmin.js";

const prescriptionRouter = express.Router();

// Doctor routes
prescriptionRouter.post("/create", authDoctor, createPrescription);
prescriptionRouter.get("/doctor", authDoctor, getDoctorPrescriptions);
prescriptionRouter.put("/update/:prescriptionId", authDoctor, updatePrescription);

// Patient routes
prescriptionRouter.post("/patient", authUser, getPatientPrescriptions);

// Public routes (for viewing specific prescription)
prescriptionRouter.get("/:prescriptionId", getPrescription);

// Admin routes
prescriptionRouter.get("/admin/all", authAdmin, getAllPrescriptions);

export default prescriptionRouter;
