import { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import AdmissionHistory from '../components/AdmissionHistory'

const MyProfile = () => {

    const [isEdit, setIsEdit] = useState(false)

    const [image, setImage] = useState(false)

    const { token, backendUrl, userData, setUserData, loadUserProfileData } = useContext(AppContext)

    // Function to update user profile data using API
    const updateUserProfileData = async () => {

        try {

            const formData = new FormData();

            formData.append('name', userData.name)
            formData.append('phone', userData.phone)
            formData.append('address', JSON.stringify(userData.address))
            formData.append('gender', userData.gender)
            formData.append('dob', userData.dob)
            
            // New fields
            formData.append('emergencyContact', JSON.stringify(userData.emergencyContact || {}))
            formData.append('governmentId', JSON.stringify(userData.governmentId || {}))
            formData.append('medicalHistory', JSON.stringify(userData.medicalHistory || {}))
            formData.append('currentMedications', JSON.stringify(userData.currentMedications || []))
            formData.append('insurance', JSON.stringify(userData.insurance || {}))
            formData.append('referral', JSON.stringify(userData.referral || {}))
            formData.append('bloodType', userData.bloodType || '')
            formData.append('height', userData.height || '')
            formData.append('weight', userData.weight || '')
            formData.append('occupation', userData.occupation || '')
            formData.append('maritalStatus', userData.maritalStatus || '')

            image && formData.append('image', image)

            const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                await loadUserProfileData()
                setIsEdit(false)
                setImage(false)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    return userData ? (
        <div className='max-w-4xl flex flex-col gap-6 text-sm pt-5 mx-auto px-4'>
            
            {/* Profile Picture and Name */}
            <div className='flex flex-col items-center gap-4'>
                {isEdit
                    ? <label htmlFor='image' >
                        <div className='inline-block relative cursor-pointer'>
                            <img 
                                className='w-36 rounded opacity-75' 
                                src={image ? URL.createObjectURL(image) : (userData.image && userData.image.length > 20 ? userData.image : assets.upload_area)} 
                                alt="Profile"
                                onError={(e) => { e.target.src = assets.upload_area; }}
                            />
                            <img className='w-10 absolute bottom-12 right-12' src={image ? '' : assets.upload_icon} alt="" />
                        </div>
                        <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
                    </label>
                    : <img 
                        className='w-36 rounded' 
                        src={userData.image && userData.image.length > 20 ? userData.image : assets.upload_area} 
                        alt="Profile"
                        onError={(e) => { e.target.src = assets.upload_area; }}
                      />
                }

                {isEdit
                    ? <input className='bg-gray-50 text-3xl font-medium max-w-60 text-center border rounded px-3 py-2' type="text" onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))} value={userData.name} />
                    : <p className='font-medium text-3xl text-[#262626] mt-4'>{userData.name}</p>
                }
            </div>

            <hr className='bg-[#ADADAD] h-[1px] border-none' />

            {/* Contact Information */}
            <div className='bg-white border rounded-lg p-6'>
                <p className='text-gray-600 font-semibold text-lg mb-4'>📞 CONTACT INFORMATION</p>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                        <p className='font-medium text-gray-700'>Email:</p>
                        <p className='text-blue-500'>{userData.email}</p>
                    </div>
                    <div>
                        <p className='font-medium text-gray-700'>Phone:</p>
                        {isEdit
                            ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' type="text" onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))} value={userData.phone} />
                            : <p className='text-gray-600'>{userData.phone}</p>
                        }
                    </div>
                    <div className='md:col-span-2'>
                        <p className='font-medium text-gray-700'>Address:</p>
                        {isEdit
                            ? <div className='space-y-2'>
                                <input className='bg-gray-50 border rounded px-3 py-1 w-full' placeholder="Address Line 1" type="text" onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))} value={userData.address?.line1 || ''} />
                                <input className='bg-gray-50 border rounded px-3 py-1 w-full' placeholder="Address Line 2" type="text" onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))} value={userData.address?.line2 || ''} />
                              </div>
                            : <p className='text-gray-600'>{userData.address?.line1} {userData.address?.line2 && <br />} {userData.address?.line2}</p>
                        }
                    </div>
                </div>
            </div>

            {/* Basic Information */}
            <div className='bg-white border rounded-lg p-6'>
                <p className='text-gray-600 font-semibold text-lg mb-4'>👤 BASIC INFORMATION</p>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <div>
                        <p className='font-medium text-gray-700'>Gender:</p>
                        {isEdit
                            ? <select className='bg-gray-50 border rounded px-3 py-1 w-full' onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))} value={userData.gender} >
                                <option value="Not Selected">Not Selected</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                            : <p className='text-gray-600'>{userData.gender}</p>
                        }
                    </div>
                    <div>
                        <p className='font-medium text-gray-700'>Date of Birth:</p>
                        {isEdit
                            ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' type='date' onChange={(e) => setUserData(prev => ({ ...prev, dob: e.target.value }))} value={userData.dob !== 'Not Selected' ? userData.dob : ''} />
                            : <p className='text-gray-600'>{userData.dob}</p>
                        }
                    </div>
                    <div>
                        <p className='font-medium text-gray-700'>Blood Type:</p>
                        {isEdit
                            ? <select className='bg-gray-50 border rounded px-3 py-1 w-full' onChange={(e) => setUserData(prev => ({ ...prev, bloodType: e.target.value }))} value={userData.bloodType || ''} >
                                <option value="">Select Blood Type</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                            : <p className='text-gray-600'>{userData.bloodType || 'Not specified'}</p>
                        }
                    </div>
                    <div>
                        <p className='font-medium text-gray-700'>Height:</p>
                        {isEdit
                            ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' placeholder="e.g., 5'8'' or 175cm" type="text" onChange={(e) => setUserData(prev => ({ ...prev, height: e.target.value }))} value={userData.height || ''} />
                            : <p className='text-gray-600'>{userData.height || 'Not specified'}</p>
                        }
                    </div>
                    <div>
                        <p className='font-medium text-gray-700'>Weight:</p>
                        {isEdit
                            ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' placeholder="e.g., 70kg or 154lbs" type="text" onChange={(e) => setUserData(prev => ({ ...prev, weight: e.target.value }))} value={userData.weight || ''} />
                            : <p className='text-gray-600'>{userData.weight || 'Not specified'}</p>
                        }
                    </div>
                    <div>
                        <p className='font-medium text-gray-700'>Occupation:</p>
                        {isEdit
                            ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' type="text" onChange={(e) => setUserData(prev => ({ ...prev, occupation: e.target.value }))} value={userData.occupation || ''} />
                            : <p className='text-gray-600'>{userData.occupation || 'Not specified'}</p>
                        }
                    </div>
                    <div>
                        <p className='font-medium text-gray-700'>Marital Status:</p>
                        {isEdit
                            ? <select className='bg-gray-50 border rounded px-3 py-1 w-full' onChange={(e) => setUserData(prev => ({ ...prev, maritalStatus: e.target.value }))} value={userData.maritalStatus || ''} >
                                <option value="">Select Status</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Widowed">Widowed</option>
                                <option value="Other">Other</option>
                            </select>
                            : <p className='text-gray-600'>{userData.maritalStatus || 'Not specified'}</p>
                        }
                    </div>
                </div>
            </div>

            {/* Emergency Contact */}
            <div className='bg-white border rounded-lg p-6'>
                <p className='text-gray-600 font-semibold text-lg mb-4'>🚨 EMERGENCY CONTACT</p>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                        <p className='font-medium text-gray-700'>Name:</p>
                        {isEdit
                            ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' type="text" onChange={(e) => setUserData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, name: e.target.value } }))} value={userData.emergencyContact?.name || ''} />
                            : <p className='text-gray-600'>{userData.emergencyContact?.name || 'Not specified'}</p>
                        }
                    </div>
                    <div>
                        <p className='font-medium text-gray-700'>Relationship:</p>
                        {isEdit
                            ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' type="text" onChange={(e) => setUserData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, relationship: e.target.value } }))} value={userData.emergencyContact?.relationship || ''} />
                            : <p className='text-gray-600'>{userData.emergencyContact?.relationship || 'Not specified'}</p>
                        }
                    </div>
                    <div>
                        <p className='font-medium text-gray-700'>Phone:</p>
                        {isEdit
                            ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' type="text" onChange={(e) => setUserData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, phone: e.target.value } }))} value={userData.emergencyContact?.phone || ''} />
                            : <p className='text-gray-600'>{userData.emergencyContact?.phone || 'Not specified'}</p>
                        }
                    </div>
                    <div>
                        <p className='font-medium text-gray-700'>Email:</p>
                        {isEdit
                            ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' type="email" onChange={(e) => setUserData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, email: e.target.value } }))} value={userData.emergencyContact?.email || ''} />
                            : <p className='text-gray-600'>{userData.emergencyContact?.email || 'Not specified'}</p>
                        }
                    </div>
                </div>
            </div>

            {/* Government ID (Optional) */}
            <div className='bg-white border rounded-lg p-6'>
                <p className='text-gray-600 font-semibold text-lg mb-4'>🆔 GOVERNMENT-ISSUED ID (Optional)</p>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                        <p className='font-medium text-gray-700'>ID Type:</p>
                        {isEdit
                            ? <select className='bg-gray-50 border rounded px-3 py-1 w-full' onChange={(e) => setUserData(prev => ({ ...prev, governmentId: { ...prev.governmentId, type: e.target.value } }))} value={userData.governmentId?.type || ''} >
                                <option value="">Select ID Type</option>
                                <option value="Passport">Passport</option>
                                <option value="Driver License">Driver License</option>
                                <option value="National ID">National ID</option>
                                <option value="SSN">SSN</option>
                                <option value="Other">Other</option>
                            </select>
                            : <p className='text-gray-600'>{userData.governmentId?.type || 'Not specified'}</p>
                        }
                    </div>
                    <div>
                        <p className='font-medium text-gray-700'>ID Number:</p>
                        {isEdit
                            ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' type="text" onChange={(e) => setUserData(prev => ({ ...prev, governmentId: { ...prev.governmentId, number: e.target.value } }))} value={userData.governmentId?.number || ''} />
                            : <p className='text-gray-600'>{userData.governmentId?.number ? '***' + userData.governmentId.number.slice(-4) : 'Not specified'}</p>
                        }
                    </div>
                    <div>
                        <p className='font-medium text-gray-700'>Issued Date:</p>
                        {isEdit
                            ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' type="date" onChange={(e) => setUserData(prev => ({ ...prev, governmentId: { ...prev.governmentId, issuedDate: e.target.value } }))} value={userData.governmentId?.issuedDate || ''} />
                            : <p className='text-gray-600'>{userData.governmentId?.issuedDate || 'Not specified'}</p>
                        }
                    </div>
                    <div>
                        <p className='font-medium text-gray-700'>Expiry Date:</p>
                        {isEdit
                            ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' type="date" onChange={(e) => setUserData(prev => ({ ...prev, governmentId: { ...prev.governmentId, expiryDate: e.target.value } }))} value={userData.governmentId?.expiryDate || ''} />
                            : <p className='text-gray-600'>{userData.governmentId?.expiryDate || 'Not specified'}</p>
                        }
                    </div>
                </div>
            </div>

            {/* Insurance Information */}
            <div className='bg-white border rounded-lg p-6'>
                <p className='text-gray-600 font-semibold text-lg mb-4'>🏥 INSURANCE INFORMATION</p>
                <div className='mb-4'>
                    <label className='flex items-center gap-2'>
                        <input 
                            type="checkbox" 
                            checked={userData.insurance?.hasInsurance || false}
                            onChange={(e) => setUserData(prev => ({ 
                                ...prev, 
                                insurance: { ...prev.insurance, hasInsurance: e.target.checked } 
                            }))}
                            disabled={!isEdit}
                        />
                        <span className='font-medium text-gray-700'>I have health insurance</span>
                    </label>
                </div>
                
                {userData.insurance?.hasInsurance && (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                        <div>
                            <p className='font-medium text-gray-700'>Insurance Provider:</p>
                            {isEdit
                                ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' type="text" onChange={(e) => setUserData(prev => ({ ...prev, insurance: { ...prev.insurance, primaryInsurance: { ...prev.insurance?.primaryInsurance, provider: e.target.value } } }))} value={userData.insurance?.primaryInsurance?.provider || ''} />
                                : <p className='text-gray-600'>{userData.insurance?.primaryInsurance?.provider || 'Not specified'}</p>
                            }
                        </div>
                        <div>
                            <p className='font-medium text-gray-700'>Policy Number:</p>
                            {isEdit
                                ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' type="text" onChange={(e) => setUserData(prev => ({ ...prev, insurance: { ...prev.insurance, primaryInsurance: { ...prev.insurance?.primaryInsurance, policyNumber: e.target.value } } }))} value={userData.insurance?.primaryInsurance?.policyNumber || ''} />
                                : <p className='text-gray-600'>{userData.insurance?.primaryInsurance?.policyNumber ? '***' + userData.insurance.primaryInsurance.policyNumber.slice(-4) : 'Not specified'}</p>
                            }
                        </div>
                        <div>
                            <p className='font-medium text-gray-700'>Group Number:</p>
                            {isEdit
                                ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' type="text" onChange={(e) => setUserData(prev => ({ ...prev, insurance: { ...prev.insurance, primaryInsurance: { ...prev.insurance?.primaryInsurance, groupNumber: e.target.value } } }))} value={userData.insurance?.primaryInsurance?.groupNumber || ''} />
                                : <p className='text-gray-600'>{userData.insurance?.primaryInsurance?.groupNumber || 'Not specified'}</p>
                            }
                        </div>
                        <div>
                            <p className='font-medium text-gray-700'>Policy Holder:</p>
                            {isEdit
                                ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' type="text" onChange={(e) => setUserData(prev => ({ ...prev, insurance: { ...prev.insurance, primaryInsurance: { ...prev.insurance?.primaryInsurance, policyHolderName: e.target.value } } }))} value={userData.insurance?.primaryInsurance?.policyHolderName || ''} />
                                : <p className='text-gray-600'>{userData.insurance?.primaryInsurance?.policyHolderName || 'Not specified'}</p>
                            }
                        </div>
                    </div>
                )}
            </div>

            {/* Medical History */}
            <div className='bg-white border rounded-lg p-6'>
                <p className='text-gray-600 font-semibold text-lg mb-4'>⚕️ MEDICAL HISTORY</p>
                <div className='space-y-4'>
                    <div>
                        <p className='font-medium text-gray-700'>Chronic Illnesses:</p>
                        {isEdit
                            ? <textarea className='bg-gray-50 border rounded px-3 py-2 w-full h-20' placeholder="List any chronic conditions, diagnosis dates, severity..." onChange={(e) => setUserData(prev => ({ ...prev, medicalHistory: { ...prev.medicalHistory, otherConditions: e.target.value } }))} value={userData.medicalHistory?.otherConditions || ''} />
                            : <p className='text-gray-600'>{userData.medicalHistory?.otherConditions || 'None reported'}</p>
                        }
                    </div>
                    <div>
                        <p className='font-medium text-gray-700'>Allergies:</p>
                        {isEdit
                            ? <textarea className='bg-gray-50 border rounded px-3 py-2 w-full h-16' placeholder="List allergies, reactions, severity..." onChange={(e) => setUserData(prev => ({ ...prev, medicalHistory: { ...prev.medicalHistory, familyHistory: e.target.value } }))} value={userData.medicalHistory?.familyHistory || ''} />
                            : <p className='text-gray-600'>{userData.medicalHistory?.familyHistory || 'None reported'}</p>
                        }
                    </div>
                </div>
            </div>

            {/* Current Medications */}
            <div className='bg-white border rounded-lg p-6'>
                <p className='text-gray-600 font-semibold text-lg mb-4'>💊 CURRENT MEDICATIONS</p>
                {isEdit
                    ? <textarea className='bg-gray-50 border rounded px-3 py-2 w-full h-24' placeholder="List current medications, dosages, frequency, prescribing doctor..." onChange={(e) => setUserData(prev => ({ ...prev, currentMedicationsText: e.target.value }))} value={userData.currentMedicationsText || ''} />
                    : <p className='text-gray-600'>{userData.currentMedicationsText || 'No current medications reported'}</p>
                }
            </div>

            {/* Referral Information */}
            <div className='bg-white border rounded-lg p-6'>
                <p className='text-gray-600 font-semibold text-lg mb-4'>🔗 REFERRAL INFORMATION</p>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                        <p className='font-medium text-gray-700'>Referral Source:</p>
                        {isEdit
                            ? <select className='bg-gray-50 border rounded px-3 py-1 w-full' onChange={(e) => setUserData(prev => ({ ...prev, referral: { ...prev.referral, type: e.target.value } }))} value={userData.referral?.type || ''} >
                                <option value="">Select Source</option>
                                <option value="Doctor">Doctor</option>
                                <option value="Hospital">Hospital</option>
                                <option value="Clinic">Clinic</option>
                                <option value="Insurance">Insurance</option>
                                <option value="Friend/Family">Friend/Family</option>
                                <option value="Online">Online</option>
                                <option value="Advertisement">Advertisement</option>
                                <option value="Other">Other</option>
                            </select>
                            : <p className='text-gray-600'>{userData.referral?.type || 'Not specified'}</p>
                        }
                    </div>
                    <div>
                        <p className='font-medium text-gray-700'>Doctor/Hospital Name:</p>
                        {isEdit
                            ? <input className='bg-gray-50 border rounded px-3 py-1 w-full' type="text" onChange={(e) => setUserData(prev => ({ ...prev, referral: { ...prev.referral, doctorName: e.target.value } }))} value={userData.referral?.doctorName || ''} />
                            : <p className='text-gray-600'>{userData.referral?.doctorName || 'Not specified'}</p>
                        }
                    </div>
                    <div className='md:col-span-2'>
                        <p className='font-medium text-gray-700'>Referral Reason:</p>
                        {isEdit
                            ? <textarea className='bg-gray-50 border rounded px-3 py-2 w-full h-16' onChange={(e) => setUserData(prev => ({ ...prev, referral: { ...prev.referral, reason: e.target.value } }))} value={userData.referral?.reason || ''} />
                            : <p className='text-gray-600'>{userData.referral?.reason || 'Not specified'}</p>
                        }
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-4 justify-center mb-10'>
                {isEdit
                    ? <div className='flex gap-4'>
                        <button onClick={updateUserProfileData} className='bg-primary text-white px-8 py-3 rounded-full hover:bg-primary-dark transition-all'>Save All Changes</button>
                        <button onClick={() => {setIsEdit(false); setImage(false);}} className='border border-gray-300 px-8 py-3 rounded-full hover:bg-gray-50 transition-all'>Cancel</button>
                      </div>
                    : <button onClick={() => setIsEdit(true)} className='border border-primary px-8 py-3 rounded-full hover:bg-primary hover:text-white transition-all'>Edit Profile</button>
                }
            </div>
            
            {/* Admission History Section */}
            <div className="mt-10">
                <AdmissionHistory 
                    backendUrl={backendUrl}
                    token={token}
                    title="My Admissions"
                />
            </div>
        </div>
    ) : null
}

export default MyProfile