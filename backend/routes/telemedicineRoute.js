import express from 'express';
import { 
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
} from '../controllers/telemedicineController.js';
import authUser from '../middleware/authUser.js';
import authDoctor from '../middleware/authDoctor.js';
import authAdmin from '../middleware/authAdmin.js';

const telemedicineRouter = express.Router();

// Admin routes
telemedicineRouter.post('/admin/create-session', authAdmin, createSession);
telemedicineRouter.get('/admin/all-sessions', authAdmin, getAllSessions);
telemedicineRouter.post('/admin/cancel-session/:sessionId', authAdmin, cancelSession);
telemedicineRouter.post('/admin/update-doctor-fees', authAdmin, updateDoctorFees);

// User routes
telemedicineRouter.post('/create-session', authUser, createDirectSession);

// Doctor routes
telemedicineRouter.get('/doctor-sessions/:doctorId', authDoctor, getDoctorSessions);
telemedicineRouter.post('/end-session/:sessionId', authDoctor, endSession);

// Patient routes
telemedicineRouter.get('/patient-sessions/:patientId', authUser, getPatientSessions);
telemedicineRouter.post('/rate-session/:sessionId', authUser, rateSession);

// Shared routes (both doctor and patient)
telemedicineRouter.get('/session/:sessionId', getSession);
telemedicineRouter.post('/join-session/:sessionId', joinSession);
telemedicineRouter.post('/add-message/:sessionId', addChatMessage);

export default telemedicineRouter;
