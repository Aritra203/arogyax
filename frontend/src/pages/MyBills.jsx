import { useContext, useEffect, useState, useCallback } from 'react'
import { AppContext } from '../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const MyBills = () => {
    const { backendUrl, token, userData } = useContext(AppContext)
    const [bills, setBills] = useState([])
    const [loading, setLoading] = useState(false)

    const getUserBills = useCallback(async () => {
        try {
            setLoading(true)
            console.log('Making API call to:', backendUrl + '/api/user/bills')
            console.log('Token:', token)
            const { data } = await axios.get(backendUrl + '/api/user/bills', { headers: { token } })
            console.log('API Response:', data)
            
            if (data.success) {
                setBills(data.bills.reverse()) // Show latest bills first
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log('API Error:', error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }, [backendUrl, token])

    const handlePayBill = async (billId) => {
        try {
            setLoading(true)
            const { data } = await axios.post(backendUrl + '/api/user/pay-bill', 
                { billId, paymentMethod: 'Dummy Payment' }, 
                { headers: { token } }
            )
            
            if (data.success) {
                toast.success('Bill paid successfully!')
                
                // Automatically generate receipt after successful payment
                setTimeout(() => {
                    toast.info('Generating receipt...')
                    generateReceipt(data.bill)
                }, 1000) // Small delay to ensure UI updates
                
                getUserBills() // Refresh bills
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const generateReceipt = (bill) => {
        const receiptWindow = window.open('', '_blank', 'width=800,height=600')
        
        // Format date properly
        const formatDate = (dateString) => {
            if (!dateString) return new Date().toLocaleDateString()
            const date = new Date(dateString)
            return isNaN(date.getTime()) ? new Date().toLocaleDateString() : date.toLocaleDateString()
        }
        
        const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Receipt - ${bill.billNumber}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .receipt-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #3B82F6;
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                }
                .hospital-name {
                    font-size: 24px;
                    font-weight: bold;
                    color: #3B82F6;
                    margin: 0;
                }
                .receipt-title {
                    font-size: 18px;
                    color: #666;
                    margin: 5px 0;
                }
                .receipt-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                .info-section {
                    flex: 1;
                }
                .info-label {
                    font-weight: bold;
                    color: #333;
                }
                .info-value {
                    color: #666;
                    margin-bottom: 10px;
                }
                .payment-details {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .amount-section {
                    text-align: center;
                    margin: 20px 0;
                    padding: 15px;
                    background-color: #e7f3ff;
                    border-radius: 8px;
                }
                .total-amount {
                    font-size: 24px;
                    font-weight: bold;
                    color: #3B82F6;
                }
                .status-paid {
                    background-color: #10B981;
                    color: white;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-weight: bold;
                    display: inline-block;
                }
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .items-table th,
                .items-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                .items-table th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #666;
                    font-size: 12px;
                }
                .print-button {
                    background-color: #3B82F6;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 20px auto;
                    display: block;
                    font-size: 16px;
                }
                .print-button:hover {
                    background-color: #2563EB;
                }
                @media print {
                    body { background-color: white; }
                    .print-button { display: none; }
                    .receipt-container { box-shadow: none; }
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="header">
                    <h1 class="hospital-name">ArogyaX Hospital</h1>
                    <p class="receipt-title">Payment Receipt</p>
                </div>
                
                <div class="receipt-info">
                    <div class="info-section">
                        <div class="info-label">Receipt No:</div>
                        <div class="info-value">${bill.billNumber}</div>
                        
                        <div class="info-label">Patient Name:</div>
                        <div class="info-value">${bill.patientName}</div>
                        
                        <div class="info-label">Contact:</div>
                        <div class="info-value">${bill.patientContact}</div>
                    </div>
                    <div class="info-section">
                        <div class="info-label">Payment Date:</div>
                        <div class="info-value">${formatDate(bill.paidDate)}</div>
                        
                        <div class="info-label">Bill Type:</div>
                        <div class="info-value">${bill.billType}</div>
                        
                        <div class="info-label">Status:</div>
                        <div class="info-value">
                            <span class="status-paid">${bill.paymentStatus}</span>
                        </div>
                    </div>
                </div>

                <div class="payment-details">
                    <div class="info-label">Payment Method:</div>
                    <div class="info-value">${bill.paymentMethod || 'Dummy Payment'}</div>
                    
                    <div class="info-label">Transaction ID:</div>
                    <div class="info-value">TXN${bill._id.slice(-8).toUpperCase()}</div>
                </div>

                ${bill.items && bill.items.length > 0 ? `
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bill.items.map(item => `
                            <tr>
                                <td>${item.description}</td>
                                <td>${item.quantity}</td>
                                <td>₹${parseFloat(item.amount).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : ''}

                <div class="amount-section">
                    <div class="info-label">Total Amount Paid:</div>
                    <div class="total-amount">₹${parseFloat(bill.totalAmount).toFixed(2)}</div>
                </div>

                <button class="print-button" onclick="window.print()">Print Receipt</button>

                <div class="footer">
                    <p>Thank you for choosing ArogyaX Hospital</p>
                    <p>This is a computer-generated receipt and does not require a signature.</p>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                </div>
            </div>
        </body>
        </html>
        `
        
        receiptWindow.document.write(receiptHTML)
        receiptWindow.document.close()
        
        // Auto-print after a small delay
        setTimeout(() => {
            receiptWindow.print()
        }, 500)
    }

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'paid': return 'text-green-600 bg-green-100'
            case 'pending': return 'text-yellow-600 bg-yellow-100'
            case 'partially paid': return 'text-blue-600 bg-blue-100'
            case 'overdue': return 'text-red-600 bg-red-100'
            default: return 'text-gray-600 bg-gray-100'
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount).toFixed(2)}`
    }

    useEffect(() => {
        if (token && userData) {
            getUserBills()
        }
    }, [token, userData, getUserBills])

    if (loading && bills.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your bills...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">My Bills</h1>
                <p className="text-gray-600">View and manage your medical bills</p>
            </div>

            {bills.length === 0 ? (
                <div className="text-center py-12">
                    <div className="mb-4">
                        <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bills found</h3>
                    <p className="text-gray-500">You do not have any medical bills yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bills.map((bill) => (
                        <div key={bill._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                <div className="mb-4 md:mb-0">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Bill #{bill.billNumber}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Date: {formatDate(bill.billDate)}
                                    </p>
                                    {bill.paidDate && (
                                        <p className="text-sm text-gray-600">
                                            Paid: {formatDate(bill.paidDate)}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col md:items-end">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 ${getStatusColor(bill.paymentStatus)}`}>
                                        {bill.paymentStatus}
                                    </span>
                                    <p className="text-xl font-bold text-gray-800">
                                        {formatCurrency(bill.totalAmount)}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Patient</p>
                                        <p className="text-gray-800">{bill.patientName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Contact</p>
                                        <p className="text-gray-800">{bill.patientContact}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Bill Type</p>
                                        <p className="text-gray-800">{bill.billType}</p>
                                    </div>
                                    {bill.paymentMethod && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Payment Method</p>
                                            <p className="text-gray-800">{bill.paymentMethod}</p>
                                        </div>
                                    )}
                                </div>

                                {bill.items && bill.items.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-sm font-medium text-gray-600 mb-2">Items</p>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            {bill.items.map((item, index) => (
                                                <div key={index} className="flex justify-between items-center py-1">
                                                    <span className="text-sm text-gray-700">
                                                        {item.description} (Qty: {item.quantity})
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-800">
                                                        {formatCurrency(item.amount)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    {bill.paymentStatus !== 'Paid' ? (
                                        <button
                                            onClick={() => handlePayBill(bill._id)}
                                            disabled={loading}
                                            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Processing...' : 'Pay Now (Dummy)'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => generateReceipt(bill)}
                                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Download Receipt
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default MyBills
