import billingModel from '../models/billingModel.js';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';

// Create new bill
const createBill = async (req, res) => {
    try {
        const {
            patientId, billType, appointmentId, admissionId, doctorId,
            services, insurance, notes, items, subtotal, totalDiscount, 
            totalTax, totalAmount, paymentStatus, paymentMethod
        } = req.body;

        // Get patient details
        const patient = await userModel.findById(patientId).select('name phone');
        if (!patient) {
            return res.json({ success: false, message: 'Patient not found' });
        }

        // Get doctor details if provided
        let doctorName = '';
        if (doctorId) {
            const doctor = await doctorModel.findById(doctorId).select('name');
            if (doctor) {
                doctorName = doctor.name;
            }
        }

        // Generate bill number
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const count = await billingModel.countDocuments();
        const billNumber = `BILL${year}${month}${String(count + 1).padStart(4, '0')}`;

        // Handle services data - check if it's already parsed or needs parsing
        let servicesData = [];
        if (services) {
            if (typeof services === 'string') {
                servicesData = JSON.parse(services);
            } else if (Array.isArray(services)) {
                servicesData = services;
            }
        } else if (items && Array.isArray(items)) {
            // Convert items format to services format
            servicesData = items.map(item => ({
                serviceName: item.description || 'Service',
                category: 'Other',
                quantity: item.quantity || 1,
                unitPrice: parseFloat(item.unitPrice) || 0,
                totalPrice: parseFloat(item.amount) || 0,
                discount: 0,
                tax: 0
            }));
        }

        // Handle insurance data
        let insuranceData = { hasInsurance: false };
        if (insurance) {
            if (typeof insurance === 'string') {
                insuranceData = JSON.parse(insurance);
            } else if (typeof insurance === 'object') {
                insuranceData = insurance;
            }
        }

        const billingData = {
            billNumber,
            patientId,
            patientName: patient.name,
            patientContact: patient.phone,
            billType: billType || 'OPD',
            appointmentId: appointmentId || null,
            admissionId: admissionId || null,
            doctorId: doctorId || null,
            doctorName,
            services: servicesData,
            subtotal: parseFloat(subtotal) || 0,
            totalDiscount: parseFloat(totalDiscount) || 0,
            totalTax: parseFloat(totalTax) || 0,
            totalAmount: parseFloat(totalAmount) || 0,
            paymentStatus: paymentStatus || 'Pending',
            insurance: insuranceData,
            notes,
            generatedBy: req.body.generatedBy || 'System',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        };

        const newBill = new billingModel(billingData);
        await newBill.save();

        res.json({ success: true, message: 'Bill created successfully', billId: newBill._id, billNumber });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get all bills
const getAllBills = async (req, res) => {
    try {
        const { status, billType, startDate, endDate } = req.query;
        let filter = {};

        if (status && status !== 'All') {
            filter.paymentStatus = status;
        }
        if (billType && billType !== 'All') {
            filter.billType = billType;
        }
        if (startDate && endDate) {
            filter.billingDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const bills = await billingModel.find(filter)
            .select('-__v')
            .sort({ billingDate: -1 })
            .populate('patientId', 'name phone')
            .populate('doctorId', 'name speciality');

        res.json({ success: true, bills });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get bill by ID
const getBillById = async (req, res) => {
    try {
        const { billId } = req.params;

        const bill = await billingModel.findById(billId)
            .populate('patientId', 'name phone email address')
            .populate('doctorId', 'name speciality');

        if (!bill) {
            return res.json({ success: false, message: 'Bill not found' });
        }

        res.json({ success: true, bill });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Process payment or update payment status
const processPayment = async (req, res) => {
    try {
        const { billId } = req.params;
        const { amount, paymentMethod, transactionId, paymentStatus } = req.body;

        const bill = await billingModel.findById(billId);
        if (!bill) {
            return res.json({ success: false, message: 'Bill not found' });
        }

        // If only updating payment status
        if (paymentStatus && !amount) {
            bill.paymentStatus = paymentStatus;
            await bill.save();
            return res.json({ success: true, message: 'Payment status updated successfully' });
        }

        // If processing actual payment
        if (amount && paymentMethod) {
            // Generate payment ID
            const paymentId = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;

            // Add payment
            bill.payments.push({
                paymentId,
                amount: Number(amount),
                paymentMethod,
                transactionId: transactionId || paymentId,
                paymentDate: new Date(),
                status: 'Success'
            });

            // Update payment status based on amount paid
            const totalPaid = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
            if (totalPaid >= bill.totalAmount) {
                bill.paymentStatus = 'Paid';
            } else if (totalPaid > 0) {
                bill.paymentStatus = 'Partially Paid';
            }

            await bill.save();
            return res.json({ success: true, message: 'Payment processed successfully', paymentId });
        }

        return res.json({ success: false, message: 'Invalid request data' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get patient bills
const getPatientBills = async (req, res) => {
    try {
        const { patientId } = req.params;

        const bills = await billingModel.find({ patientId })
            .select('-__v')
            .sort({ billingDate: -1 })
            .populate('doctorId', 'name speciality');

        res.json({ success: true, bills });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update bill
const updateBill = async (req, res) => {
    try {
        const { billId } = req.params;
        const updateData = { ...req.body };

        // Parse JSON fields if they exist
        if (updateData.services && typeof updateData.services === 'string') {
            updateData.services = JSON.parse(updateData.services);
        }
        if (updateData.insurance && typeof updateData.insurance === 'string') {
            updateData.insurance = JSON.parse(updateData.insurance);
        }

        const updatedBill = await billingModel.findByIdAndUpdate(billId, updateData, { new: true });
        
        if (!updatedBill) {
            return res.json({ success: false, message: 'Bill not found' });
        }

        res.json({ success: true, message: 'Bill updated successfully', bill: updatedBill });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Generate financial report
const generateFinancialReport = async (req, res) => {
    try {
        const { startDate, endDate, reportType } = req.query;

        let matchFilter = {};
        if (startDate && endDate) {
            matchFilter.billingDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        let report = {};

        if (reportType === 'revenue' || !reportType) {
            // Revenue report
            const revenueData = await billingModel.aggregate([
                { $match: { ...matchFilter, paymentStatus: 'Paid' } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$billingDate' },
                            month: { $month: '$billingDate' },
                            billType: '$billType'
                        },
                        totalAmount: { $sum: '$totalAmount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            const totalRevenue = await billingModel.aggregate([
                { $match: { ...matchFilter, paymentStatus: 'Paid' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
            ]);

            report.revenue = {
                breakdown: revenueData,
                total: totalRevenue[0] || { total: 0, count: 0 }
            };
        }

        if (reportType === 'pending' || !reportType) {
            // Pending payments report
            const pendingPayments = await billingModel.find({
                ...matchFilter,
                paymentStatus: { $in: ['Pending', 'Partial'] }
            }).select('billNumber patientName totalAmount paymentStatus billingDate dueDate');

            const pendingAmount = await billingModel.aggregate([
                { $match: { ...matchFilter, paymentStatus: { $in: ['Pending', 'Partial'] } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
            ]);

            report.pending = {
                bills: pendingPayments,
                summary: pendingAmount[0] || { total: 0, count: 0 }
            };
        }

        res.json({ success: true, report });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Delete bill
const deleteBill = async (req, res) => {
    try {
        const { billId } = req.params;
        
        const deletedBill = await billingModel.findByIdAndDelete(billId);
        
        if (!deletedBill) {
            return res.json({ success: false, message: 'Bill not found' });
        }

        res.json({ success: true, message: 'Bill deleted successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    createBill,
    getAllBills,
    getBillById,
    processPayment,
    getPatientBills,
    updateBill,
    generateFinancialReport,
    deleteBill
};
