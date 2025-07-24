import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';

const AdmissionHistory = ({ 
    backendUrl, 
    token, 
    patientId = null, 
    doctorId = null, 
    title = "Admission History",
    showRole = false 
}) => {
    const [admissions, setAdmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdmissions = async () => {
            try {
                setLoading(true);
                let url;
                
                if (patientId) {
                    url = `${backendUrl}/api/admin/patient-admissions/${patientId}`;
                } else if (doctorId) {
                    url = `${backendUrl}/api/doctor/admissions/${doctorId}`;
                } else {
                    throw new Error('Either patientId or doctorId must be provided');
                }

                const response = await fetch(url, {
                    headers: { 
                        'aToken': patientId ? token : '',
                        'dToken': doctorId ? token : ''
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    setAdmissions(data.admissions || []);
                } else {
                    toast.error(data.message || 'Failed to fetch admissions');
                }
            } catch (error) {
                console.error('Error fetching admissions:', error);
                toast.error('Failed to fetch admission history');
            } finally {
                setLoading(false);
            }
        };

        if ((patientId || doctorId) && token) {
            fetchAdmissions();
        }
    }, [patientId, doctorId, token, backendUrl]);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'admitted': return 'text-blue-600 bg-blue-100';
            case 'discharged': return 'text-green-600 bg-green-100';
            case 'transferred': return 'text-orange-600 bg-orange-100';
            case 'cancelled': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const calculateStayDuration = (admissionDate, dischargeDate) => {
        const start = new Date(admissionDate);
        const end = dischargeDate ? new Date(dischargeDate) : new Date();
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const calculateExpectedStayDuration = (admissionDate, expectedDischargeDate) => {
        if (!expectedDischargeDate) return null;
        const start = new Date(admissionDate);
        const end = new Date(expectedDischargeDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const viewAdmissionReceipt = (admission) => {
        const receiptWindow = window.open('', '_blank', 'width=800,height=600');
        const receiptContent = generateAdmissionReceiptHTML(admission);
        receiptWindow.document.write(receiptContent);
        receiptWindow.document.close();
    };

    const printAdmissionReceipt = (admission) => {
        const receiptContent = generateAdmissionReceiptHTML(admission);
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const viewBill = (admission) => {
        const billWindow = window.open('', '_blank', 'width=800,height=600');
        const billContent = generateBillHTML(admission);
        billWindow.document.write(billContent);
        billWindow.document.close();
    };

    const printBill = (admission) => {
        const billContent = generateBillHTML(admission);
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(billContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const generateAdmissionReceiptHTML = (admission) => {
        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

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
                            <span class="value">${admission.admissionId || admission._id}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Date:</span>
                            <span class="value">${admissionDate}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Room No:</span>
                            <span class="value">${admission.roomDetails?.roomNumber || admission.roomDetails?.bedNumber || 'N/A'}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Doctor:</span>
                            <span class="value">${admission.doctorName || 'N/A'}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Diagnosis:</span>
                            <span class="value">${admission.initialDiagnosis || admission.admissionReason || 'N/A'}</span>
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
    };

    const generateBillHTML = (admission) => {
        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

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
                            <span class="value">${admission.admissionId || admission._id}</span>
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
                            <span class="value">${admission.roomDetails?.roomNumber || admission.roomDetails?.bedNumber || 'N/A'}</span>
                        </div>
                        <div class="info-group">
                            <span class="label">Attending Doctor:</span>
                            <span class="value">${admission.doctorName || 'N/A'}</span>
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
                            <td>₹${admission.roomDetails?.dailyCharges || 0}/day</td>
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
    };

    if (loading) {
        return (
            <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">{title}</h3>
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            
            {admissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <p>No admission records found</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {admissions.map((admission) => (
                        <div key={admission._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-medium text-gray-900">
                                        {admission.admissionId || 'N/A'}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {patientId ? admission.doctorName : admission.patientName}
                                    </p>
                                    {showRole && admission.doctorRole && (
                                        <p className="text-xs text-blue-600 font-medium">
                                            {admission.doctorRole}
                                        </p>
                                    )}
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(admission.status)}`}>
                                    {admission.status || 'Unknown'}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-500">Department:</span>
                                    <p className="font-medium">{admission.department || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Room:</span>
                                    <p className="font-medium">
                                        {admission.roomDetails?.roomNumber || admission.roomDetails?.bedNumber || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Admission Date:</span>
                                    <p className="font-medium">
                                        {new Date(admission.admissionDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Duration:</span>
                                    <p className="font-medium">
                                        {calculateStayDuration(admission.admissionDate, admission.actualDischargeDate)} days
                                    </p>
                                </div>
                            </div>
                            
                            {admission.admissionReason && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <span className="text-gray-500 text-sm">Reason:</span>
                                    <p className="text-sm text-gray-700 mt-1">{admission.admissionReason}</p>
                                </div>
                            )}
                            
                            {admission.totalCharges && (
                                <div className="mt-2">
                                    <span className="text-gray-500 text-sm">Total Charges:</span>
                                    <p className="text-sm font-medium text-green-600">₹{admission.totalCharges}</p>
                                </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="mt-4 pt-3 border-t border-gray-100">
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
                                    {admission.status !== 'Active' && admission.status !== 'Admitted' && (
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

AdmissionHistory.propTypes = {
    backendUrl: PropTypes.string.isRequired,
    token: PropTypes.string.isRequired,
    patientId: PropTypes.string,
    doctorId: PropTypes.string,
    title: PropTypes.string,
    showRole: PropTypes.bool
};

export default AdmissionHistory;
