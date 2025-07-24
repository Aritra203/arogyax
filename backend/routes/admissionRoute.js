import express from 'express';
import {
    createAdmission,
    getAllAdmissions,
    getAdmissionById,
    updateAdmission,
    addVitals,
    addMedication,
    addProcedure,
    addLabTest,
    dischargePatient,
    getPatientAdmissions,
    addNote
} from '../controllers/admissionController.js';
import authAdmin from '../middleware/authAdmin.js';
import authDoctor from '../middleware/authDoctor.js';
import authUser from '../middleware/authUser.js';

const admissionRouter = express.Router();

// Admin routes
admissionRouter.post("/create", authAdmin, createAdmission);
admissionRouter.get("/list", authAdmin, getAllAdmissions);
admissionRouter.get("/admission/:admissionId", authAdmin, getAdmissionById);
admissionRouter.put("/update/:admissionId", authAdmin, updateAdmission);

// Doctor routes (can also manage admissions)
admissionRouter.post("/doctor/create", authDoctor, createAdmission);
admissionRouter.get("/doctor/list", authDoctor, getAllAdmissions);
admissionRouter.get("/doctor/admission/:admissionId", authDoctor, getAdmissionById);
admissionRouter.post("/vitals/:admissionId", authDoctor, addVitals);
admissionRouter.post("/medication/:admissionId", authDoctor, addMedication);
admissionRouter.post("/procedure/:admissionId", authDoctor, addProcedure);
admissionRouter.post("/labtest/:admissionId", authDoctor, addLabTest);
admissionRouter.post("/discharge/:admissionId", authDoctor, dischargePatient);
admissionRouter.post("/note/:admissionId", authDoctor, addNote);

// Patient routes
admissionRouter.get("/patient/:patientId", authUser, getPatientAdmissions);

export default admissionRouter;
