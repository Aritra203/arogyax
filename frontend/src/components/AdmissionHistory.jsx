import { useState, useEffect } from 'react'
import axios from 'axios'
import PropTypes from 'prop-types'

const AdmissionHistory = ({ backendUrl, token, title = "My Admissions" }) => {
    const [admissions, setAdmissions] = useState([])
    const [loading, setLoading] = useState(false)

    const fetchAdmissions = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get(
                `${backendUrl}/api/user/admissions`,
                { headers: { token } }
            )
            
            if (data.success) {
                setAdmissions(data.admissions)
            } else {
                console.error('Failed to fetch admissions:', data.message)
            }
        } catch (error) {
            console.error('Error fetching admissions:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (backendUrl && token) {
            fetchAdmissions()
        }
    }, [backendUrl, token]) // eslint-disable-line react-hooks/exhaustive-deps

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const calculateStayDuration = (admissionDate, dischargeDate) => {
        const admission = new Date(admissionDate)
        const discharge = dischargeDate ? new Date(dischargeDate) : new Date()
        const diffTime = Math.abs(discharge - admission)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    const calculateExpectedStayDuration = (admissionDate, expectedDischargeDate) => {
        if (!expectedDischargeDate) return null;
        const start = new Date(admissionDate);
        const end = new Date(expectedDischargeDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    const viewAdmissionReceipt = (admission) => {
        const receiptWindow = window.open('', '_blank', 'width=800,height=600');
        const receiptContent = generateAdmissionReceiptHTML(admission);
        receiptWindow.document.write(receiptContent);
        receiptWindow.document.close();
    }

    const printAdmissionReceipt = (admission) => {
        const receiptContent = generateAdmissionReceiptHTML(admission);
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }

    const viewBill = (admission) => {
        const billWindow = window.open('', '_blank', 'width=800,height=600');
        const billContent = generateBillHTML(admission);
        billWindow.document.write(billContent);
        billWindow.document.close();
    }

    const printBill = (admission) => {
        const billContent = generateBillHTML(admission);
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(billContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }

    const generateAdmissionReceiptHTML = (admission) => {
        const admissionDate = formatDate(admission.admissionDate);
        const expectedStay = admission.expectedStayDuration || calculateExpectedStayDuration(admission.admissionDate, admission.expectedDischargeDate);
        const actualStay = calculateStayDuration(admission.admissionDate, admission.actualDischargeDate);
        const stayDuration = expectedStay || actualStay;
        
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admission Receipt</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background: white; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    .title { color: #333; font-size: 24px; margin: 0; }
                    .subtitle { color: #666; font-size: 16px; margin: 5px 0; }
                    .receipt-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .patient-info, .admission-info { flex: 1; margin: 0 10px; }
                    .info-group { margin-bottom: 15px; }
                    .label { font-weight: bold; color: #333; }
                    .value { color: #666; margin-left: 10px; }
                    .costs { border: 1px solid #ddd; padding: 15px; margin-top: 20px; background: #f9f9f9; }
                    .cost-row { display: flex; justify-content: space-between; margin: 5px 0; }
                    .total { border-top: 2px solid #333; padding-top: 10px; font-weight: bold; font-size: 18px; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 class="title">AROGYA-X HOSPITAL</h1>
                    <p class="subtitle">Admission Receipt</p>
                </div>
                
                <div class="receipt-info">
                    <div class="patient-info">
                        <h3>Patient Information</h3>
                        <div class="info-group">
                            <span class="label">Name:</span>
                            <span class="value">${admission.patientName || 'N/A'}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Age:</span>
                            <span class="value">${admission.age || 'N/A'}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Gender:</span>
                            <span class="value">${admission.gender || 'N/A'}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Emergency Contact:</span>
                            <span class="value">${admission.emergencyContact?.name || 'N/A'} (${admission.emergencyContact?.phone || 'N/A'})</span>
                        </div>
                    </div>
                    
                    <div class="admission-info">
                        <h3>Admission Details</h3>
                        <div class="info-group">
                            <span class="label">Admission No:</span>
                            <span class="value">${admission.admissionNumber}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Date:</span>
                            <span class="value">${admissionDate}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Room No:</span>
                            <span class="value">${admission.roomNumber}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Doctor:</span>
                            <span class="value">${admission.doctorName || admission.attendingDoctor?.name || 'N/A'}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Diagnosis:</span>
                            <span class="value">${admission.diagnosis}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Status:</span>
                            <span class="value">${admission.status}</span>
                        </div>
                    </div>
                </div>
                
                <div class="costs">
                    <h3>Cost Breakdown</h3>
                    <div class="cost-row">
                        <span>Daily Room Charges:</span>
                        <span>₹${admission.roomDetails?.dailyCharges || 0}</span>
                    </div>
                    <div class="cost-row">
                        <span>Expected Stay Duration:</span>
                        <span>${expectedStay ? expectedStay + ' days' : 'Not specified'}</span>
                    </div>
                    <div class="cost-row">
                        <span>Estimated Room Cost:</span>
                        <span>₹${(admission.roomDetails?.dailyCharges || 0) * stayDuration}</span>
                    </div>
                    ${admission.totalCharges ? `
                    <div class="cost-row total">
                        <span>Total Amount:</span>
                        <span>₹${admission.totalCharges}</span>
                    </div>` : ''}
                </div>
                
                <div class="footer">
                    <p>This is a computer-generated receipt.</p>
                    <p>For any queries, please contact the hospital administration.</p>
                    <p>Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</p>
                </div>
            </body>
            </html>
        `;
    }

    const generateBillHTML = (admission) => {
        const admissionDate = formatDate(admission.admissionDate);
        const dischargeDate = admission.actualDischargeDate ? formatDate(admission.actualDischargeDate) : 'N/A';
        const expectedStay = admission.expectedStayDuration || calculateExpectedStayDuration(admission.admissionDate, admission.expectedDischargeDate);
        const actualStay = calculateStayDuration(admission.admissionDate, admission.actualDischargeDate);
        const stayDuration = actualStay > 0 ? actualStay : (expectedStay || 1);
        const roomCharges = (admission.roomDetails?.dailyCharges || 0) * stayDuration;
        const totalAmount = admission.totalCharges || roomCharges;
        
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Hospital Bill</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background: white; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    .title { color: #333; font-size: 24px; margin: 0; }
                    .subtitle { color: #666; font-size: 16px; margin: 5px 0; }
                    .bill-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .patient-info, .bill-details { flex: 1; margin: 0 10px; }
                    .info-group { margin-bottom: 15px; }
                    .label { font-weight: bold; color: #333; }
                    .value { color: #666; margin-left: 10px; }
                    .charges-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .charges-table th, .charges-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    .charges-table th { background-color: #f5f5f5; font-weight: bold; }
                    .charges-table tr:nth-child(even) { background-color: #f9f9f9; }
                    .total-row { background-color: #e8f4fd !important; font-weight: bold; font-size: 16px; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 class="title">AROGYA-X HOSPITAL</h1>
                    <p class="subtitle">Final Hospital Bill</p>
                </div>
                
                <div class="bill-info">
                    <div class="patient-info">
                        <h3>Patient Information</h3>
                        <div class="info-group">
                            <span class="label">Name:</span>
                            <span class="value">${admission.patientName || 'N/A'}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Age:</span>
                            <span class="value">${admission.age || 'N/A'}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Gender:</span>
                            <span class="value">${admission.gender || 'N/A'}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Admission No:</span>
                            <span class="value">${admission.admissionNumber}</span>
                        </div>
                    </div>
                    
                    <div class="bill-details">
                        <h3>Stay Details</h3>
                        <div class="info-group">
                            <span class="label">Admission Date:</span>
                            <span class="value">${admissionDate}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Discharge Date:</span>
                            <span class="value">${dischargeDate}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Total Stay:</span>
                            <span class="value">${stayDuration} days</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Room No:</span>
                            <span class="value">${admission.roomNumber}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Attending Doctor:</span>
                            <span class="value">${admission.doctorName || admission.attendingDoctor?.name || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <table class="charges-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Rate</th>
                            <th>Quantity/Days</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Room Charges (${admission.roomDetails?.roomType || 'General'})</td>
                            <td>₹${admission.estimatedDailyCost || 0}/day</td>
                            <td>${stayDuration} days</td>
                            <td>₹${roomCharges}</td>
                        </tr>
                        <tr>
                            <td>Medical Services</td>
                            <td>-</td>
                            <td>-</td>
                            <td>₹${totalAmount - roomCharges || 0}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3"><strong>TOTAL AMOUNT</strong></td>
                            <td><strong>₹${totalAmount}</strong></td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="footer">
                    <p><strong>Thank you for choosing Arogya-X Hospital</strong></p>
                    <p>This is a computer-generated bill.</p>
                    <p>For any queries, please contact the billing department.</p>
                    <p>Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</p>
                </div>
            </body>
            </html>
        `;
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
                <p className="text-gray-500">Loading admissions...</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
            
            {admissions.length === 0 ? (
                <p className="text-gray-500">No admissions found.</p>
            ) : (
                <div className="space-y-4">
                    {admissions.map((admission) => (
                        <div key={admission._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Admission Number</p>
                                    <p className="font-medium text-gray-800">{admission.admissionNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Room Number</p>
                                    <p className="font-medium text-gray-800">{admission.roomNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Admission Date</p>
                                    <p className="font-medium text-gray-800">{formatDate(admission.admissionDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Admitting Doctor</p>
                                    <p className="font-medium text-gray-800">{admission.admittingDoctor?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Attending Doctor</p>
                                    <p className="font-medium text-gray-800">{admission.attendingDoctor?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Status</p>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                        admission.status === 'Active' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {admission.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Stay Duration</p>
                                    <p className="font-medium text-gray-800">
                                        {calculateStayDuration(admission.admissionDate, admission.dischargeDate)} days
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Diagnosis</p>
                                    <p className="font-medium text-gray-800">{admission.diagnosis || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Estimated Daily Cost</p>
                                    <p className="font-medium text-gray-800">₹{admission.estimatedDailyCost || 'N/A'}</p>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => viewAdmissionReceipt(admission)}
                                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                                    >
                                        View Receipt
                                    </button>
                                    <button
                                        onClick={() => printAdmissionReceipt(admission)}
                                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                                    >
                                        Print Receipt
                                    </button>
                                    {admission.status !== 'Active' && (
                                        <>
                                            <button
                                                onClick={() => viewBill(admission)}
                                                className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors"
                                            >
                                                View Bill
                                            </button>
                                            <button
                                                onClick={() => printBill(admission)}
                                                className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors"
                                            >
                                                Print Bill
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {admission.dischargeDate && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Discharge Date</p>
                                            <p className="font-medium text-gray-800">{formatDate(admission.dischargeDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Total Cost</p>
                                            <p className="font-medium text-gray-800">₹{admission.totalCost || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {admission.specialInstructions && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-600">Special Instructions</p>
                                    <p className="text-gray-800">{admission.specialInstructions}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

AdmissionHistory.propTypes = {
    backendUrl: PropTypes.string.isRequired,
    token: PropTypes.string.isRequired,
    title: PropTypes.string
}

export default AdmissionHistory
