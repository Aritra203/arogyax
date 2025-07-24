import { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'

const BillingManagement = () => {
    const { aToken, backendUrl } = useContext(AdminContext)
    const [bills, setBills] = useState([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingBill, setEditingBill] = useState(null)
    const [patients, setPatients] = useState([])
    const [doctors, setDoctors] = useState([])
    const [filterStatus, setFilterStatus] = useState('All')
    const [searchTerm, setSearchTerm] = useState('')
    const [dateRange, setDateRange] = useState({ start: '', end: '' })
    
    const [formData, setFormData] = useState({
        patientId: '',
        patientName: '',
        patientContact: '',
        billType: 'Consultation',
        doctorId: '',
        items: [{ description: '', quantity: 1, unitPrice: '', amount: '' }],
        subtotal: '',
        discount: 0,
        tax: 0,
        totalAmount: '',
        paymentMethod: 'Cash',
        paymentStatus: 'Pending',
        notes: ''
    })

    const billTypes = ['Consultation', 'Procedure', 'Surgery', 'Medicine', 'Lab Test', 'Room Charges', 'Emergency', 'Other']
    const paymentMethods = ['Cash', 'Card', 'UPI', 'Net Banking', 'Insurance', 'Cheque']
    const paymentStatuses = ['Pending', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled']
    const statuses = ['All', ...paymentStatuses]

    const fetchBills = async () => {
        try {
            const params = new URLSearchParams()
            if (filterStatus !== 'All') params.append('status', filterStatus)
            if (searchTerm) params.append('search', searchTerm)
            if (dateRange.start) params.append('startDate', dateRange.start)
            if (dateRange.end) params.append('endDate', dateRange.end)

            const response = await fetch(`${backendUrl}/api/admin/billing-list?${params}`, {
                headers: { 'aToken': aToken }
            })
            const data = await response.json()
            if (data.success) {
                setBills(data.bills)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Failed to fetch bills')
        }
    }

    const fetchPatientsAndDoctors = async () => {
        try {
            const [patientsResponse, doctorsResponse] = await Promise.all([
                fetch(`${backendUrl}/api/admin/all-users`, { headers: { 'aToken': aToken } }),
                fetch(`${backendUrl}/api/admin/all-doctors`, { headers: { 'aToken': aToken } })
            ])

            const patientsData = await patientsResponse.json()
            const doctorsData = await doctorsResponse.json()

            if (patientsData.success) setPatients(patientsData.users || [])
            if (doctorsData.success) setDoctors(doctorsData.doctors || [])
        } catch (error) {
            toast.error('Failed to fetch patients and doctors')
        }
    }

    useEffect(() => {
        if (aToken) {
            fetchBills()
            fetchPatientsAndDoctors()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aToken, filterStatus, searchTerm, dateRange])

    const calculateTotals = (items, discount, tax) => {
        const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
        const discountAmount = subtotal * (discount / 100)
        const taxAmount = (subtotal - discountAmount) * (tax / 100)
        const totalAmount = subtotal - discountAmount + taxAmount
        
        return { subtotal, totalAmount }
    }

    const updateItemAmount = (index, quantity, unitPrice) => {
        const amount = quantity * unitPrice
        const newItems = [...formData.items]
        newItems[index].amount = amount.toFixed(2)
        
        setFormData(prev => {
            const updatedData = { ...prev, items: newItems }
            const { subtotal, totalAmount } = calculateTotals(newItems, prev.discount, prev.tax)
            return {
                ...updatedData,
                subtotal: subtotal.toFixed(2),
                totalAmount: totalAmount.toFixed(2)
            }
        })
    }

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: 1, unitPrice: '', amount: '' }]
        }))
    }

    const removeItem = (index) => {
        if (formData.items.length === 1) return
        
        const newItems = formData.items.filter((_, i) => i !== index)
        setFormData(prev => {
            const { subtotal, totalAmount } = calculateTotals(newItems, prev.discount, prev.tax)
            return {
                ...prev,
                items: newItems,
                subtotal: subtotal.toFixed(2),
                totalAmount: totalAmount.toFixed(2)
            }
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        try {
            const url = editingBill
                ? `${backendUrl}/api/admin/billing-update/${editingBill._id}`
                : `${backendUrl}/api/admin/billing-create`
            
            const method = editingBill ? 'PUT' : 'POST'
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    aToken
                },
                body: JSON.stringify(formData)
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success(data.message)
                setShowAddForm(false)
                setEditingBill(null)
                resetForm()
                fetchBills()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Failed to save bill')
        }
    }

    const deleteBill = async (billId) => {
        if (!window.confirm('Are you sure you want to delete this bill?')) return

        try {
            const response = await fetch(`${backendUrl}/api/admin/billing-delete/${billId}`, {
                method: 'DELETE',
                headers: { 'aToken': aToken }
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success(data.message)
                fetchBills()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Failed to delete bill')
        }
    }

    const generateReceipt = async (billId) => {
        try {
            // Fetch the specific bill data
            const response = await fetch(`${backendUrl}/api/admin/billing/${billId}`, {
                headers: { 'aToken': aToken }
            })
            
            const data = await response.json()
            
            if (data.success) {
                const bill = data.bill
                
                // Create a new window for the receipt
                const receiptWindow = window.open('', '_blank', 'width=800,height=600')
                
                const receiptHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Bill Receipt - ${bill.billNumber}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                        .company-name { font-size: 24px; font-weight: bold; color: #333; }
                        .bill-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                        .patient-info, .bill-details { width: 48%; }
                        .services-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        .services-table th, .services-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        .services-table th { background-color: #f2f2f2; }
                        .total-section { margin-top: 20px; text-align: right; }
                        .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
                        .grand-total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; }
                        .footer { margin-top: 30px; text-align: center; color: #666; }
                        @media print {
                            body { margin: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="company-name">Arogya X Hospital</div>
                        <div>Healthcare Management System</div>
                        <div>Phone: +91 1234567890 | Email: info@arogyax.com</div>
                    </div>
                    
                    <div class="bill-info">
                        <div class="patient-info">
                            <h3>Bill To:</h3>
                            <p><strong>${bill.patientName}</strong></p>
                            <p>Contact: ${bill.patientContact}</p>
                            <p>Patient ID: ${typeof bill.patientId === 'object' ? bill.patientId._id || bill.patientId.id || 'N/A' : bill.patientId}</p>
                        </div>
                        <div class="bill-details">
                            <h3>Bill Details:</h3>
                            <p><strong>Bill No:</strong> ${bill.billNumber}</p>
                            <p><strong>Date:</strong> ${new Date(bill.createdAt).toLocaleDateString()}</p>
                            <p><strong>Type:</strong> ${bill.billType}</p>
                            <p><strong>Status:</strong> ${bill.paymentStatus}</p>
                            ${bill.doctorName ? `<p><strong>Doctor:</strong> ${bill.doctorName}</p>` : ''}
                        </div>
                    </div>
                    
                    <table class="services-table">
                        <thead>
                            <tr>
                                <th>Service/Item</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bill.services && bill.services.length > 0 
                                ? bill.services.map(service => `
                                    <tr>
                                        <td>${service.serviceName || 'Service'}</td>
                                        <td>${service.category || 'General'}</td>
                                        <td>${service.quantity || 1}</td>
                                        <td>₹${service.unitPrice || 0}</td>
                                        <td>₹${service.totalPrice || 0}</td>
                                    </tr>
                                `).join('')
                                : `<tr><td colspan="5" style="text-align: center;">No services listed</td></tr>`
                            }
                        </tbody>
                    </table>
                    
                    <div class="total-section">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>₹${bill.subtotal || bill.totalAmount}</span>
                        </div>
                        <div class="total-row">
                            <span>Discount:</span>
                            <span>₹${bill.totalDiscount || 0}</span>
                        </div>
                        <div class="total-row">
                            <span>Tax:</span>
                            <span>₹${bill.totalTax || 0}</span>
                        </div>
                        <div class="total-row grand-total">
                            <span>Grand Total:</span>
                            <span>₹${bill.totalAmount}</span>
                        </div>
                    </div>
                    
                    ${bill.notes ? `<div style="margin-top: 20px;"><strong>Notes:</strong> ${bill.notes}</div>` : ''}
                    
                    <div class="footer">
                        <p>Thank you for choosing Arogya X Hospital!</p>
                        <p>This is a computer generated bill.</p>
                        <div class="no-print" style="margin-top: 20px;">
                            <button onclick="window.print()" style="background: #007bff; color: white; padding: 10px 20px; border: none; cursor: pointer;">Print Receipt</button>
                            <button onclick="window.close()" style="background: #6c757d; color: white; padding: 10px 20px; border: none; cursor: pointer; margin-left: 10px;">Close</button>
                        </div>
                    </div>
                </body>
                </html>
                `
                
                receiptWindow.document.write(receiptHTML)
                receiptWindow.document.close()
                
                toast.success('Receipt opened in new window')
            } else {
                toast.error(data.message || 'Failed to fetch bill details')
            }
        } catch (error) {
            console.error('Receipt generation error:', error)
            toast.error('Failed to generate receipt')
        }
    }

    const editBill = (bill) => {
        setEditingBill(bill)
        setFormData({
            patientId: bill.patientId?._id || bill.patientId || '',
            patientName: bill.patientName || '',
            patientContact: bill.patientContact || '',
            billType: bill.billType || 'Consultation',
            doctorId: bill.doctorId?._id || bill.doctorId || '',
            items: bill.items || [{ description: '', quantity: 1, unitPrice: '', amount: '' }],
            subtotal: bill.subtotal || '',
            discount: bill.discount || 0,
            tax: bill.tax || 0,
            totalAmount: bill.totalAmount || '',
            paymentMethod: bill.paymentMethod || 'Cash',
            paymentStatus: bill.paymentStatus || 'Pending',
            notes: bill.notes || ''
        })
        setShowAddForm(true)
    }

    const resetForm = () => {
        setFormData({
            patientId: '',
            patientName: '',
            patientContact: '',
            billType: 'Consultation',
            doctorId: '',
            items: [{ description: '', quantity: 1, unitPrice: '', amount: '' }],
            subtotal: '',
            discount: 0,
            tax: 0,
            totalAmount: '',
            paymentMethod: 'Cash',
            paymentStatus: 'Pending',
            notes: ''
        })
    }

    const handlePatientSelect = (patientId) => {
        const patient = patients.find(p => p._id === patientId)
        setFormData(prev => ({
            ...prev,
            patientId,
            patientName: patient ? patient.name : '',
            patientContact: patient ? patient.phone : ''
        }))
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid': return 'text-green-500'
            case 'Pending': return 'text-yellow-500'
            case 'Partially Paid': return 'text-orange-500'
            case 'Overdue': return 'text-red-500'
            case 'Cancelled': return 'text-gray-500'
            default: return 'text-gray-500'
        }
    }

    return (
        <div className='w-full max-w-6xl m-5'>
            <div className='flex justify-between items-center mb-3'>
                <p className='text-lg font-medium'>Billing Management</p>
                <button
                    onClick={() => {
                        setShowAddForm(true)
                        setEditingBill(null)
                        resetForm()
                    }}
                    className='bg-primary text-white px-4 py-2 rounded hover:bg-blue-600'
                >
                    Create New Bill
                </button>
            </div>

            {/* Filters */}
            <div className='flex gap-4 mb-4 flex-wrap'>
                <input
                    type='text'
                    placeholder='Search by patient name or bill number...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='border rounded px-3 py-2 flex-1 min-w-64'
                />
                
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className='border rounded px-3 py-2'
                >
                    {statuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>

                <input
                    type='date'
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className='border rounded px-3 py-2'
                    placeholder='Start Date'
                />

                <input
                    type='date'
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className='border rounded px-3 py-2'
                    placeholder='End Date'
                />
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
                        <div className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-bold'>
                                {editingBill ? 'Edit Bill' : 'Create New Bill'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddForm(false)
                                    setEditingBill(null)
                                    resetForm()
                                }}
                                className='text-gray-500 hover:text-gray-700'
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className='space-y-4'>
                            {/* Patient Information */}
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium mb-1'>Patient *</label>
                                    <select
                                        value={formData.patientId}
                                        onChange={(e) => handlePatientSelect(e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                        required
                                    >
                                        <option value=''>Select Patient</option>
                                        {patients.map(patient => (
                                            <option key={patient._id} value={patient._id}>
                                                {patient.name} - {patient.phone}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Patient Name</label>
                                    <input
                                        type='text'
                                        value={formData.patientName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                                        className='w-full border rounded px-3 py-2'
                                        placeholder='Enter manually if not in list'
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Patient Contact</label>
                                    <input
                                        type='text'
                                        value={formData.patientContact}
                                        onChange={(e) => setFormData(prev => ({ ...prev, patientContact: e.target.value }))}
                                        className='w-full border rounded px-3 py-2'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium mb-1'>Bill Type *</label>
                                    <select
                                        value={formData.billType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, billType: e.target.value }))}
                                        className='w-full border rounded px-3 py-2'
                                        required
                                    >
                                        {billTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Doctor</label>
                                    <select
                                        value={formData.doctorId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, doctorId: e.target.value }))}
                                        className='w-full border rounded px-3 py-2'
                                    >
                                        <option value=''>Select Doctor</option>
                                        {doctors.map(doctor => (
                                            <option key={doctor._id} value={doctor._id}>
                                                Dr. {doctor.name} - {doctor.speciality}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Items */}
                            <div className='border-t pt-4'>
                                <div className='flex justify-between items-center mb-2'>
                                    <h3 className='text-lg font-medium'>Bill Items</h3>
                                    <button
                                        type='button'
                                        onClick={addItem}
                                        className='bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600'
                                    >
                                        Add Item
                                    </button>
                                </div>

                                {formData.items.map((item, index) => (
                                    <div key={index} className='grid grid-cols-1 md:grid-cols-5 gap-2 mb-2 items-end'>
                                        <div>
                                            <label className='block text-sm font-medium mb-1'>Description *</label>
                                            <input
                                                type='text'
                                                value={item.description}
                                                onChange={(e) => {
                                                    const newItems = [...formData.items]
                                                    newItems[index].description = e.target.value
                                                    setFormData(prev => ({ ...prev, items: newItems }))
                                                }}
                                                className='w-full border rounded px-3 py-2'
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium mb-1'>Quantity *</label>
                                            <input
                                                type='number'
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const quantity = parseFloat(e.target.value) || 0
                                                    const newItems = [...formData.items]
                                                    newItems[index].quantity = quantity
                                                    setFormData(prev => ({ ...prev, items: newItems }))
                                                    updateItemAmount(index, quantity, parseFloat(item.unitPrice) || 0)
                                                }}
                                                className='w-full border rounded px-3 py-2'
                                                min='1'
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium mb-1'>Unit Price *</label>
                                            <input
                                                type='number'
                                                step='0.01'
                                                value={item.unitPrice}
                                                onChange={(e) => {
                                                    const unitPrice = parseFloat(e.target.value) || 0
                                                    const newItems = [...formData.items]
                                                    newItems[index].unitPrice = unitPrice
                                                    setFormData(prev => ({ ...prev, items: newItems }))
                                                    updateItemAmount(index, parseFloat(item.quantity) || 0, unitPrice)
                                                }}
                                                className='w-full border rounded px-3 py-2'
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium mb-1'>Amount</label>
                                            <input
                                                type='text'
                                                value={item.amount}
                                                className='w-full border rounded px-3 py-2 bg-gray-100'
                                                readOnly
                                            />
                                        </div>
                                        <div>
                                            {formData.items.length > 1 && (
                                                <button
                                                    type='button'
                                                    onClick={() => removeItem(index)}
                                                    className='bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600'
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className='border-t pt-4'>
                                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Subtotal</label>
                                        <input
                                            type='text'
                                            value={formData.subtotal}
                                            className='w-full border rounded px-3 py-2 bg-gray-100'
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Discount (%)</label>
                                        <input
                                            type='number'
                                            value={formData.discount}
                                            onChange={(e) => {
                                                const discount = parseFloat(e.target.value) || 0
                                                setFormData(prev => {
                                                    const { totalAmount } = calculateTotals(prev.items, discount, prev.tax)
                                                    return {
                                                        ...prev,
                                                        discount,
                                                        totalAmount: totalAmount.toFixed(2)
                                                    }
                                                })
                                            }}
                                            className='w-full border rounded px-3 py-2'
                                            min='0'
                                            max='100'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Tax (%)</label>
                                        <input
                                            type='number'
                                            value={formData.tax}
                                            onChange={(e) => {
                                                const tax = parseFloat(e.target.value) || 0
                                                setFormData(prev => {
                                                    const { totalAmount } = calculateTotals(prev.items, prev.discount, tax)
                                                    return {
                                                        ...prev,
                                                        tax,
                                                        totalAmount: totalAmount.toFixed(2)
                                                    }
                                                })
                                            }}
                                            className='w-full border rounded px-3 py-2'
                                            min='0'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Total Amount</label>
                                        <input
                                            type='text'
                                            value={formData.totalAmount}
                                            className='w-full border rounded px-3 py-2 bg-gray-100 font-bold'
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Information */}
                            <div className='border-t pt-4'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Payment Method *</label>
                                        <select
                                            value={formData.paymentMethod}
                                            onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                            required
                                        >
                                            {paymentMethods.map(method => (
                                                <option key={method} value={method}>{method}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Payment Status *</label>
                                        <select
                                            value={formData.paymentStatus}
                                            onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                            required
                                        >
                                            {paymentStatuses.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className='mt-4'>
                                    <label className='block text-sm font-medium mb-1'>Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        className='w-full border rounded px-3 py-2'
                                        rows='3'
                                    />
                                </div>
                            </div>

                            <div className='flex justify-end gap-4 pt-4 border-t'>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setShowAddForm(false)
                                        setEditingBill(null)
                                        resetForm()
                                    }}
                                    className='px-6 py-2 border rounded hover:bg-gray-100'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-6 py-2 bg-primary text-white rounded hover:bg-blue-600'
                                >
                                    {editingBill ? 'Update' : 'Create'} Bill
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bills List */}
            <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
                <div className='hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr_1.5fr] grid-flow-col py-3 px-6 border-b'>
                    <p>Bill No.</p>
                    <p>Patient</p>
                    <p>Type</p>
                    <p>Amount</p>
                    <p>Status</p>
                    <p>Date</p>
                    <p>Actions</p>
                </div>

                {bills.map((bill) => (
                    <div key={bill._id} className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid sm:grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr_1.5fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'>
                        <p className='font-mono text-sm'>{bill.billNumber}</p>
                        <div>
                            <p className='font-medium'>{bill.patientName}</p>
                            <p className='text-xs text-gray-400'>{bill.patientContact}</p>
                        </div>
                        <p>{bill.billType}</p>
                        <p className='font-semibold'>₹{bill.totalAmount}</p>
                        <p className={getStatusColor(bill.paymentStatus)}>{bill.paymentStatus}</p>
                        <p>{new Date(bill.createdAt).toLocaleDateString()}</p>
                        <div className='flex gap-1 flex-wrap'>
                            <button
                                onClick={() => editBill(bill)}
                                className='text-blue-500 hover:text-blue-700 text-xs'
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => generateReceipt(bill._id)}
                                className='text-green-500 hover:text-green-700 text-xs'
                            >
                                Receipt
                            </button>
                            <button
                                onClick={() => deleteBill(bill._id)}
                                className='text-red-500 hover:text-red-700 text-xs'
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default BillingManagement
