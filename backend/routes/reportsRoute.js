import express from 'express'
import authAdmin from '../middleware/authAdmin.js'
import appointmentModel from '../models/appointmentModel.js'
import doctorModel from '../models/doctorModel.js'
import userModel from '../models/userModel.js'
import staffModel from '../models/staffModel.js'
import inventoryModel from '../models/inventoryModel.js'
import billingModel from '../models/billingModel.js'
import admissionModel from '../models/admissionModel.js'

const reportsRouter = express.Router()

// Get dashboard report data
reportsRouter.get('/dashboard', authAdmin, async (req, res) => {
    try {
        const { dateRange, startDate, endDate } = req.query
        
        let dateFilter = {}
        const now = new Date()
        
        switch (dateRange) {
            case 'today':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
                    }
                }
                break
            case 'week':
                const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
                dateFilter = { createdAt: { $gte: weekStart } }
                break
            case 'month':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
                    }
                }
                break
            case 'quarter':
                const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
                dateFilter = { createdAt: { $gte: quarterStart } }
                break
            case 'year':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.getFullYear(), 0, 1),
                        $lt: new Date(now.getFullYear() + 1, 0, 1)
                    }
                }
                break
            case 'custom':
                if (startDate && endDate) {
                    dateFilter = {
                        createdAt: {
                            $gte: new Date(startDate),
                            $lt: new Date(endDate)
                        }
                    }
                }
                break
        }

        // Appointments data
        const allAppointments = await appointmentModel.find({
            date: { $gte: dateFilter.createdAt?.$gte || new Date(0), $lt: dateFilter.createdAt?.$lt || new Date() }
        })
        const appointmentStats = {
            total: allAppointments.length,
            pending: allAppointments.filter(apt => !apt.isCompleted && !apt.cancelled).length,
            completed: allAppointments.filter(apt => apt.isCompleted).length,
            cancelled: allAppointments.filter(apt => apt.cancelled).length
        }

        // Doctors data
        const allDoctors = await doctorModel.find({})
        const doctorStats = {
            total: allDoctors.length,
            available: allDoctors.filter(doc => doc.available).length,
            busy: allDoctors.filter(doc => !doc.available).length
        }

        // Patients data
        const allPatients = await userModel.find({})
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const newPatientsThisMonth = await userModel.countDocuments({
            date: { $gte: thisMonthStart }
        })
        const patientStats = {
            total: allPatients.length,
            newThisMonth: newPatientsThisMonth
        }

        // Billing data
        const allBills = await billingModel.find(dateFilter)
        const billingStats = {
            totalRevenue: allBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0),
            pendingPayments: allBills
                .filter(bill => bill.paymentStatus === 'Pending')
                .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0),
            paidBills: allBills.filter(bill => bill.paymentStatus === 'Paid').length
        }

        // Inventory data
        const allInventoryItems = await inventoryModel.find({})
        const lowStockItems = allInventoryItems.filter(item => item.quantity <= item.reorderLevel)
        const expiringItems = allInventoryItems.filter(item => {
            if (!item.expiryDate) return false
            const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
            return daysUntilExpiry <= 30 && daysUntilExpiry > 0
        })
        const inventoryStats = {
            totalItems: allInventoryItems.length,
            lowStock: lowStockItems.length,
            expiring: expiringItems.length
        }

        // Admissions data
        const allAdmissions = await admissionModel.find({})
        const currentAdmissions = allAdmissions.filter(admission => admission.status === 'Admitted')
        const todayDischarges = await admissionModel.countDocuments({
            status: 'Discharged',
            dischargeDate: {
                $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
            }
        })
        const admissionStats = {
            currentAdmissions: currentAdmissions.length,
            dischargedToday: todayDischarges,
            totalRooms: 100, // This should come from a rooms collection in real implementation
            occupiedRooms: currentAdmissions.length
        }

        // Staff data
        const allStaff = await staffModel.find({})
        const staffStats = {
            totalStaff: allStaff.length,
            activeStaff: allStaff.filter(staff => staff.status === 'Active').length
        }

        const reportData = {
            appointments: appointmentStats,
            doctors: doctorStats,
            patients: patientStats,
            billing: billingStats,
            inventory: inventoryStats,
            admissions: admissionStats,
            staff: staffStats
        }

        res.json({ success: true, data: reportData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
})

// Export report data
reportsRouter.get('/export', authAdmin, async (req, res) => {
    try {
        const { reportType, format } = req.query
        
        // This is a placeholder for report export functionality
        // In a real implementation, you would generate PDF/Excel files here
        res.json({ 
            success: false, 
            message: 'Report export functionality not implemented yet' 
        })
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
})

export default reportsRouter
