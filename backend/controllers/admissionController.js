import admissionModel from '../models/admissionModel.js';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';

// Create new admission
const createAdmission = async (req, res) => {
    try {
        console.log('Received admission data:', req.body);
        
        const {
            patientId, admissionType, admittingDoctorId, attendingDoctorId, department, 
            roomId, bedNumber, admissionDate, admissionTime, admissionReason, 
            diagnosis, symptoms, patientName, patientAge, patientGender, patientContact,
            emergencyContact, vitalSigns, allergies, medications, medicalHistory,
            expectedStayDuration, roomCharges, insuranceDetails, notes, status
        } = req.body;

        // Use admittingDoctorId (from frontend) as the primary doctor
        const doctorId = admittingDoctorId || attendingDoctorId;
        
        if (!doctorId) {
            return res.json({ success: false, message: 'Doctor ID is required' });
        }

        // Get patient details if patientId is provided
        let patient = null;
        if (patientId) {
            patient = await userModel.findById(patientId).select('name dob gender phone');
            if (!patient) {
                return res.json({ success: false, message: 'Patient not found' });
            }
        }

        // Get doctor details
        const doctor = await doctorModel.findById(doctorId).select('name speciality');
        if (!doctor) {
            return res.json({ success: false, message: 'Doctor not found' });
        }

        // Calculate age if patient exists and has DOB
        let age = patientAge || 0;
        if (!age && patient && patient.dob && patient.dob !== 'Not Selected') {
            const dobParts = patient.dob.split('_');
            if (dobParts.length === 3) {
                const birthDate = new Date(`${dobParts[2]}-${dobParts[1]}-${dobParts[0]}`);
                const today = new Date();
                age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            }
        }

        // Calculate expected discharge date if expected stay duration is provided
        let expectedDischargeDate = null;
        if (expectedStayDuration && expectedStayDuration > 0) {
            const admissionDateTime = new Date(admissionDate || Date.now());
            expectedDischargeDate = new Date(admissionDateTime.getTime() + (expectedStayDuration * 24 * 60 * 60 * 1000));
        }

        const admissionData = {
            patientId: patientId || null,
            patientName: patientName || (patient ? patient.name : ''),
            age: age || 0,
            gender: patientGender || (patient ? patient.gender : 'Not Specified'),
            admissionType: admissionType || 'Emergency',
            admittedBy: doctorId, // Map frontend field to backend field
            doctorName: doctor.name,
            department: department || doctor.speciality,
            roomDetails: {
                roomNumber: bedNumber || 'TBD',
                roomType: 'General',
                bedNumber: bedNumber || 'TBD',
                dailyCharges: roomCharges || 0
            },
            admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
            expectedDischargeDate: expectedDischargeDate,
            expectedStayDuration: expectedStayDuration ? parseInt(expectedStayDuration) : null,
            admissionReason: admissionReason || diagnosis || 'Not specified',
            initialDiagnosis: diagnosis || 'To be determined',
            treatmentPlan: symptoms || 'To be determined',
            emergencyContact: emergencyContact ? (() => {
                const parsed = JSON.parse(emergencyContact);
                return {
                    name: parsed.name || '',
                    relationship: parsed.relation || parsed.relationship || '', // Map relation to relationship
                    phone: parsed.phone || '',
                    address: parsed.address || ''
                };
            })() : { name: '', relationship: '', phone: '', address: '' },
            insurance: insuranceDetails ? JSON.parse(insuranceDetails) : { hasInsurance: false },
            status: status || 'Admitted'
        };

        // Add attending physician
        admissionData.attendingPhysicians = [{
            doctorId: doctorId,
            doctorName: doctor.name,
            role: 'Primary',
            assignedDate: new Date()
        }];

        const newAdmission = new admissionModel(admissionData);
        await newAdmission.save();

        res.json({ 
            success: true, 
            message: 'Patient admitted successfully', 
            admissionId: newAdmission.admissionId 
        });

    } catch (error) {
        console.log('Admission creation error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get all admissions
const getAllAdmissions = async (req, res) => {
    try {
        const { status, department, startDate, endDate } = req.query;
        let filter = {};

        if (status && status !== 'All') {
            filter.status = status;
        }
        if (department && department !== 'All') {
            filter.department = department;
        }
        if (startDate && endDate) {
            filter.admissionDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const admissions = await admissionModel.find(filter)
            .select('-__v -vitals -medications -procedures -labTests -notes')
            .sort({ admissionDate: -1 })
            .populate('patientId', 'name phone email')
            .populate('admittedBy', 'name speciality');

        // Ensure doctor name is available in the response
        const formattedAdmissions = admissions.map(admission => {
            const admissionObj = admission.toObject();
            if (!admissionObj.doctorName && admissionObj.admittedBy) {
                admissionObj.doctorName = admissionObj.admittedBy.name;
            }
            // Ensure patient name is available even if patientId is null
            if (!admissionObj.patientName && admissionObj.patientId) {
                admissionObj.patientName = admissionObj.patientId.name;
            }
            // Ensure patientId is a string, not an object
            if (admissionObj.patientId && typeof admissionObj.patientId === 'object') {
                admissionObj.patientIdString = admissionObj.patientId._id || admissionObj.patientId.toString();
            } else {
                admissionObj.patientIdString = admissionObj.patientId || null;
            }
            return admissionObj;
        });

        res.json({ success: true, admissions: formattedAdmissions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get admission by ID
const getAdmissionById = async (req, res) => {
    try {
        const { admissionId } = req.params;

        const admission = await admissionModel.findOne({
            $or: [{ _id: admissionId }, { admissionId }]
        })
            .populate('patientId', 'name phone email address')
            .populate('admittedBy', 'name speciality');

        if (!admission) {
            return res.json({ success: false, message: 'Admission not found' });
        }

        res.json({ success: true, admission });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update admission
const updateAdmission = async (req, res) => {
    try {
        const { admissionId } = req.params;
        const updateData = { ...req.body };

        // Parse JSON fields if they exist
        if (updateData.roomDetails && typeof updateData.roomDetails === 'string') {
            updateData.roomDetails = JSON.parse(updateData.roomDetails);
        }
        if (updateData.emergencyContact && typeof updateData.emergencyContact === 'string') {
            updateData.emergencyContact = JSON.parse(updateData.emergencyContact);
        }
        if (updateData.insurance && typeof updateData.insurance === 'string') {
            updateData.insurance = JSON.parse(updateData.insurance);
        }

        const updatedAdmission = await admissionModel.findOneAndUpdate(
            { $or: [{ _id: admissionId }, { admissionId }] },
            updateData,
            { new: true }
        );
        
        if (!updatedAdmission) {
            return res.json({ success: false, message: 'Admission not found' });
        }

        res.json({ success: true, message: 'Admission updated successfully', admission: updatedAdmission });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Add vitals
const addVitals = async (req, res) => {
    try {
        const { admissionId } = req.params;
        const { temperature, bloodPressure, heartRate, respiratoryRate, oxygenSaturation, recordedBy } = req.body;

        const admission = await admissionModel.findOne({
            $or: [{ _id: admissionId }, { admissionId }]
        });

        if (!admission) {
            return res.json({ success: false, message: 'Admission not found' });
        }

        admission.vitals.push({
            temperature: Number(temperature),
            bloodPressure: JSON.parse(bloodPressure),
            heartRate: Number(heartRate),
            respiratoryRate: Number(respiratoryRate),
            oxygenSaturation: Number(oxygenSaturation),
            recordedBy
        });

        await admission.save();
        res.json({ success: true, message: 'Vitals recorded successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Add medication
const addMedication = async (req, res) => {
    try {
        const { admissionId } = req.params;
        const { medicationName, dosage, frequency, startDate, endDate, prescribedBy, notes } = req.body;

        const admission = await admissionModel.findOne({
            $or: [{ _id: admissionId }, { admissionId }]
        });

        if (!admission) {
            return res.json({ success: false, message: 'Admission not found' });
        }

        admission.medications.push({
            medicationName,
            dosage,
            frequency,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            prescribedBy,
            notes
        });

        await admission.save();
        res.json({ success: true, message: 'Medication added successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Add procedure
const addProcedure = async (req, res) => {
    try {
        const { admissionId } = req.params;
        const { procedureName, procedureDate, performedBy, assistants, notes, charges } = req.body;

        const admission = await admissionModel.findOne({
            $or: [{ _id: admissionId }, { admissionId }]
        });

        if (!admission) {
            return res.json({ success: false, message: 'Admission not found' });
        }

        admission.procedures.push({
            procedureName,
            procedureDate: new Date(procedureDate),
            performedBy,
            assistants: assistants ? JSON.parse(assistants) : [],
            notes,
            charges: Number(charges)
        });

        await admission.save();
        res.json({ success: true, message: 'Procedure added successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Add lab test
const addLabTest = async (req, res) => {
    try {
        const { admissionId } = req.params;
        const { testName, testDate, results, normalRange, status } = req.body;

        const admission = await admissionModel.findOne({
            $or: [{ _id: admissionId }, { admissionId }]
        });

        if (!admission) {
            return res.json({ success: false, message: 'Admission not found' });
        }

        admission.labTests.push({
            testName,
            testDate: new Date(testDate),
            results,
            normalRange,
            status: status || 'Ordered'
        });

        await admission.save();
        res.json({ success: true, message: 'Lab test added successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Discharge patient
const dischargePatient = async (req, res) => {
    try {
        const { admissionId } = req.params;
        const { 
            dischargeType, dischargeSummary, followUpInstructions, 
            followUpDate, dischargedBy, finalDiagnosis, finalBillAmount 
        } = req.body;

        const admission = await admissionModel.findOne({
            $or: [{ _id: admissionId }, { admissionId }]
        });

        if (!admission) {
            return res.json({ success: false, message: 'Admission not found' });
        }

        admission.status = 'Discharged';
        admission.actualDischargeDate = new Date();
        admission.finalDiagnosis = finalDiagnosis;

        admission.dischargeDetails = {
            dischargeDate: new Date(),
            dischargeType,
            dischargeSummary,
            followUpInstructions,
            followUpDate: followUpDate ? new Date(followUpDate) : null,
            dischargedBy,
            finalBillAmount: Number(finalBillAmount)
        };

        await admission.save();
        res.json({ success: true, message: 'Patient discharged successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};



// Add note
const addNote = async (req, res) => {
    try {
        const { admissionId } = req.params;
        const { note, addedBy } = req.body;

        const admission = await admissionModel.findOne({
            $or: [{ _id: admissionId }, { admissionId }]
        });

        if (!admission) {
            return res.json({ success: false, message: 'Admission not found' });
        }

        admission.notes.push({
            note,
            addedBy
        });

        await admission.save();
        res.json({ success: true, message: 'Note added successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Delete admission
const deleteAdmission = async (req, res) => {
    try {
        const { admissionId } = req.params;
        
        await admissionModel.findByIdAndDelete(admissionId);
        res.json({ success: true, message: 'Admission deleted successfully' });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get available rooms
const getAvailableRooms = async (req, res) => {
    try {
        // Get all current admissions that are not discharged
        const currentAdmissions = await admissionModel.find({ 
            status: { $ne: 'Discharged' } 
        }).select('roomDetails.roomNumber');

        const occupiedRooms = currentAdmissions.map(admission => 
            admission.roomDetails?.roomNumber
        ).filter(Boolean);

        // Generate room list (assuming 100 rooms)
        const totalRooms = Array.from({ length: 100 }, (_, i) => ({
            roomNumber: `R${String(i + 1).padStart(3, '0')}`,
            roomType: i < 20 ? 'ICU' : i < 40 ? 'Private' : i < 80 ? 'Semi-Private' : 'General',
            isOccupied: occupiedRooms.includes(`R${String(i + 1).padStart(3, '0')}`)
        }));

        const availableRooms = totalRooms.filter(room => !room.isOccupied);

        res.json({ 
            success: true, 
            rooms: availableRooms,
            totalRooms: totalRooms.length,
            occupiedRooms: occupiedRooms.length,
            availableRooms: availableRooms.length
        });
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const getPatientAdmissions = async (req, res) => {
    try {
        const { patientId } = req.params;

        const admissions = await admissionModel.find({ 
            $or: [
                { patientId: patientId },
                { 'patientId': patientId }
            ]
        })
            .sort({ admissionDate: -1 })
            .populate('admittedBy', 'name speciality')
            .populate('patientId', 'name phone email');

        // Format admissions with proper doctor names
        const formattedAdmissions = admissions.map(admission => {
            const admissionObj = admission.toObject();
            if (!admissionObj.doctorName && admissionObj.admittedBy) {
                admissionObj.doctorName = admissionObj.admittedBy.name;
            }
            return admissionObj;
        });

        res.json({ success: true, admissions: formattedAdmissions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get patient's own admissions (for user route)
const getMyAdmissions = async (req, res) => {
    try {
        const patientId = req.body.userId; // From auth middleware

        // Convert to ObjectId for better matching
        const mongoose = await import('mongoose');
        const objectIdPatientId = new mongoose.default.Types.ObjectId(patientId);

        const admissions = await admissionModel.find({ 
            $or: [
                { patientId: patientId },
                { patientId: objectIdPatientId }
            ]
        })
            .populate('admittedBy', 'name speciality')
            .populate('patientId', 'name phone email')
            .sort({ admissionDate: -1 });

        // Format admissions with proper doctor names and add additional fields
        const formattedAdmissions = admissions.map(admission => {
            const admissionObj = admission.toObject();
            
            // Ensure doctor name is available
            if (!admissionObj.doctorName && admissionObj.admittedBy) {
                admissionObj.doctorName = admissionObj.admittedBy.name;
            }
            
            // Map additional fields for better display
            admissionObj.admissionNumber = admissionObj.admissionId || admissionObj._id;
            admissionObj.roomNumber = admissionObj.roomDetails?.roomNumber || 'TBD';
            admissionObj.diagnosis = admissionObj.initialDiagnosis || admissionObj.admissionReason || 'To be determined';
            admissionObj.estimatedDailyCost = admissionObj.roomDetails?.dailyCharges || 0;
            admissionObj.dischargeDate = admissionObj.actualDischargeDate || null;
            admissionObj.totalCost = admissionObj.dischargeDetails?.finalBillAmount || null;
            admissionObj.specialInstructions = admissionObj.treatmentPlan || null;
            
            // Add attending doctor info if available
            if (admissionObj.attendingPhysicians && admissionObj.attendingPhysicians.length > 0) {
                admissionObj.attendingDoctor = {
                    name: admissionObj.attendingPhysicians[0].doctorName
                };
            } else {
                admissionObj.attendingDoctor = {
                    name: admissionObj.doctorName
                };
            }
            
            return admissionObj;
        });

        res.json({ success: true, admissions: formattedAdmissions });
    } catch (error) {
        console.log('Error in getMyAdmissions:', error);
        res.json({ success: false, message: error.message });
    }
};// Get admissions for a specific doctor (where they are admitting or attending physician)
const getDoctorAdmissions = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const admissions = await admissionModel.find({
            $or: [
                { admittedBy: doctorId },
                { 'attendingPhysicians.doctorId': doctorId }
            ]
        })
            .sort({ admissionDate: -1 })
            .populate('admittedBy', 'name speciality')
            .populate('patientId', 'name phone email');

        // Format admissions with proper doctor names
        const formattedAdmissions = admissions.map(admission => {
            const admissionObj = admission.toObject();
            if (!admissionObj.doctorName && admissionObj.admittedBy) {
                admissionObj.doctorName = admissionObj.admittedBy.name;
            }
            
            // Add role information for this doctor
            if (admissionObj.admittedBy && admissionObj.admittedBy._id.toString() === doctorId) {
                admissionObj.doctorRole = 'Admitting Physician';
            } else if (admissionObj.attendingPhysicians) {
                const attendingRole = admissionObj.attendingPhysicians.find(
                    physician => physician.doctorId.toString() === doctorId
                );
                if (attendingRole) {
                    admissionObj.doctorRole = attendingRole.role || 'Attending Physician';
                }
            }
            
            return admissionObj;
        });

        res.json({ success: true, admissions: formattedAdmissions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
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
    getMyAdmissions,
    getDoctorAdmissions,
    addNote,
    deleteAdmission,
    getAvailableRooms
};
