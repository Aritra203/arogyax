import express from 'express';
import {
    createBill,
    getAllBills,
    getBillById,
    processPayment,
    getPatientBills,
    updateBill,
    generateFinancialReport,
    deleteBill
} from '../controllers/billingController.js';
import authAdmin from '../middleware/authAdmin.js';
import authUser from '../middleware/authUser.js';

const billingRouter = express.Router();

// Admin routes
billingRouter.post("/create", authAdmin, createBill);
billingRouter.get("/list", authAdmin, getAllBills);
billingRouter.get("/bill/:billId", authAdmin, getBillById);
billingRouter.post("/payment/:billId", authAdmin, processPayment);
billingRouter.put("/update/:billId", authAdmin, updateBill);
billingRouter.get("/reports", authAdmin, generateFinancialReport);
billingRouter.delete("/delete/:billId", authAdmin, deleteBill);

// Patient routes
billingRouter.get("/patient/:patientId", authUser, getPatientBills);

export default billingRouter;
