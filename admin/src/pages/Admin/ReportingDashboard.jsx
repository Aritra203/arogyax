import { useContext, useEffect, useState, useCallback } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'
import PropTypes from 'prop-types'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const ReportingDashboard = () => {
    const { aToken, backendUrl } = useContext(AdminContext)
    const [reportData, setReportData] = useState({
        appointments: { total: 0, pending: 0, completed: 0, cancelled: 0 },
        doctors: { total: 0, available: 0, unavailable: 0 },
        patients: { total: 0, newThisMonth: 0 },
        billing: { totalRevenue: 0, pendingPayments: 0, paidBills: 0 },
        inventory: { totalItems: 0, lowStock: 0, expiring: 0 },
        admissions: { currentAdmissions: 0, dischargedToday: 0, totalRooms: 0, occupiedRooms: 0 },
        staff: { totalStaff: 0, activeStaff: 0 }
    })
    const [detailedData, setDetailedData] = useState({
        appointments: [],
        doctors: [],
        patients: [],
        admissions: [],
        billing: [],
        inventory: [],
        staff: []
    })
    const [loading, setLoading] = useState(true)
    const [selectedDateRange, setSelectedDateRange] = useState('month')
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })
    const [selectedReport, setSelectedReport] = useState('overview')

    const dateRangeOptions = [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'quarter', label: 'This Quarter' },
        { value: 'year', label: 'This Year' },
        { value: 'custom', label: 'Custom Range' }
    ]

    const reportOptions = [
        { value: 'overview', label: 'Overview Dashboard' },
        { value: 'appointments', label: 'Appointments Report' },
        { value: 'financial', label: 'Financial Report' },
        { value: 'admissions', label: 'Admissions Report' },
        { value: 'inventory', label: 'Inventory Report' },
        { value: 'doctors', label: 'Doctors Report' },
        { value: 'patients', label: 'Patients Report' },
        { value: 'staff', label: 'Staff Report' }
    ]

    const fetchDetailedData = useCallback(async () => {
        try {
            const endpoints = [
                { key: 'appointments', url: '/api/admin/all-appointments' },
                { key: 'doctors', url: '/api/admin/all-doctors' },
                { key: 'patients', url: '/api/admin/all-patients' },
                { key: 'admissions', url: '/api/admin/all-admissions' },
                { key: 'billing', url: '/api/admin/all-billing' },
                { key: 'inventory', url: '/api/admin/all-inventory' },
                { key: 'staff', url: '/api/admin/all-staff' }
            ]

            const newDetailedData = {}

            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(`${backendUrl}${endpoint.url}`, {
                        headers: { 'aToken': aToken }
                    })
                    const data = await response.json()
                    newDetailedData[endpoint.key] = data.success ? (data.data || data[endpoint.key] || []) : []
                } catch (error) {
                    console.log(`Error fetching ${endpoint.key}:`, error)
                    newDetailedData[endpoint.key] = []
                }
            }

            setDetailedData(newDetailedData)
        } catch (error) {
            console.error('Error fetching detailed data:', error)
        }
    }, [backendUrl, aToken])

    const fetchReportData = useCallback(async () => {
        setLoading(true)
        try {
            // Fetch summary data
            const params = new URLSearchParams()
            params.append('dateRange', selectedDateRange)
            
            if (selectedDateRange === 'custom' && customDateRange.start && customDateRange.end) {
                params.append('startDate', customDateRange.start)
                params.append('endDate', customDateRange.end)
            }

            const response = await fetch(`${backendUrl}/api/reports/dashboard?${params}`, {
                headers: { 'aToken': aToken }
            })
            
            const data = await response.json()
            
            if (data.success) {
                setReportData(data.data)
            } else {
                toast.error(data.message || 'Failed to fetch report data')
            }

            // Fetch detailed data for exports
            await fetchDetailedData()
            
        } catch (error) {
            console.error('Error fetching report data:', error)
            toast.error('Failed to fetch report data')
        } finally {
            setLoading(false)
        }
    }, [selectedDateRange, customDateRange, backendUrl, aToken, fetchDetailedData])

    const exportToPDF = () => {
        try {
            const doc = new jsPDF()
            const pageTitle = `AROGYA-X Hospital - ${reportOptions.find(opt => opt.value === selectedReport)?.label || 'Report'}`
            
            // Add title
            doc.setFontSize(16)
            doc.text(pageTitle, 20, 20)
            doc.setFontSize(10)
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)
            doc.text(`Date Range: ${dateRangeOptions.find(opt => opt.value === selectedDateRange)?.label}`, 20, 35)

            let yPosition = 50

            if (selectedReport === 'overview') {
                // Overview Dashboard
                const overviewData = [
                    ['Metric', 'Total', 'Details'],
                    ['Appointments', reportData.appointments.total, `Pending: ${reportData.appointments.pending}, Completed: ${reportData.appointments.completed}, Cancelled: ${reportData.appointments.cancelled}`],
                    ['Doctors', reportData.doctors.total, `Available: ${reportData.doctors.available}, Unavailable: ${reportData.doctors.unavailable}`],
                    ['Patients', reportData.patients.total, `New This Month: ${reportData.patients.newThisMonth}`],
                    ['Current Admissions', reportData.admissions.currentAdmissions, `Discharged Today: ${reportData.admissions.dischargedToday}`],
                    ['Revenue', `₹${reportData.billing.totalRevenue}`, `Pending: ₹${reportData.billing.pendingPayments}, Paid Bills: ${reportData.billing.paidBills}`],
                    ['Inventory', reportData.inventory.totalItems, `Low Stock: ${reportData.inventory.lowStock}, Expiring: ${reportData.inventory.expiring}`],
                    ['Staff', reportData.staff.totalStaff, `Active: ${reportData.staff.activeStaff}`]
                ]

                doc.autoTable({
                    head: [overviewData[0]],
                    body: overviewData.slice(1),
                    startY: yPosition,
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [41, 128, 185] }
                })
            } else {
                // Specific report data
                const currentData = detailedData[selectedReport] || []
                if (currentData.length > 0) {
                    const headers = Object.keys(currentData[0]).filter(key => !key.startsWith('_') && key !== '__v')
                    const tableData = currentData.map(item => 
                        headers.map(header => {
                            const value = item[header]
                            if (typeof value === 'object' && value !== null) {
                                return JSON.stringify(value).substring(0, 30) + '...'
                            }
                            return String(value || '').substring(0, 30)
                        })
                    )

                    doc.autoTable({
                        head: [headers],
                        body: tableData,
                        startY: yPosition,
                        styles: { fontSize: 8 },
                        headStyles: { fillColor: [41, 128, 185] }
                    })
                }
            }

            doc.save(`${selectedReport}-report-${new Date().toISOString().split('T')[0]}.pdf`)
            toast.success('PDF exported successfully!')
        } catch (error) {
            console.error('Error exporting PDF:', error)
            toast.error('Failed to export PDF')
        }
    }

    const exportToExcel = () => {
        try {
            const wb = XLSX.utils.book_new()

            if (selectedReport === 'overview') {
                // Overview sheet
                const overviewData = [
                    ['Metric', 'Total', 'Details'],
                    ['Appointments', reportData.appointments.total, `Pending: ${reportData.appointments.pending}, Completed: ${reportData.appointments.completed}, Cancelled: ${reportData.appointments.cancelled}`],
                    ['Doctors', reportData.doctors.total, `Available: ${reportData.doctors.available}, Unavailable: ${reportData.doctors.unavailable}`],
                    ['Patients', reportData.patients.total, `New This Month: ${reportData.patients.newThisMonth}`],
                    ['Current Admissions', reportData.admissions.currentAdmissions, `Discharged Today: ${reportData.admissions.dischargedToday}`],
                    ['Revenue', `₹${reportData.billing.totalRevenue}`, `Pending: ₹${reportData.billing.pendingPayments}, Paid Bills: ${reportData.billing.paidBills}`],
                    ['Inventory', reportData.inventory.totalItems, `Low Stock: ${reportData.inventory.lowStock}, Expiring: ${reportData.inventory.expiring}`],
                    ['Staff', reportData.staff.totalStaff, `Active: ${reportData.staff.activeStaff}`]
                ]

                const ws = XLSX.utils.aoa_to_sheet(overviewData)
                XLSX.utils.book_append_sheet(wb, ws, 'Overview')
            } else {
                // Specific report data
                const currentData = detailedData[selectedReport] || []
                if (currentData.length > 0) {
                    const ws = XLSX.utils.json_to_sheet(currentData)
                    XLSX.utils.book_append_sheet(wb, ws, reportOptions.find(opt => opt.value === selectedReport)?.label || 'Report')
                }
            }

            XLSX.writeFile(wb, `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.xlsx`)
            toast.success('Excel exported successfully!')
        } catch (error) {
            console.error('Error exporting Excel:', error)
            toast.error('Failed to export Excel')
        }
    }

    useEffect(() => {
        if (aToken) {
            fetchReportData()
        }
    }, [aToken, selectedDateRange, customDateRange, fetchReportData])

    const StatCard = ({ title, value, subtitle, color = 'blue' }) => (
        <div className={`bg-white p-6 rounded-lg border-l-4 border-${color}-500 shadow-sm hover:shadow-md transition-shadow`}>
            <div className='flex items-center justify-between'>
                <div>
                    <p className='text-gray-500 text-sm font-medium uppercase tracking-wide'>{title}</p>
                    <p className='text-3xl font-bold text-gray-900 mt-2'>{value}</p>
                    {subtitle && <p className='text-sm text-gray-600 mt-1'>{subtitle}</p>}
                </div>
            </div>
        </div>
    )

    StatCard.propTypes = {
        title: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        subtitle: PropTypes.string,
        color: PropTypes.string
    }

    const renderOverviewDashboard = () => (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Appointments" 
                    value={reportData.appointments.total}
                    subtitle={`${reportData.appointments.pending} pending`}
                    color="blue"
                />
                <StatCard 
                    title="Active Doctors" 
                    value={reportData.doctors.available}
                    subtitle={`${reportData.doctors.total} total doctors`}
                    color="green"
                />
                <StatCard 
                    title="Total Patients" 
                    value={reportData.patients.total}
                    subtitle={`${reportData.patients.newThisMonth} new this month`}
                    color="purple"
                />
                <StatCard 
                    title="Revenue" 
                    value={`₹${reportData.billing.totalRevenue.toLocaleString()}`}
                    subtitle={`₹${reportData.billing.pendingPayments.toLocaleString()} pending`}
                    color="yellow"
                />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Current Admissions" 
                    value={reportData.admissions.currentAdmissions}
                    subtitle={`${reportData.admissions.dischargedToday} discharged today`}
                    color="indigo"
                />
                <StatCard 
                    title="Inventory Items" 
                    value={reportData.inventory.totalItems}
                    subtitle={`${reportData.inventory.lowStock} low stock, ${reportData.inventory.expiring} expiring`}
                    color="red"
                />
                <StatCard 
                    title="Active Staff" 
                    value={reportData.staff.activeStaff}
                    subtitle={`${reportData.staff.totalStaff} total staff`}
                    color="teal"
                />
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Appointments Breakdown */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointments Breakdown</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Completed</span>
                            <span className="text-green-600 font-semibold">{reportData.appointments.completed}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Pending</span>
                            <span className="text-yellow-600 font-semibold">{reportData.appointments.pending}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Cancelled</span>
                            <span className="text-red-600 font-semibold">{reportData.appointments.cancelled}</span>
                        </div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Revenue</span>
                            <span className="text-green-600 font-semibold">₹{reportData.billing.totalRevenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Pending Payments</span>
                            <span className="text-yellow-600 font-semibold">₹{reportData.billing.pendingPayments.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Paid Bills</span>
                            <span className="text-blue-600 font-semibold">{reportData.billing.paidBills}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderDetailedReport = () => {
        const currentData = detailedData[selectedReport] || []
        
        if (currentData.length === 0) {
            return (
                <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                    <p className="text-gray-500">No data available for this report</p>
                </div>
            )
        }

        return (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {reportOptions.find(opt => opt.value === selectedReport)?.label} - Detailed Data
                    </h3>
                    <p className="text-sm text-gray-600">Total records: {currentData.length}</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {currentData[0] && Object.keys(currentData[0])
                                    .filter(key => !key.startsWith('_') && key !== '__v')
                                    .slice(0, 6) // Limit columns for display
                                    .map(header => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentData.slice(0, 50).map((item, index) => ( // Limit rows for performance
                                <tr key={index} className="hover:bg-gray-50">
                                    {Object.keys(item)
                                        .filter(key => !key.startsWith('_') && key !== '__v')
                                        .slice(0, 6)
                                        .map(key => (
                                        <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {typeof item[key] === 'object' && item[key] !== null 
                                                ? JSON.stringify(item[key]).substring(0, 50) + '...'
                                                : String(item[key] || '').substring(0, 50)
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {currentData.length > 50 && (
                    <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600 text-center">
                        Showing first 50 records of {currentData.length}. Export to see all data.
                    </div>
                )}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className='m-5 w-full max-w-7xl'>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-gray-600">Comprehensive hospital management reports and insights</p>
            </div>

            {/* Controls */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    {/* Report Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                        <select 
                            value={selectedReport} 
                            onChange={(e) => setSelectedReport(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {reportOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                        <select 
                            value={selectedDateRange} 
                            onChange={(e) => setSelectedDateRange(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {dateRangeOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Custom Date Range */}
                    {selectedDateRange === 'custom' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={customDateRange.start}
                                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={customDateRange.end}
                                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </>
                    )}

                    {/* Export Buttons */}
                    <div className="flex gap-2">
                        <button 
                            onClick={exportToPDF}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                            Export PDF
                        </button>
                        <button 
                            onClick={exportToExcel}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                            Export Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            {selectedReport === 'overview' ? renderOverviewDashboard() : renderDetailedReport()}
        </div>
    )
}

export default ReportingDashboard
