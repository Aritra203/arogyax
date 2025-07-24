import { useContext, useEffect, useState, useCallback } from 'react'
import { AppContext } from '../context/AppContext'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const MyPrescriptions = () => {
  const { backendUrl, token } = useContext(AppContext)
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  const getUserPrescriptions = useCallback(async () => {
    try {
      setLoading(true)
      
      // Debug logging
      console.log('Backend URL:', backendUrl)
      console.log('Token:', token ? 'Present' : 'Missing')
      
      if (!backendUrl) {
        toast.error('Backend URL not configured')
        return
      }
      
      if (!token) {
        toast.error('Please login to view prescriptions')
        return
      }

      const response = await fetch(`${backendUrl}/api/prescription/patient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({})
      })

      const data = await response.json()
      if (data.success) {
        setPrescriptions(data.prescriptions)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
      toast.error('Failed to fetch prescriptions')
    } finally {
      setLoading(false)
    }
  }, [backendUrl, token])

  useEffect(() => {
    if (token) {
      getUserPrescriptions()
    }
  }, [token, getUserPrescriptions])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const printPrescription = (prescription) => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Prescription - ${prescription.patientData.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .patient-info, .doctor-info { display: inline-block; width: 48%; vertical-align: top; }
            .info-section { margin-bottom: 20px; }
            .info-label { font-weight: bold; color: #333; }
            .diagnosis { background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
            .medications { margin: 20px 0; }
            .medication-item { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
            .medication-header { font-weight: bold; color: #007bff; margin-bottom: 10px; }
            .medication-details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .notes { background: #fff3cd; padding: 15px; border: 1px solid #ffeaa7; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @media print { 
              body { margin: 0; } 
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AROGYA-X HOSPITAL</h1>
            <h2>Medical Prescription</h2>
          </div>
          
          <div style="margin-bottom: 30px;">
            <div class="patient-info">
              <h3>Patient Information</h3>
              <p><span class="info-label">Name:</span> ${prescription.patientData.name}</p>
              <p><span class="info-label">Age:</span> ${prescription.patientData.age}</p>
              <p><span class="info-label">Gender:</span> ${prescription.patientData.gender}</p>
              <p><span class="info-label">Phone:</span> ${prescription.patientData.phone || 'N/A'}</p>
            </div>
            
            <div class="doctor-info">
              <h3>Doctor Information</h3>
              <p><span class="info-label">Dr.</span> ${prescription.doctorData.name}</p>
              <p><span class="info-label">Speciality:</span> ${prescription.doctorData.speciality}</p>
              <p><span class="info-label">Degree:</span> ${prescription.doctorData.degree}</p>
              <p><span class="info-label">Date:</span> ${formatDate(prescription.prescriptionDate)}</p>
            </div>
          </div>

          <div class="diagnosis">
            <h3>Diagnosis</h3>
            <p>${prescription.diagnosis}</p>
          </div>

          <div class="medications">
            <h3>Prescribed Medications</h3>
            ${prescription.medications.map((med, index) => `
              <div class="medication-item">
                <div class="medication-header">${index + 1}. ${med.name}</div>
                <div class="medication-details">
                  <div><span class="info-label">Dosage:</span> ${med.dosage}</div>
                  <div><span class="info-label">Frequency:</span> ${med.frequency}</div>
                  <div><span class="info-label">Duration:</span> ${med.duration}</div>
                  <div><span class="info-label">Instructions:</span> ${med.instructions || 'As directed'}</div>
                </div>
              </div>
            `).join('')}
          </div>

          ${prescription.notes ? `
            <div class="notes">
              <h3>Additional Notes</h3>
              <p>${prescription.notes}</p>
            </div>
          ` : ''}

          ${prescription.followUpDate ? `
            <div class="info-section">
              <p><span class="info-label">Follow-up Date:</span> ${formatDate(prescription.followUpDate)}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>This prescription is generated electronically and is valid without signature.</p>
            <p>For any queries, please contact AROGYA-X Hospital</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-[50vh]'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary'></div>
      </div>
    )
  }

  return (
    <div className='max-w-6xl mx-auto p-4'>
      <p className='pb-3 mt-12 text-lg font-medium text-gray-600 border-b'>My Prescriptions</p>
      
      {prescriptions.length === 0 ? (
        <div className='text-center py-12'>
          <img src={assets.appointment_img} alt="" className='w-32 mx-auto mb-4 opacity-50' />
          <p className='text-gray-500 text-lg'>No prescriptions found</p>
          <p className='text-gray-400 text-sm mt-2'>Your prescriptions from doctors will appear here</p>
        </div>
      ) : (
        <div className='grid gap-6 pt-6'>
          {prescriptions.map((prescription, index) => (
            <div key={index} className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow'>
              <div className='flex justify-between items-start mb-4'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-800'>
                    Dr. {prescription.doctorData.name}
                  </h3>
                  <p className='text-sm text-gray-600'>{prescription.doctorData.speciality}</p>
                  <p className='text-xs text-gray-500 mt-1'>
                    Prescribed on {formatDate(prescription.prescriptionDate)}
                  </p>
                </div>
                <button
                  onClick={() => printPrescription(prescription)}
                  className='bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors flex items-center gap-2'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' />
                  </svg>
                  Print
                </button>
              </div>

              <div className='grid md:grid-cols-2 gap-6'>
                <div>
                  <h4 className='font-medium text-gray-700 mb-2'>Diagnosis</h4>
                  <p className='text-gray-600 bg-blue-50 p-3 rounded border-l-4 border-blue-400'>
                    {prescription.diagnosis}
                  </p>
                </div>

                <div>
                  <h4 className='font-medium text-gray-700 mb-2'>
                    Medications ({prescription.medications.length})
                  </h4>
                  <div className='space-y-2 max-h-48 overflow-y-auto'>
                    {prescription.medications.map((med, medIndex) => (
                      <div key={medIndex} className='bg-gray-50 p-3 rounded border'>
                        <div className='font-medium text-gray-800'>{med.name}</div>
                        <div className='text-sm text-gray-600 mt-1'>
                          <span className='inline-block mr-4'>
                            <strong>Dosage:</strong> {med.dosage}
                          </span>
                          <span className='inline-block mr-4'>
                            <strong>Frequency:</strong> {med.frequency}
                          </span>
                        </div>
                        <div className='text-sm text-gray-600'>
                          <span className='inline-block mr-4'>
                            <strong>Duration:</strong> {med.duration}
                          </span>
                          {med.instructions && (
                            <span className='inline-block'>
                              <strong>Instructions:</strong> {med.instructions}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {prescription.notes && (
                <div className='mt-4'>
                  <h4 className='font-medium text-gray-700 mb-2'>Additional Notes</h4>
                  <p className='text-gray-600 bg-yellow-50 p-3 rounded border-l-4 border-yellow-400'>
                    {prescription.notes}
                  </p>
                </div>
              )}

              {prescription.followUpDate && (
                <div className='mt-4 flex items-center gap-2 text-sm text-gray-600'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                  </svg>
                  <span>Follow-up Date: {formatDate(prescription.followUpDate)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyPrescriptions
