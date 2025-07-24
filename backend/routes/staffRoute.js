import express from 'express';
import {
    addStaff,
    getAllStaff,
    updateStaff,
    deleteStaff,
    markAttendance,
    getStaffAttendance
} from '../controllers/staffController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';

const staffRouter = express.Router();

staffRouter.post("/add", authAdmin, upload.single('image'), addStaff);
staffRouter.get("/list", authAdmin, getAllStaff);
staffRouter.put("/update/:staffId", authAdmin, upload.single('image'), updateStaff);
staffRouter.delete("/delete/:staffId", authAdmin, deleteStaff);
staffRouter.post("/attendance/:staffId", authAdmin, markAttendance);
staffRouter.get("/attendance/:staffId", authAdmin, getStaffAttendance);

export default staffRouter;
