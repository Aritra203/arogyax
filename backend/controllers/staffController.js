import staffModel from '../models/staffModel.js';
import { v2 as cloudinary } from 'cloudinary';
import bcrypt from 'bcrypt';

// Add new staff member
const addStaff = async (req, res) => {
    try {
        const {
            name, email, phone, role, department, qualification, 
            experience, salary, address, emergencyContact, shifts
        } = req.body;

        // Check if staff already exists
        const existingStaff = await staffModel.findOne({ email });
        if (existingStaff) {
            return res.json({ success: false, message: 'Staff member already exists' });
        }

        // Generate employee ID
        const year = new Date().getFullYear();
        const count = await staffModel.countDocuments();
        const employeeId = `EMP${year}${String(count + 1).padStart(4, '0')}`;

        let imageUrl = '';
        if (req.file) {
            const imageUpload = await cloudinary.uploader.upload(req.file.path, { resource_type: "image" });
            imageUrl = imageUpload.secure_url;
        }

        const staffData = {
            name,
            email,
            phone,
            role,
            department,
            employeeId,
            dateOfJoining: new Date(),
            qualification,
            experience: Number(experience),
            salary: Number(salary),
            address: JSON.parse(address),
            emergencyContact: JSON.parse(emergencyContact),
            shifts: JSON.parse(shifts || '[]'),
            image: imageUrl
        };

        const newStaff = new staffModel(staffData);
        await newStaff.save();

        res.json({ success: true, message: 'Staff member added successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get all staff members
const getAllStaff = async (req, res) => {
    try {
        const staff = await staffModel.find().select('-__v');
        res.json({ success: true, staff });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update staff member
const updateStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        const updateData = { ...req.body };

        // Parse JSON fields if they exist
        if (updateData.address && typeof updateData.address === 'string') {
            updateData.address = JSON.parse(updateData.address);
        }
        if (updateData.emergencyContact && typeof updateData.emergencyContact === 'string') {
            updateData.emergencyContact = JSON.parse(updateData.emergencyContact);
        }
        if (updateData.shifts && typeof updateData.shifts === 'string') {
            updateData.shifts = JSON.parse(updateData.shifts);
        }

        // Handle image upload
        if (req.file) {
            const imageUpload = await cloudinary.uploader.upload(req.file.path, { resource_type: "image" });
            updateData.image = imageUpload.secure_url;
        }

        const updatedStaff = await staffModel.findByIdAndUpdate(staffId, updateData, { new: true });
        
        if (!updatedStaff) {
            return res.json({ success: false, message: 'Staff member not found' });
        }

        res.json({ success: true, message: 'Staff updated successfully', staff: updatedStaff });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Delete staff member
const deleteStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        
        const deletedStaff = await staffModel.findByIdAndDelete(staffId);
        
        if (!deletedStaff) {
            return res.json({ success: false, message: 'Staff member not found' });
        }

        res.json({ success: true, message: 'Staff member deleted successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Mark attendance
const markAttendance = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { checkIn, checkOut, status } = req.body;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const staff = await staffModel.findById(staffId);
        if (!staff) {
            return res.json({ success: false, message: 'Staff member not found' });
        }

        // Check if attendance already exists for today
        const existingAttendance = staff.attendance.find(att => 
            new Date(att.date).setHours(0, 0, 0, 0) === today.getTime()
        );

        if (existingAttendance) {
            // Update existing attendance
            existingAttendance.checkOut = checkOut || existingAttendance.checkOut;
            existingAttendance.status = status || existingAttendance.status;
            
            if (checkIn && checkOut) {
                const checkInTime = new Date(`${today.toDateString()} ${checkIn}`);
                const checkOutTime = new Date(`${today.toDateString()} ${checkOut}`);
                const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
                existingAttendance.hoursWorked = Math.round(hoursWorked * 100) / 100;
            }
        } else {
            // Add new attendance
            const attendanceRecord = {
                date: today,
                checkIn: checkIn || null,
                checkOut: checkOut || null,
                status: status || 'Present',
                hoursWorked: 0
            };

            if (checkIn && checkOut) {
                const checkInTime = new Date(`${today.toDateString()} ${checkIn}`);
                const checkOutTime = new Date(`${today.toDateString()} ${checkOut}`);
                const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
                attendanceRecord.hoursWorked = Math.round(hoursWorked * 100) / 100;
            }

            staff.attendance.push(attendanceRecord);
        }

        await staff.save();
        res.json({ success: true, message: 'Attendance marked successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get staff attendance
const getStaffAttendance = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { month, year } = req.query;

        const staff = await staffModel.findById(staffId).select('name employeeId attendance');
        if (!staff) {
            return res.json({ success: false, message: 'Staff member not found' });
        }

        let attendance = staff.attendance;

        // Filter by month and year if provided
        if (month && year) {
            attendance = attendance.filter(att => {
                const attDate = new Date(att.date);
                return attDate.getMonth() === parseInt(month) - 1 && attDate.getFullYear() === parseInt(year);
            });
        }

        res.json({ success: true, staff: { name: staff.name, employeeId: staff.employeeId }, attendance });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    addStaff,
    getAllStaff,
    updateStaff,
    deleteStaff,
    markAttendance,
    getStaffAttendance
};
