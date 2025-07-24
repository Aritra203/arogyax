import { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'

const AdmissionManagement = () => {
    const { aToken, backendUrl } = useContext(AdminContext)
    const [admissions, setAdmissions] = useState([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingAdmission, setEditingAdmission] = useState(null)
    const [patients, setPatients] = useState([])
    const [doctors, setDoctors] = useState([])
    const [rooms, setRooms] = useState([])
    const [filterStatus, setFilterStatus] = useState('All')
    const [searchTerm, setSearchTerm] = useState('')
    
    const [formData, setFormData] = useState({
        patientId: '',
        patientName: '',
        patientAge: '',
        patientGender: '',
        patientContact: '',
        emergencyContact: { name: '', phone: '', relationship: '' },
        admittingDoctorId: '',
        attendingDoctorId: '',
        department: '',
        roomId: '',
        bedNumber: '',
        admissionDate: '',
        admissionTime: '',
        admissionType: 'Emergency',
        diagnosis: '',
        symptoms: '',
        vitalSigns: { temperature: '', bloodPressure: '', pulse: '', weight: '', height: '' },
        allergies: '',
        medications: '',
        medicalHistory: '',
        admissionReason: '',
        expectedStayDuration: '',
        roomCharges: '',
        insuranceDetails: { provider: '', policyNumber: '', coverage: '' },
        notes: '',
        status: 'Admitted'
    })

    const admissionTypes = ['Emergency', 'Scheduled', 'Transfer', 'Observation', 'Day Care']
    const departments = ['General Medicine', 'Surgery', 'Pediatrics', 'Orthopedics', 'Cardiology', 'Neurology', 'Obstetrics', 'ICU', 'Emergency']
    const genders = ['Male', 'Female', 'Other']
    const statuses = ['All', 'Admitted', 'Discharged', 'Transferred', 'Cancelled']

    const fetchAdmissions = async () => {
        try {
            const params = new URLSearchParams()
            if (filterStatus !== 'All') params.append('status', filterStatus)
            if (searchTerm) params.append('search', searchTerm)

            const response = await fetch(`${backendUrl}/api/admin/admission-list?${params}`, {
                headers: { 'aToken': aToken }
            })
            const data = await response.json()
            if (data.success) {
                setAdmissions(data.admissions)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Failed to fetch admissions')
        }
    }

    const fetchPatientsAndDoctors = async () => {
        try {
            const [patientsResponse, doctorsResponse, roomsResponse] = await Promise.all([
                fetch(`${backendUrl}/api/admin/all-users`, { headers: { 'aToken': aToken } }),
                fetch(`${backendUrl}/api/admin/all-doctors`, { headers: { 'aToken': aToken } }),
                fetch(`${backendUrl}/api/admin/admission-rooms`, { headers: { 'aToken': aToken } })
            ])

            const patientsData = await patientsResponse.json()
            const doctorsData = await doctorsResponse.json()
            const roomsData = await roomsResponse.json()

            if (patientsData.success) setPatients(patientsData.users || [])
            if (doctorsData.success) setDoctors(doctorsData.doctors || [])
            if (roomsData.success) setRooms(roomsData.rooms || [])
        } catch (error) {
            toast.error('Failed to fetch data')
        }
    }

    useEffect(() => {
        if (aToken) {
            fetchAdmissions()
            fetchPatientsAndDoctors()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aToken, filterStatus, searchTerm])

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        const submitData = { ...formData }
        submitData.emergencyContact = JSON.stringify(submitData.emergencyContact)
        submitData.vitalSigns = JSON.stringify(submitData.vitalSigns)
        submitData.insuranceDetails = JSON.stringify(submitData.insuranceDetails)

        try {
            const url = editingAdmission
                ? `${backendUrl}/api/admin/admission-update/${editingAdmission._id}`
                : `${backendUrl}/api/admin/admission-create`
                
            const method = editingAdmission ? 'PUT' : 'POST'
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    aToken
                },
                body: JSON.stringify(submitData)
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success(data.message)
                setShowAddForm(false)
                setEditingAdmission(null)
                resetForm()
                fetchAdmissions()
                
                // Auto-generate receipt for new admissions
                if (!editingAdmission && data.admissionId) {
                    setTimeout(() => {
                        // Find the newly created admission and generate receipt
                        const newAdmission = {
                            admissionId: data.admissionId,
                            patientName: formData.patientName,
                            age: formData.patientAge,
                            gender: formData.patientGender,
                            admissionDate: formData.admissionDate,
                            admissionTime: formData.admissionTime,
                            department: formData.department,
                            doctorName: doctors.find(d => d._id === formData.admittingDoctorId)?.name || 'N/A',
                            admissionType: formData.admissionType,
                            roomDetails: { 
                                roomNumber: formData.bedNumber,
                                dailyCharges: formData.roomCharges 
                            },
                            patientIdString: formData.patientId || 'Walk-in Patient',
                            emergencyContact: formData.emergencyContact,
                            totalCharges: formData.roomCharges || 0
                        }
                        generateAdmissionReceipt(newAdmission)
                    }, 1000)
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Failed to save admission')
        }
    }

    const updateStatus = async (admissionId, status) => {
        try {
            const response = await fetch(`${backendUrl}/api/admin/admission-update/${admissionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    aToken
                },
                body: JSON.stringify({ status })
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success(data.message)
                fetchAdmissions()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Failed to update status')
        }
    }

    const dischargePatient = async (admissionId) => {
        const dischargeDate = new Date().toISOString()
        const dischargeSummary = prompt('Enter discharge summary (optional):') || ''
        
        try {
            const response = await fetch(`${backendUrl}/api/admin/admission-discharge/${admissionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    aToken
                },
                body: JSON.stringify({
                    dischargeDate,
                    dischargeSummary,
                    status: 'Discharged'
                })
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success(data.message)
                fetchAdmissions()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Failed to discharge patient')
        }
    }

    const viewAdmissionDetails = (admission) => {
        const detailsWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
        const admissionDate = new Date(admission.admissionDate).toLocaleDateString()
        const admissionTime = admission.admissionTime || 'N/A'
        const totalDays = admission.actualDischargeDate 
            ? Math.ceil((new Date(admission.actualDischargeDate) - new Date(admission.admissionDate)) / (1000 * 60 * 60 * 24))
            : Math.ceil((new Date() - new Date(admission.admissionDate)) / (1000 * 60 * 60 * 24))
        
        const roomCharges = admission.roomDetails?.dailyCharges || 0
        const estimatedAmount = totalDays * roomCharges

        detailsWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Admission Details - ${admission.admissionId}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                    .section { margin-bottom: 25px; }
                    .section h3 { background-color: #f0f0f0; padding: 10px; margin: 0 0 15px 0; border-left: 4px solid #007bff; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                    .info-item { margin-bottom: 10px; }
                    .label { font-weight: bold; color: #333; }
                    .value { color: #666; margin-left: 10px; }
                    .status { padding: 5px 10px; border-radius: 5px; font-weight: bold; }
                    .status.admitted { background-color: #d4edda; color: #155724; }
                    .status.discharged { background-color: #f8d7da; color: #721c24; }
                    .no-print { margin-top: 30px; text-align: center; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Arogya X Hospital</h1>
                    <h2>Admission Details</h2>
                    <p><strong>Admission ID:</strong> ${admission.admissionId || 'N/A'}</p>
                </div>

                <div class="section">
                    <h3>Patient Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Name:</span>
                            <span class="value">${admission.patientName || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Age:</span>
                            <span class="value">${admission.age || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Gender:</span>
                            <span class="value">${admission.gender || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Patient ID:</span>
                            <span class="value">${admission.patientIdString || admission.patientId?._id || admission.patientId || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h3>Admission Details</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Admission Date:</span>
                            <span class="value">${admissionDate}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Admission Time:</span>
                            <span class="value">${admissionTime}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Admission Type:</span>
                            <span class="value">${admission.admissionType || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Department:</span>
                            <span class="value">${admission.department || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Doctor:</span>
                            <span class="value">${admission.doctorName || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Room Number:</span>
                            <span class="value">${admission.roomDetails?.roomNumber || admission.roomDetails?.bedNumber || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Status:</span>
                            <span class="value status ${admission.status?.toLowerCase() || 'admitted'}">${admission.status || 'Admitted'}</span>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h3>Medical Information</h3>
                    <div class="info-item">
                        <span class="label">Admission Reason:</span>
                        <span class="value">${admission.admissionReason || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Initial Diagnosis:</span>
                        <span class="value">${admission.initialDiagnosis || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Treatment Plan:</span>
                        <span class="value">${admission.treatmentPlan || 'N/A'}</span>
                    </div>
                </div>

                <div class="section">
                    <h3>Emergency Contact</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Name:</span>
                            <span class="value">${admission.emergencyContact?.name || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Relationship:</span>
                            <span class="value">${admission.emergencyContact?.relationship || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Phone:</span>
                            <span class="value">${admission.emergencyContact?.phone || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h3>Billing Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Room Charges/Day:</span>
                            <span class="value">₹${roomCharges}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Total Days:</span>
                            <span class="value">${totalDays}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Estimated Room Charges:</span>
                            <span class="value">₹${estimatedAmount}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Total Charges:</span>
                            <span class="value">₹${admission.totalCharges || estimatedAmount}</span>
                        </div>
                    </div>
                </div>

                <div class="no-print">
                    <button onclick="setTimeout(() => window.print(), 500)" style="background-color: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Print Details</button>
                    <button onclick="window.close()" style="background-color: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
                </div>
            </body>
            </html>
        `)
        detailsWindow.document.close() // Close the document to ensure it's ready for printing
    }

    const generateAdmissionReceipt = (admission) => {
        const receiptWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
        const admissionDate = new Date(admission.admissionDate).toLocaleDateString()
        const admissionTime = admission.admissionTime || 'N/A'
        const currentDate = new Date().toLocaleDateString()
        
        const totalDays = admission.actualDischargeDate 
            ? Math.ceil((new Date(admission.actualDischargeDate) - new Date(admission.admissionDate)) / (1000 * 60 * 60 * 24))
            : Math.ceil((new Date() - new Date(admission.admissionDate)) / (1000 * 60 * 60 * 24))
        
        const roomCharges = admission.roomDetails?.dailyCharges || 0
        const estimatedAmount = totalDays * roomCharges
        const totalAmount = admission.totalCharges || estimatedAmount

        receiptWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Admission Receipt - ${admission.admissionId}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
                    .receipt-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
                    .receipt-title { background-color: #007bff; color: white; padding: 15px; margin: 0 0 20px 0; text-align: center; }
                    .receipt-section { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; }
                    .receipt-row { display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0; border-bottom: 1px dotted #ccc; }
                    .receipt-row:last-child { border-bottom: none; }
                    .label { font-weight: bold; }
                    .value { text-align: right; }
                    .total-section { background-color: #f8f9fa; border: 2px solid #007bff; padding: 15px; margin-top: 20px; }
                    .total-amount { font-size: 1.2em; font-weight: bold; color: #007bff; }
                    .footer { margin-top: 30px; text-align: center; font-size: 0.9em; color: #666; }
                    .no-print { margin-top: 30px; text-align: center; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="receipt-header">
                    <h1>Arogya X Hospital</h1>
                    <p>123 Healthcare Street, Medical City, MC 12345</p>
                    <p>Phone: +91 98765 43210 | Email: info@arogyax.com</p>
                </div>

                <div class="receipt-title">
                    <h2>ADMISSION RECEIPT</h2>
                </div>

                <div class="receipt-section">
                    <h3>Patient Information</h3>
                    <div class="receipt-row">
                        <span class="label">Admission ID:</span>
                        <span class="value">${admission.admissionId || 'N/A'}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Patient Name:</span>
                        <span class="value">${admission.patientName || 'N/A'}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Age/Gender:</span>
                        <span class="value">${admission.age || 'N/A'} / ${admission.gender || 'N/A'}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Patient ID:</span>
                        <span class="value">${admission.patientIdString || admission.patientId?._id || admission.patientId || 'N/A'}</span>
                    </div>
                </div>

                <div class="receipt-section">
                    <h3>Admission Details</h3>
                    <div class="receipt-row">
                        <span class="label">Admission Date:</span>
                        <span class="value">${admissionDate}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Admission Time:</span>
                        <span class="value">${admissionTime}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Department:</span>
                        <span class="value">${admission.department || 'N/A'}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Attending Doctor:</span>
                        <span class="value">${admission.doctorName || 'N/A'}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Room Number:</span>
                        <span class="value">${admission.roomDetails?.roomNumber || admission.roomDetails?.bedNumber || 'N/A'}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Admission Type:</span>
                        <span class="value">${admission.admissionType || 'N/A'}</span>
                    </div>
                </div>

                <div class="receipt-section">
                    <h3>Billing Information</h3>
                    <div class="receipt-row">
                        <span class="label">Room Charges (Per Day):</span>
                        <span class="value">₹${roomCharges}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Number of Days:</span>
                        <span class="value">${totalDays}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Room Charges Subtotal:</span>
                        <span class="value">₹${estimatedAmount}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="label">Other Charges:</span>
                        <span class="value">₹${Math.max(0, totalAmount - estimatedAmount)}</span>
                    </div>
                </div>

                <div class="total-section">
                    <div class="receipt-row total-amount">
                        <span class="label">TOTAL ESTIMATED AMOUNT:</span>
                        <span class="value">₹${totalAmount}</span>
                    </div>
                </div>

                <div class="footer">
                    <p><strong>Note:</strong> This is an estimated bill. Final amount may vary based on additional services and treatments.</p>
                    <p>Receipt generated on: ${currentDate}</p>
                    <p>Thank you for choosing Arogya X Hospital for your healthcare needs.</p>
                </div>

                <div class="no-print">
                    <button onclick="setTimeout(() => window.print(), 500)" style="background-color: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Print Receipt</button>
                    <button onclick="window.close()" style="background-color: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
                </div>
            </body>
            </html>
        `)
        receiptWindow.document.close() // Close the document to ensure it's ready for printing
    }

    const editAdmission = (admission) => {
        setEditingAdmission(admission)
        setFormData({
            patientId: admission.patientId?._id || admission.patientId || '',
            patientName: admission.patientName || '',
            patientAge: admission.patientAge || '',
            patientGender: admission.patientGender || '',
            patientContact: admission.patientContact || '',
            emergencyContact: admission.emergencyContact || { name: '', phone: '', relationship: '' },
            admittingDoctorId: admission.admittingDoctorId?._id || admission.admittingDoctorId || '',
            attendingDoctorId: admission.attendingDoctorId?._id || admission.attendingDoctorId || '',
            department: admission.department || '',
            roomId: admission.roomId?._id || admission.roomId || '',
            bedNumber: admission.bedNumber || '',
            admissionDate: admission.admissionDate ? new Date(admission.admissionDate).toISOString().split('T')[0] : '',
            admissionTime: admission.admissionTime || '',
            admissionType: admission.admissionType || 'Emergency',
            diagnosis: admission.diagnosis || '',
            symptoms: admission.symptoms || '',
            vitalSigns: admission.vitalSigns || { temperature: '', bloodPressure: '', pulse: '', weight: '', height: '' },
            allergies: admission.allergies || '',
            medications: admission.medications || '',
            medicalHistory: admission.medicalHistory || '',
            admissionReason: admission.admissionReason || '',
            expectedStayDuration: admission.expectedStayDuration || '',
            roomCharges: admission.roomCharges || '',
            insuranceDetails: admission.insuranceDetails || { provider: '', policyNumber: '', coverage: '' },
            notes: admission.notes || '',
            status: admission.status || 'Admitted'
        })
        setShowAddForm(true)
    }

    const resetForm = () => {
        setFormData({
            patientId: '',
            patientName: '',
            patientAge: '',
            patientGender: '',
            patientContact: '',
            emergencyContact: { name: '', phone: '', relationship: '' },
            admittingDoctorId: '',
            attendingDoctorId: '',
            department: '',
            roomId: '',
            bedNumber: '',
            admissionDate: '',
            admissionTime: '',
            admissionType: 'Emergency',
            diagnosis: '',
            symptoms: '',
            vitalSigns: { temperature: '', bloodPressure: '', pulse: '', weight: '', height: '' },
            allergies: '',
            medications: '',
            medicalHistory: '',
            admissionReason: '',
            expectedStayDuration: '',
            roomCharges: '',
            insuranceDetails: { provider: '', policyNumber: '', coverage: '' },
            notes: '',
            status: 'Admitted'
        })
    }

    const handlePatientSelect = (patientId) => {
        const patient = patients.find(p => p._id === patientId)
        if (patient) {
            setFormData(prev => ({
                ...prev,
                patientId,
                patientName: patient.name,
                patientContact: patient.phone,
                patientAge: patient.age || '',
                patientGender: patient.gender || ''
            }))
        }
    }

    const handleNestedInputChange = (parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: { ...prev[parent], [field]: value }
        }))
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'Admitted': return 'text-blue-500'
            case 'Discharged': return 'text-green-500'
            case 'Transferred': return 'text-orange-500'
            case 'Cancelled': return 'text-red-500'
            default: return 'text-gray-500'
        }
    }

    return (
        <div className='w-full max-w-6xl m-5'>
            <div className='flex justify-between items-center mb-3'>
                <p className='text-lg font-medium'>Admission Management</p>
                <button
                    onClick={() => {
                        setShowAddForm(true)
                        setEditingAdmission(null)
                        resetForm()
                    }}
                    className='bg-primary text-white px-4 py-2 rounded hover:bg-blue-600'
                >
                    New Admission
                </button>
            </div>

            {/* Filters */}
            <div className='flex gap-4 mb-4'>
                <input
                    type='text'
                    placeholder='Search by patient name or admission number...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='border rounded px-3 py-2 flex-1 max-w-md'
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
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto'>
                        <div className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-bold'>
                                {editingAdmission ? 'Edit Admission' : 'New Admission'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddForm(false)
                                    setEditingAdmission(null)
                                    resetForm()
                                }}
                                className='text-gray-500 hover:text-gray-700'
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className='space-y-6'>
                            {/* Patient Information */}
                            <div className='border p-4 rounded'>
                                <h3 className='text-lg font-medium mb-3'>Patient Information</h3>
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
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Contact</label>
                                        <input
                                            type='text'
                                            value={formData.patientContact}
                                            onChange={(e) => setFormData(prev => ({ ...prev, patientContact: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Age</label>
                                        <input
                                            type='number'
                                            value={formData.patientAge}
                                            onChange={(e) => setFormData(prev => ({ ...prev, patientAge: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Gender</label>
                                        <select
                                            value={formData.patientGender}
                                            onChange={(e) => setFormData(prev => ({ ...prev, patientGender: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                        >
                                            <option value=''>Select Gender</option>
                                            {genders.map(gender => (
                                                <option key={gender} value={gender}>{gender}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Emergency Contact */}
                                <div className='mt-4'>
                                    <h4 className='text-md font-medium mb-2'>Emergency Contact</h4>
                                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                        <div>
                                            <label className='block text-sm font-medium mb-1'>Name *</label>
                                            <input
                                                type='text'
                                                value={formData.emergencyContact.name}
                                                onChange={(e) => handleNestedInputChange('emergencyContact', 'name', e.target.value)}
                                                className='w-full border rounded px-3 py-2'
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium mb-1'>Phone *</label>
                                            <input
                                                type='text'
                                                value={formData.emergencyContact.phone}
                                                onChange={(e) => handleNestedInputChange('emergencyContact', 'phone', e.target.value)}
                                                className='w-full border rounded px-3 py-2'
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium mb-1'>Relationship</label>
                                            <input
                                                type='text'
                                                value={formData.emergencyContact.relationship}
                                                onChange={(e) => handleNestedInputChange('emergencyContact', 'relationship', e.target.value)}
                                                className='w-full border rounded px-3 py-2'
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Admission Details */}
                            <div className='border p-4 rounded'>
                                <h3 className='text-lg font-medium mb-3'>Admission Details</h3>
                                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Admission Date *</label>
                                        <input
                                            type='date'
                                            value={formData.admissionDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, admissionDate: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Admission Time *</label>
                                        <input
                                            type='time'
                                            value={formData.admissionTime}
                                            onChange={(e) => setFormData(prev => ({ ...prev, admissionTime: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Admission Type *</label>
                                        <select
                                            value={formData.admissionType}
                                            onChange={(e) => setFormData(prev => ({ ...prev, admissionType: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                            required
                                        >
                                            <option value=''>Select Admission Type</option>
                                            {admissionTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Department *</label>
                                        <select
                                            value={formData.department}
                                            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                            required
                                        >
                                            <option value=''>Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Admitting Doctor *</label>
                                        <select
                                            value={formData.admittingDoctorId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, admittingDoctorId: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                            required
                                        >
                                            <option value=''>Select Doctor</option>
                                            {doctors.map(doctor => (
                                                <option key={doctor._id} value={doctor._id}>
                                                    Dr. {doctor.name} - {doctor.speciality}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Attending Doctor</label>
                                        <select
                                            value={formData.attendingDoctorId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, attendingDoctorId: e.target.value }))}
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

                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Room</label>
                                        <select
                                            value={formData.roomId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, roomId: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                        >
                                            <option value=''>Select Room</option>
                                            {rooms.map(room => (
                                                <option key={room._id} value={room._id}>
                                                    {room.roomNumber} - {room.roomType} (₹{room.chargesPerDay}/day)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Bed Number</label>
                                        <input
                                            type='text'
                                            value={formData.bedNumber}
                                            onChange={(e) => setFormData(prev => ({ ...prev, bedNumber: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Expected Stay (days)</label>
                                        <input
                                            type='number'
                                            value={formData.expectedStayDuration}
                                            onChange={(e) => setFormData(prev => ({ ...prev, expectedStayDuration: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                        />
                                    </div>
                                </div>

                                <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Admission Reason *</label>
                                        <textarea
                                            value={formData.admissionReason}
                                            onChange={(e) => setFormData(prev => ({ ...prev, admissionReason: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                            rows='2'
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Diagnosis</label>
                                        <textarea
                                            value={formData.diagnosis}
                                            onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                            rows='2'
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Medical Information */}
                            <div className='border p-4 rounded'>
                                <h3 className='text-lg font-medium mb-3'>Medical Information</h3>
                                
                                {/* Vital Signs */}
                                <div className='mb-4'>
                                    <h4 className='text-md font-medium mb-2'>Vital Signs</h4>
                                    <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
                                        <div>
                                            <label className='block text-sm font-medium mb-1'>Temperature</label>
                                            <input
                                                type='text'
                                                value={formData.vitalSigns.temperature}
                                                onChange={(e) => handleNestedInputChange('vitalSigns', 'temperature', e.target.value)}
                                                className='w-full border rounded px-3 py-2'
                                                placeholder='°F'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium mb-1'>Blood Pressure</label>
                                            <input
                                                type='text'
                                                value={formData.vitalSigns.bloodPressure}
                                                onChange={(e) => handleNestedInputChange('vitalSigns', 'bloodPressure', e.target.value)}
                                                className='w-full border rounded px-3 py-2'
                                                placeholder='120/80'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium mb-1'>Pulse</label>
                                            <input
                                                type='text'
                                                value={formData.vitalSigns.pulse}
                                                onChange={(e) => handleNestedInputChange('vitalSigns', 'pulse', e.target.value)}
                                                className='w-full border rounded px-3 py-2'
                                                placeholder='bpm'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium mb-1'>Weight</label>
                                            <input
                                                type='text'
                                                value={formData.vitalSigns.weight}
                                                onChange={(e) => handleNestedInputChange('vitalSigns', 'weight', e.target.value)}
                                                className='w-full border rounded px-3 py-2'
                                                placeholder='kg'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium mb-1'>Height</label>
                                            <input
                                                type='text'
                                                value={formData.vitalSigns.height}
                                                onChange={(e) => handleNestedInputChange('vitalSigns', 'height', e.target.value)}
                                                className='w-full border rounded px-3 py-2'
                                                placeholder='cm'
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Symptoms</label>
                                        <textarea
                                            value={formData.symptoms}
                                            onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                            rows='2'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Allergies</label>
                                        <textarea
                                            value={formData.allergies}
                                            onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                            rows='2'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Current Medications</label>
                                        <textarea
                                            value={formData.medications}
                                            onChange={(e) => setFormData(prev => ({ ...prev, medications: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                            rows='2'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Medical History</label>
                                        <textarea
                                            value={formData.medicalHistory}
                                            onChange={(e) => setFormData(prev => ({ ...prev, medicalHistory: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                            rows='2'
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Insurance and Billing */}
                            <div className='border p-4 rounded'>
                                <h3 className='text-lg font-medium mb-3'>Insurance & Billing</h3>
                                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Insurance Provider</label>
                                        <input
                                            type='text'
                                            value={formData.insuranceDetails.provider}
                                            onChange={(e) => handleNestedInputChange('insuranceDetails', 'provider', e.target.value)}
                                            className='w-full border rounded px-3 py-2'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Policy Number</label>
                                        <input
                                            type='text'
                                            value={formData.insuranceDetails.policyNumber}
                                            onChange={(e) => handleNestedInputChange('insuranceDetails', 'policyNumber', e.target.value)}
                                            className='w-full border rounded px-3 py-2'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Coverage %</label>
                                        <input
                                            type='number'
                                            value={formData.insuranceDetails.coverage}
                                            onChange={(e) => handleNestedInputChange('insuranceDetails', 'coverage', e.target.value)}
                                            className='w-full border rounded px-3 py-2'
                                            max='100'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Room Charges/Day</label>
                                        <input
                                            type='number'
                                            value={formData.roomCharges}
                                            onChange={(e) => setFormData(prev => ({ ...prev, roomCharges: e.target.value }))}
                                            className='w-full border rounded px-3 py-2'
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Notes */}
                            <div>
                                <label className='block text-sm font-medium mb-1'>Additional Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    className='w-full border rounded px-3 py-2'
                                    rows='3'
                                />
                            </div>

                            <div className='flex justify-end gap-4 pt-4 border-t'>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setShowAddForm(false)
                                        setEditingAdmission(null)
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
                                    {editingAdmission ? 'Update' : 'Create'} Admission
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admissions List */}
            <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
                <div className='hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr_1.5fr] grid-flow-col py-3 px-6 border-b'>
                    <p>Admission No.</p>
                    <p>Patient</p>
                    <p>Department</p>
                    <p>Doctor</p>
                    <p>Room</p>
                    <p>Status</p>
                    <p>Actions</p>
                </div>

                {admissions.map((admission) => (
                    <div key={admission._id} className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid sm:grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr_1.5fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'>
                        <p className='font-mono text-sm'>{admission.admissionId || admission.admissionNumber || 'N/A'}</p>
                        <div>
                            <p className='font-medium'>{admission.patientName}</p>
                            <p className='text-xs text-gray-400'>
                                {admission.age && `Age: ${admission.age}, `}
                                {new Date(admission.admissionDate).toLocaleDateString()}
                            </p>
                        </div>
                        <p>{admission.department}</p>
                        <p>{admission.doctorName || (admission.admittedBy?.name ? `Dr. ${admission.admittedBy.name}` : 'N/A')}</p>
                        <p>{admission.roomDetails?.roomNumber || admission.roomDetails?.bedNumber || 'N/A'}</p>
                        <p className={getStatusColor(admission.status)}>{admission.status}</p>
                        <div className='flex gap-1 flex-wrap'>
                            <button
                                onClick={() => viewAdmissionDetails(admission)}
                                className='text-green-500 hover:text-green-700 text-xs px-2 py-1 border border-green-500 rounded'
                            >
                                View
                            </button>
                            <button
                                onClick={() => editAdmission(admission)}
                                className='text-blue-500 hover:text-blue-700 text-xs px-2 py-1 border border-blue-500 rounded'
                            >
                                Edit
                            </button>
                            {admission.status === 'Admitted' && (
                                <button
                                    onClick={() => dischargePatient(admission._id)}
                                    className='text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-600 rounded'
                                >
                                    Discharge
                                </button>
                            )}
                            <button
                                onClick={() => generateAdmissionReceipt(admission)}
                                className='text-purple-500 hover:text-purple-700 text-xs px-2 py-1 border border-purple-500 rounded'
                            >
                                Receipt
                            </button>
                            <select
                                value={admission.status}
                                onChange={(e) => updateStatus(admission._id, e.target.value)}
                                className='text-xs border rounded px-1 py-1'
                            >
                                {statuses.slice(1).map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default AdmissionManagement
