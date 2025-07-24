import { useState, useContext, useEffect, useCallback } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'

const DoctorPrescriptions = () => {
  const { dToken, appointments, getAppointments } = useContext(DoctorContext)
  const { backendUrl, currency } = useContext(AppContext)

  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [formData, setFormData] = useState({
    diagnosis: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    notes: '',
    followUpDate: ''
  })

  const fetchPrescriptions = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/prescription/doctor`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'dToken': dToken
        }
      })
      const data = await response.json()
      if (data.success) {
        setPrescriptions(data.prescriptions)
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
    }
  }, [backendUrl, dToken])

  useEffect(() => {
    if (dToken) {
      getAppointments()
      fetchPrescriptions()
    }
  }, [dToken, getAppointments, fetchPrescriptions])

  const handleCreatePrescription = (appointment) => {
    setSelectedAppointment(appointment)
    setShowPrescriptionForm(true)
    setFormData({
      diagnosis: '',
      medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      notes: '',
      followUpDate: ''
    })
  }

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }))
  }

  const removeMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }))
  }

  const updateMedication = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.diagnosis.trim()) {
      toast.error('Diagnosis is required')
      return
    }

    const validMedications = formData.medications.filter(med => 
      med.name.trim() && med.dosage.trim() && med.frequency.trim() && med.duration.trim()
    )

    if (validMedications.length === 0) {
      toast.error('At least one complete medication is required')
      return
    }

    try {
      const response = await fetch(`${backendUrl}/api/prescription/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'dToken': dToken
        },
        body: JSON.stringify({
          appointmentId: selectedAppointment._id,
          diagnosis: formData.diagnosis,
          medications: validMedications,
          notes: formData.notes,
          followUpDate: formData.followUpDate
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Prescription created successfully')
        setShowPrescriptionForm(false)
        fetchPrescriptions()
        getAppointments() // Refresh appointments to update status
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Error creating prescription:', error)
      toast.error('Failed to create prescription')
    }
  }

  // Filter completed appointments that can have prescriptions
  const completedAppointments = appointments?.filter(app => 
    app.isCompleted && !app.cancelled
  ) || []

  // Check if appointment already has prescription
  const hasExistingPrescription = (appointmentId) => {
    return prescriptions.some(presc => presc.appointmentId === appointmentId)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (showPrescriptionForm && selectedAppointment) {
    return (
      <div className='w-full max-w-4xl m-5'>
        <div className='bg-white border rounded-lg p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-semibold'>Create Prescription</h2>
            <button
              onClick={() => setShowPrescriptionForm(false)}
              className='text-gray-500 hover:text-gray-700'
            >
              ✕
            </button>
          </div>

          <div className='mb-4 p-4 bg-gray-50 rounded'>
            <h3 className='font-medium'>Patient: {selectedAppointment.userData.name}</h3>
            <p className='text-sm text-gray-600'>
              Appointment: {selectedAppointment.slotDate} at {selectedAppointment.slotTime}
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label className='block text-sm font-medium mb-2'>Diagnosis *</label>
              <textarea
                value={formData.diagnosis}
                onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                className='w-full p-3 border rounded-lg'
                rows={3}
                placeholder='Enter diagnosis...'
                required
              />
            </div>

            <div>
              <div className='flex justify-between items-center mb-3'>
                <label className='block text-sm font-medium'>Medications *</label>
                <button
                  type='button'
                  onClick={addMedication}
                  className='text-blue-600 hover:text-blue-700 text-sm'
                >
                  + Add Medication
                </button>
              </div>

              {formData.medications.map((medication, index) => (
                <div key={index} className='border rounded-lg p-4 mb-3 relative'>
                  {formData.medications.length > 1 && (
                    <button
                      type='button'
                      onClick={() => removeMedication(index)}
                      className='absolute top-2 right-2 text-red-500 hover:text-red-700'
                    >
                      ✕
                    </button>
                  )}
                  
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-xs text-gray-600 mb-1'>Medicine Name</label>
                      <input
                        type='text'
                        value={medication.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        className='w-full p-2 border rounded'
                        placeholder='e.g., Paracetamol'
                        required
                      />
                    </div>
                    <div>
                      <label className='block text-xs text-gray-600 mb-1'>Dosage</label>
                      <input
                        type='text'
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        className='w-full p-2 border rounded'
                        placeholder='e.g., 500mg'
                        required
                      />
                    </div>
                    <div>
                      <label className='block text-xs text-gray-600 mb-1'>Frequency</label>
                      <input
                        type='text'
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        className='w-full p-2 border rounded'
                        placeholder='e.g., Twice daily'
                        required
                      />
                    </div>
                    <div>
                      <label className='block text-xs text-gray-600 mb-1'>Duration</label>
                      <input
                        type='text'
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        className='w-full p-2 border rounded'
                        placeholder='e.g., 7 days'
                        required
                      />
                    </div>
                  </div>
                  <div className='mt-3'>
                    <label className='block text-xs text-gray-600 mb-1'>Instructions</label>
                    <input
                      type='text'
                      value={medication.instructions}
                      onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                      className='w-full p-2 border rounded'
                      placeholder='e.g., Take after meals'
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className='w-full p-3 border rounded-lg'
                rows={3}
                placeholder='Any additional notes or recommendations...'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Follow-up Date</label>
              <input
                type='date'
                value={formData.followUpDate}
                onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                className='p-3 border rounded-lg'
              />
            </div>

            <div className='flex gap-4'>
              <button
                type='submit'
                className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700'
              >
                Create Prescription
              </button>
              <button
                type='button'
                onClick={() => setShowPrescriptionForm(false)}
                className='bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400'
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full max-w-6xl m-5'>
      <p className='mb-3 text-lg font-medium'>Prescriptions</p>

      {/* Completed Appointments Section */}
      <div className='mb-8'>
        <h3 className='text-md font-medium mb-3'>Completed Appointments (Ready for Prescription)</h3>
        <div className='bg-white border rounded text-sm max-h-[40vh] overflow-y-scroll'>
          <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_2fr_1fr_1fr] gap-1 py-3 px-6 border-b'>
            <p>#</p>
            <p>Patient</p>
            <p>Age</p>
            <p>Date & Time</p>
            <p>Fees</p>
            <p>Action</p>
          </div>
          {completedAppointments.map((item, index) => (
            <div key={index} className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_2fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'>
              <p className='max-sm:hidden'>{index + 1}</p>
              <div className='flex items-center gap-2'>
                <img src={item.userData.image} className='w-8 rounded-full' alt="" />
                <p>{item.userData.name}</p>
              </div>
              <p className='max-sm:hidden'>{item.userData.dob ? new Date().getFullYear() - new Date(item.userData.dob).getFullYear() : 'N/A'}</p>
              <p>{item.slotDate}, {item.slotTime}</p>
              <p>{currency}{item.amount || 0}</p>
              <div>
                {hasExistingPrescription(item._id) ? (
                  <span className='text-green-600 text-xs font-medium'>Prescribed</span>
                ) : (
                  <button
                    onClick={() => handleCreatePrescription(item)}
                    className='bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700'
                  >
                    Create Prescription
                  </button>
                )}
              </div>
            </div>
          ))}
          {completedAppointments.length === 0 && (
            <div className='text-center py-6 text-gray-500'>
              No completed appointments available for prescription
            </div>
          )}
        </div>
      </div>

      {/* Existing Prescriptions Section */}
      <div>
        <h3 className='text-md font-medium mb-3'>Previous Prescriptions</h3>
        <div className='bg-white border rounded text-sm max-h-[40vh] overflow-y-scroll'>
          <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_2fr_1fr_1fr] gap-1 py-3 px-6 border-b'>
            <p>#</p>
            <p>Patient</p>
            <p>Diagnosis</p>
            <p>Date</p>
            <p>Medications</p>
            <p>Action</p>
          </div>
          {prescriptions.map((item, index) => (
            <div key={index} className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_2fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'>
              <p className='max-sm:hidden'>{index + 1}</p>
              <p>{item.patientData.name}</p>
              <p className='truncate'>{item.diagnosis}</p>
              <p>{formatDate(item.prescriptionDate)}</p>
              <p>{item.medications.length} medicine(s)</p>
              <button
                onClick={() => window.open(`${backendUrl}/api/prescription/${item._id}`, '_blank')}
                className='text-blue-600 hover:text-blue-700 text-xs'
              >
                View Details
              </button>
            </div>
          ))}
          {prescriptions.length === 0 && (
            <div className='text-center py-6 text-gray-500'>
              No prescriptions created yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DoctorPrescriptions
