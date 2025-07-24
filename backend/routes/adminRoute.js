import express from 'express';
import { loginAdmin, appointmentsAdmin, appointmentCancel, addDoctor, allDoctors, adminDashboard, allUsers, addStaff } from '../controllers/adminController.js';
import { changeAvailablity } from '../controllers/doctorController.js';
import { getAllStaff, updateStaff, deleteStaff, markAttendance, getStaffAttendance } from '../controllers/staffController.js';
import { createBill, getAllBills, updateBill, deleteBill, processPayment, generateFinancialReport, getBillById, getPatientBills } from '../controllers/billingController.js';
import { addInventoryItem, getAllInventoryItems, updateInventoryItem, recordUsage, restockItem, getLowStockAlerts, getExpiryAlerts, deleteInventoryItem } from '../controllers/inventoryController.js';
import { createAdmission, getAllAdmissions, getAdmissionById, updateAdmission, addVitals, addMedication, addProcedure, addLabTest, dischargePatient, getPatientAdmissions, getDoctorAdmissions, addNote, deleteAdmission, getAvailableRooms } from '../controllers/admissionController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';
const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin)
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)
adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)
adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.get("/all-users", authAdmin, allUsers)
adminRouter.post("/change-availability", authAdmin, changeAvailablity)
adminRouter.get("/dashboard", authAdmin, adminDashboard)

// Staff management routes
adminRouter.post("/add-staff", authAdmin, upload.single('image'), addStaff)
adminRouter.get("/staff-list", authAdmin, getAllStaff)
adminRouter.put("/update-staff/:staffId", authAdmin, upload.single('image'), updateStaff)
adminRouter.delete("/delete-staff/:staffId", authAdmin, deleteStaff)
adminRouter.post("/mark-attendance/:staffId", authAdmin, markAttendance)
adminRouter.get("/staff-attendance/:staffId", authAdmin, getStaffAttendance)

// Billing management routes
adminRouter.post("/billing-create", authAdmin, createBill)
adminRouter.get("/billing-list", authAdmin, getAllBills)
adminRouter.get("/billing/:billId", authAdmin, getBillById)
adminRouter.put("/billing-update/:billId", authAdmin, updateBill)
adminRouter.delete("/billing-delete/:billId", authAdmin, deleteBill)
adminRouter.post("/billing-payment/:billId", authAdmin, processPayment)
adminRouter.put("/billing-payment/:billId", authAdmin, processPayment)
adminRouter.get("/billing-report", authAdmin, generateFinancialReport)
adminRouter.get("/patient-bills/:patientId", authAdmin, getPatientBills)

// Inventory management routes
adminRouter.post("/inventory-add", authAdmin, addInventoryItem)
adminRouter.get("/inventory-list", authAdmin, getAllInventoryItems)
adminRouter.put("/inventory-update/:itemId", authAdmin, updateInventoryItem)
adminRouter.post("/inventory-usage/:itemId", authAdmin, recordUsage)
adminRouter.post("/inventory-restock/:itemId", authAdmin, restockItem)
adminRouter.get("/inventory-low-stock", authAdmin, getLowStockAlerts)
adminRouter.get("/inventory-expiry", authAdmin, getExpiryAlerts)
adminRouter.delete("/inventory-delete/:itemId", authAdmin, deleteInventoryItem)

// Admission management routes
adminRouter.post("/admission-create", authAdmin, createAdmission)
adminRouter.get("/admission-list", authAdmin, getAllAdmissions)
adminRouter.get("/admission/:admissionId", authAdmin, getAdmissionById)
adminRouter.put("/admission-update/:admissionId", authAdmin, updateAdmission)
adminRouter.post("/admission-vitals/:admissionId", authAdmin, addVitals)
adminRouter.post("/admission-medication/:admissionId", authAdmin, addMedication)
adminRouter.post("/admission-procedure/:admissionId", authAdmin, addProcedure)
adminRouter.post("/admission-lab/:admissionId", authAdmin, addLabTest)
adminRouter.put("/admission-discharge/:admissionId", authAdmin, dischargePatient)
adminRouter.get("/patient-admissions/:patientId", authAdmin, getPatientAdmissions)
adminRouter.get("/doctor-admissions/:doctorId", authAdmin, getDoctorAdmissions)
adminRouter.post("/admission-note/:admissionId", authAdmin, addNote)
adminRouter.delete("/admission-delete/:admissionId", authAdmin, deleteAdmission)
adminRouter.get("/admission-rooms", authAdmin, getAvailableRooms)

// Report data routes for exports
adminRouter.get("/all-appointments", authAdmin, appointmentsAdmin)
adminRouter.get("/all-patients", authAdmin, allUsers)
adminRouter.get("/all-admissions", authAdmin, getAllAdmissions)
adminRouter.get("/all-billing", authAdmin, getAllBills)
adminRouter.get("/all-inventory", authAdmin, getAllInventoryItems)
adminRouter.get("/all-staff", authAdmin, getAllStaff)

export default adminRouter;