import { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'

const StaffManagement = () => {
    const { aToken, backendUrl } = useContext(AdminContext)
    const [staff, setStaff] = useState([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingStaff, setEditingStaff] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'Nurse',
        department: '',
        qualification: '',
        experience: '',
        salary: '',
        address: { line1: '', line2: '', city: '', state: '', zipCode: '' },
        emergencyContact: { name: '', phone: '', relationship: '' },
        shifts: []
    })
    const [image, setImage] = useState(null)

    const roles = ['Doctor', 'Nurse', 'Technician', 'Administrator', 'Support Staff']
    const departments = ['Emergency', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'Administration']

    const fetchStaff = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/admin/staff-list`, {
                headers: { 'aToken': aToken }
            })
            const data = await response.json()
            if (data.success) {
                setStaff(data.staff)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Failed to fetch staff')
        }
    }

    useEffect(() => {
        if (aToken) {
            fetchStaff()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aToken])

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        const submitData = new FormData()
        Object.keys(formData).forEach(key => {
            if (key === 'address' || key === 'emergencyContact' || key === 'shifts') {
                submitData.append(key, JSON.stringify(formData[key]))
            } else {
                submitData.append(key, formData[key])
            }
        })
        
        if (image) {
            submitData.append('image', image)
        }

        try {
            const url = editingStaff
                ? `${backendUrl}/api/admin/update-staff/${editingStaff._id}`
                : `${backendUrl}/api/admin/add-staff`
            
            const method = editingStaff ? 'PUT' : 'POST'
            
            const response = await fetch(url, {
                method,
                headers: { 'aToken': aToken },
                body: submitData
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success(data.message)
                setShowAddForm(false)
                setEditingStaff(null)
                resetForm()
                fetchStaff()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Failed to save staff member')
        }
    }

    const deleteStaff = async (staffId) => {
        if (!window.confirm('Are you sure you want to delete this staff member?')) return

        try {
            const response = await fetch(`${backendUrl}/api/admin/delete-staff/${staffId}`, {
                method: 'DELETE',
                headers: { 'aToken': aToken }
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success(data.message)
                fetchStaff()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Failed to delete staff member')
        }
    }

    const editStaff = (staffMember) => {
        setEditingStaff(staffMember)
        setFormData({
            name: staffMember.name,
            email: staffMember.email,
            phone: staffMember.phone,
            role: staffMember.role,
            department: staffMember.department,
            qualification: staffMember.qualification,
            experience: staffMember.experience,
            salary: staffMember.salary,
            address: staffMember.address,
            emergencyContact: staffMember.emergencyContact,
            shifts: staffMember.shifts || []
        })
        setShowAddForm(true)
    }

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            role: 'Nurse',
            department: '',
            qualification: '',
            experience: '',
            salary: '',
            address: { line1: '', line2: '', city: '', state: '', zipCode: '' },
            emergencyContact: { name: '', phone: '', relationship: '' },
            shifts: []
        })
        setImage(null)
    }

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleNestedInputChange = (parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: { ...prev[parent], [field]: value }
        }))
    }

    return (
        <div className='w-full max-w-6xl m-5'>
            <div className='flex justify-between items-center mb-3'>
                <p className='text-lg font-medium'>Staff Management</p>
                <button
                    onClick={() => {
                        setShowAddForm(true)
                        setEditingStaff(null)
                        resetForm()
                    }}
                    className='bg-primary text-white px-4 py-2 rounded hover:bg-blue-600'
                >
                    Add New Staff
                </button>
            </div>

            {showAddForm && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
                        <div className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-bold'>
                                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddForm(false)
                                    setEditingStaff(null)
                                    resetForm()
                                }}
                                className='text-gray-500 hover:text-gray-700'
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className='space-y-4'>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                {/* Basic Information */}
                                <div>
                                    <label className='block text-sm font-medium mb-1'>Name *</label>
                                    <input
                                        type='text'
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                        required
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Email *</label>
                                    <input
                                        type='email'
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                        required
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Phone *</label>
                                    <input
                                        type='tel'
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                        required
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Role *</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => handleInputChange('role', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                        required
                                    >
                                        {roles.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Department *</label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => handleInputChange('department', e.target.value)}
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
                                    <label className='block text-sm font-medium mb-1'>Qualification *</label>
                                    <input
                                        type='text'
                                        value={formData.qualification}
                                        onChange={(e) => handleInputChange('qualification', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                        required
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Experience (years) *</label>
                                    <input
                                        type='number'
                                        value={formData.experience}
                                        onChange={(e) => handleInputChange('experience', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                        required
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Salary *</label>
                                    <input
                                        type='number'
                                        value={formData.salary}
                                        onChange={(e) => handleInputChange('salary', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                        required
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className='border-t pt-4'>
                                <h3 className='text-lg font-medium mb-2'>Address</h3>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Address Line 1 *</label>
                                        <input
                                            type='text'
                                            value={formData.address.line1}
                                            onChange={(e) => handleNestedInputChange('address', 'line1', e.target.value)}
                                            className='w-full border rounded px-3 py-2'
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Address Line 2</label>
                                        <input
                                            type='text'
                                            value={formData.address.line2}
                                            onChange={(e) => handleNestedInputChange('address', 'line2', e.target.value)}
                                            className='w-full border rounded px-3 py-2'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>City *</label>
                                        <input
                                            type='text'
                                            value={formData.address.city}
                                            onChange={(e) => handleNestedInputChange('address', 'city', e.target.value)}
                                            className='w-full border rounded px-3 py-2'
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>State *</label>
                                        <input
                                            type='text'
                                            value={formData.address.state}
                                            onChange={(e) => handleNestedInputChange('address', 'state', e.target.value)}
                                            className='w-full border rounded px-3 py-2'
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>ZIP Code *</label>
                                        <input
                                            type='text'
                                            value={formData.address.zipCode}
                                            onChange={(e) => handleNestedInputChange('address', 'zipCode', e.target.value)}
                                            className='w-full border rounded px-3 py-2'
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div className='border-t pt-4'>
                                <h3 className='text-lg font-medium mb-2'>Emergency Contact</h3>
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
                                            type='tel'
                                            value={formData.emergencyContact.phone}
                                            onChange={(e) => handleNestedInputChange('emergencyContact', 'phone', e.target.value)}
                                            className='w-full border rounded px-3 py-2'
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Relationship *</label>
                                        <input
                                            type='text'
                                            value={formData.emergencyContact.relationship}
                                            onChange={(e) => handleNestedInputChange('emergencyContact', 'relationship', e.target.value)}
                                            className='w-full border rounded px-3 py-2'
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Profile Image */}
                            <div className='border-t pt-4'>
                                <label className='block text-sm font-medium mb-1'>Profile Image</label>
                                <input
                                    type='file'
                                    accept='image/*'
                                    onChange={(e) => setImage(e.target.files[0])}
                                    className='w-full border rounded px-3 py-2'
                                />
                            </div>

                            <div className='flex justify-end gap-4 pt-4 border-t'>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setShowAddForm(false)
                                        setEditingStaff(null)
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
                                    {editingStaff ? 'Update' : 'Add'} Staff Member
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Staff List */}
            <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
                <div className='hidden sm:grid grid-cols-[0.5fr_1fr_2fr_1fr_1fr_1fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
                    <p>Image</p>
                    <p>Employee ID</p>
                    <p>Name</p>
                    <p>Role</p>
                    <p>Department</p>
                    <p>Phone</p>
                    <p>Status</p>
                    <p>Actions</p>
                </div>

                {staff.map((member) => (
                    <div key={member._id} className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid sm:grid-cols-[0.5fr_1fr_2fr_1fr_1fr_1fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'>
                        <img 
                            className='w-8 h-8 rounded-full object-cover' 
                            src={member.image || assets.upload_area} 
                            alt="" 
                        />
                        <p className='max-sm:hidden'>{member.employeeId}</p>
                        <p>{member.name}</p>
                        <p>{member.role}</p>
                        <p className='max-sm:hidden'>{member.department}</p>
                        <p>{member.phone}</p>
                        <p className={`${member.status === 'Active' ? 'text-green-500' : 'text-red-500'}`}>
                            {member.status}
                        </p>
                        <div className='flex gap-2'>
                            <button
                                onClick={() => editStaff(member)}
                                className='text-blue-500 hover:text-blue-700'
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => deleteStaff(member._id)}
                                className='text-red-500 hover:text-red-700'
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

export default StaffManagement
