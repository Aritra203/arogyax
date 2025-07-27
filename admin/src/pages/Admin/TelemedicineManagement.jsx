import { useContext, useEffect, useState, useCallback } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const TelemedicineManagement = () => {
    const { backendUrl, aToken } = useContext(AdminContext);
    const [sessions, setSessions] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [selectedTab, setSelectedTab] = useState('sessions');
    const [loading, setLoading] = useState(false);
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [feeSettings, setFeeSettings] = useState({
        consultationFee: 50,
        followUpFee: 30,
        emergencyFee: 150
    });

    // Fetch all telemedicine sessions
    const fetchAllSessions = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${backendUrl}/api/telemedicine/admin/all-sessions`, {
                headers: { aToken }
            });

            if (data.success) {
                setSessions(data.sessions);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch telemedicine sessions');
        } finally {
            setLoading(false);
        }
    }, [backendUrl, aToken]);

    // Fetch all doctors
    const fetchDoctors = useCallback(async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/admin/all-doctors`, {
                headers: { aToken }
            });

            if (data.success) {
                setDoctors(data.doctors);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch doctors');
        }
    }, [backendUrl, aToken]);

    useEffect(() => {
        if (aToken) {
            fetchAllSessions();
            fetchDoctors();
        }
    }, [aToken, fetchAllSessions, fetchDoctors]);

    // Update doctor telemedicine fees
    const updateDoctorFees = async (doctorId, fees) => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/telemedicine/admin/update-doctor-fees`, {
                doctorId,
                ...fees
            }, {
                headers: { aToken }
            });

            if (data.success) {
                toast.success('Doctor fees updated successfully');
                setShowFeeModal(false);
                fetchDoctors();
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update doctor fees');
        }
    };

    // Cancel a telemedicine session
    const cancelSession = async (sessionId) => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/telemedicine/admin/cancel-session/${sessionId}`, {}, {
                headers: { aToken }
            });

            if (data.success) {
                toast.success('Session cancelled successfully');
                fetchAllSessions();
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to cancel session');
        }
    };

    const openFeeModal = (doctor) => {
        setSelectedDoctor(doctor);
        setFeeSettings({
            consultationFee: doctor.consultationFee || 50,
            followUpFee: doctor.followUpFee || 30,
            emergencyFee: doctor.emergencyFee || 150
        });
        setShowFeeModal(true);
    };

    const handleFeeUpdate = () => {
        if (selectedDoctor) {
            updateDoctorFees(selectedDoctor._id, feeSettings);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'text-orange-600 bg-orange-100';
            case 'ongoing': return 'text-blue-600 bg-blue-100';
            case 'completed': return 'text-green-600 bg-green-100';
            case 'cancelled': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className='m-5 max-h-[90vh] overflow-y-scroll'>
            <div className='flex justify-between items-center mb-6'>
                <h1 className='text-2xl font-semibold text-gray-700'>Telemedicine Management</h1>
                <div className='flex gap-2'>
                    <button
                        onClick={() => setSelectedTab('sessions')}
                        className={`px-4 py-2 rounded-md ${selectedTab === 'sessions' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Sessions
                    </button>
                    <button
                        onClick={() => setSelectedTab('doctors')}
                        className={`px-4 py-2 rounded-md ${selectedTab === 'doctors' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Doctor Fees
                    </button>
                    <button
                        onClick={() => setSelectedTab('analytics')}
                        className={`px-4 py-2 rounded-md ${selectedTab === 'analytics' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Analytics
                    </button>
                </div>
            </div>

            {/* Sessions Tab */}
            {selectedTab === 'sessions' && (
                <div>
                    <div className='bg-white rounded-lg shadow-md p-6'>
                        <h2 className='text-lg font-semibold mb-4'>All Telemedicine Sessions</h2>
                        
                        {loading ? (
                            <div className='text-center py-8'>Loading sessions...</div>
                        ) : sessions.length === 0 ? (
                            <div className='text-center py-8 text-gray-500'>No telemedicine sessions found</div>
                        ) : (
                            <div className='overflow-x-auto'>
                                <table className='w-full border-collapse'>
                                    <thead>
                                        <tr className='border-b'>
                                            <th className='text-left py-3 px-4'>Patient</th>
                                            <th className='text-left py-3 px-4'>Doctor</th>
                                            <th className='text-left py-3 px-4'>Type</th>
                                            <th className='text-left py-3 px-4'>Scheduled</th>
                                            <th className='text-left py-3 px-4'>Duration</th>
                                            <th className='text-left py-3 px-4'>Fee</th>
                                            <th className='text-left py-3 px-4'>Status</th>
                                            <th className='text-left py-3 px-4'>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sessions.map((session) => (
                                            <tr key={session._id} className='border-b hover:bg-gray-50'>
                                                <td className='py-3 px-4'>
                                                    <div>
                                                        <p className='font-medium'>{session.patient?.name}</p>
                                                        <p className='text-sm text-gray-500'>{session.patient?.email}</p>
                                                    </div>
                                                </td>
                                                <td className='py-3 px-4'>
                                                    <div>
                                                        <p className='font-medium'>Dr. {session.doctor?.name}</p>
                                                        <p className='text-sm text-gray-500'>{session.doctor?.speciality}</p>
                                                    </div>
                                                </td>
                                                <td className='py-3 px-4'>
                                                    <span className='capitalize'>{session.sessionType}</span>
                                                </td>
                                                <td className='py-3 px-4'>
                                                    <div>
                                                        <p>{new Date(session.scheduledTime).toLocaleDateString()}</p>
                                                        <p className='text-sm text-gray-500'>
                                                            {new Date(session.scheduledTime).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className='py-3 px-4'>{session.duration} mins</td>
                                                <td className='py-3 px-4'>${session.sessionFee}</td>
                                                <td className='py-3 px-4'>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(session.sessionStatus)}`}>
                                                        {session.sessionStatus}
                                                    </span>
                                                </td>
                                                <td className='py-3 px-4'>
                                                    {session.sessionStatus === 'scheduled' && (
                                                        <button
                                                            onClick={() => cancelSession(session._id)}
                                                            className='text-red-600 hover:text-red-800 text-sm'
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Doctors Fee Management Tab */}
            {selectedTab === 'doctors' && (
                <div>
                    <div className='bg-white rounded-lg shadow-md p-6'>
                        <h2 className='text-lg font-semibold mb-4'>Doctor Telemedicine Fees</h2>
                        
                        <div className='grid gap-4'>
                            {doctors.map((doctor) => (
                                <div key={doctor._id} className='border rounded-lg p-4'>
                                    <div className='flex justify-between items-center'>
                                        <div className='flex items-center gap-4'>
                                            <img 
                                                src={doctor.image || 'https://via.placeholder.com/64x64/f3f4f6/6b7280?text=Dr'} 
                                                alt={doctor.name}
                                                className='w-16 h-16 rounded-full object-cover'
                                                onError={(e) => {
                                                    e.target.src = 'https://via.placeholder.com/64x64/f3f4f6/6b7280?text=Dr';
                                                }}
                                            />
                                            <div>
                                                <h3 className='font-semibold'>Dr. {doctor.name}</h3>
                                                <p className='text-gray-600'>{doctor.speciality}</p>
                                            </div>
                                        </div>
                                        <div className='flex gap-4 text-sm'>
                                            <div className='text-center'>
                                                <p className='text-gray-500'>Consultation</p>
                                                <p className='font-semibold'>${doctor.consultationFee || 50}</p>
                                            </div>
                                            <div className='text-center'>
                                                <p className='text-gray-500'>Follow-up</p>
                                                <p className='font-semibold'>${doctor.followUpFee || 30}</p>
                                            </div>
                                            <div className='text-center'>
                                                <p className='text-gray-500'>Emergency</p>
                                                <p className='font-semibold'>${doctor.emergencyFee || 150}</p>
                                            </div>
                                            <button
                                                onClick={() => openFeeModal(doctor)}
                                                className='bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark'
                                            >
                                                Update Fees
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Analytics Tab */}
            {selectedTab === 'analytics' && (
                <div>
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
                        <div className='bg-white p-6 rounded-lg shadow-md'>
                            <h3 className='text-sm text-gray-500 mb-2'>Total Sessions</h3>
                            <p className='text-2xl font-bold text-blue-600'>{sessions.length}</p>
                        </div>
                        <div className='bg-white p-6 rounded-lg shadow-md'>
                            <h3 className='text-sm text-gray-500 mb-2'>Active Sessions</h3>
                            <p className='text-2xl font-bold text-green-600'>
                                {sessions.filter(s => s.sessionStatus === 'ongoing').length}
                            </p>
                        </div>
                        <div className='bg-white p-6 rounded-lg shadow-md'>
                            <h3 className='text-sm text-gray-500 mb-2'>Completed</h3>
                            <p className='text-2xl font-bold text-indigo-600'>
                                {sessions.filter(s => s.sessionStatus === 'completed').length}
                            </p>
                        </div>
                        <div className='bg-white p-6 rounded-lg shadow-md'>
                            <h3 className='text-sm text-gray-500 mb-2'>Total Revenue</h3>
                            <p className='text-2xl font-bold text-purple-600'>
                                ${sessions.filter(s => s.sessionStatus === 'completed')
                                    .reduce((sum, s) => sum + s.sessionFee, 0)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Fee Update Modal */}
            {showFeeModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white p-6 rounded-lg max-w-md w-full mx-4'>
                        <h3 className='text-lg font-semibold mb-4'>
                            Update Fees for Dr. {selectedDoctor?.name}
                        </h3>
                        
                        <div className='space-y-4'>
                            <div>
                                <label className='block text-sm font-medium mb-2'>Consultation Fee ($)</label>
                                <input
                                    type="number"
                                    value={feeSettings.consultationFee}
                                    onChange={(e) => setFeeSettings({
                                        ...feeSettings,
                                        consultationFee: Number(e.target.value)
                                    })}
                                    className='w-full p-2 border rounded-md'
                                    min="0"
                                />
                            </div>
                            
                            <div>
                                <label className='block text-sm font-medium mb-2'>Follow-up Fee ($)</label>
                                <input
                                    type="number"
                                    value={feeSettings.followUpFee}
                                    onChange={(e) => setFeeSettings({
                                        ...feeSettings,
                                        followUpFee: Number(e.target.value)
                                    })}
                                    className='w-full p-2 border rounded-md'
                                    min="0"
                                />
                            </div>
                            
                            <div>
                                <label className='block text-sm font-medium mb-2'>Emergency Fee ($)</label>
                                <input
                                    type="number"
                                    value={feeSettings.emergencyFee}
                                    onChange={(e) => setFeeSettings({
                                        ...feeSettings,
                                        emergencyFee: Number(e.target.value)
                                    })}
                                    className='w-full p-2 border rounded-md'
                                    min="0"
                                />
                            </div>
                        </div>
                        
                        <div className='flex gap-2 mt-6'>
                            <button
                                onClick={handleFeeUpdate}
                                className='flex-1 bg-primary text-white py-2 rounded-md hover:bg-primary-dark'
                            >
                                Update Fees
                            </button>
                            <button
                                onClick={() => setShowFeeModal(false)}
                                className='flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400'
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TelemedicineManagement;
