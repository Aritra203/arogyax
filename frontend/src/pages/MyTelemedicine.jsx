import { useState, useEffect, useContext, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import VideoCall from '../components/VideoCall';
import { validateImageUrl, handleImageError } from '../utils/imageUtils';

const MyTelemedicine = () => {
    const { backendUrl, token, userData, doctors } = useContext(AppContext);
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [showCreateSession, setShowCreateSession] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [sessionType, setSessionType] = useState('consultation');
    const [scheduledTime, setScheduledTime] = useState('');

    const fetchSessions = useCallback(async () => {
        try {
            if (!userData || !userData._id) {
                toast.error('User data not available');
                return;
            }
            
            console.log('Fetching sessions for user:', userData._id);
            console.log('Backend URL:', backendUrl);
            console.log('Full URL:', `${backendUrl}/api/telemedicine/patient-sessions/${userData._id}`);
            
            const { data } = await axios.get(`${backendUrl}/api/telemedicine/patient-sessions/${userData._id}`, {
                headers: { token }
            });

            if (data.success) {
                setSessions(data.sessions);
            } else {
                toast.error(data.message || 'Failed to fetch sessions');
            }
        } catch (error) {
            console.error('Full error:', error);
            console.error('Error response:', error.response);
            
            if (error.response?.status === 404) {
                toast.error('Telemedicine service not available. The feature may not be deployed on the production server.');
            } else if (error.response?.status === 401) {
                toast.error('Authentication failed. Please login again.');
            } else {
                toast.error('Failed to fetch telemedicine sessions');
            }
        }
    }, [backendUrl, token, userData]);

    useEffect(() => {
        if (token && userData) {
            fetchSessions();
        }
    }, [token, userData, fetchSessions]);

    const joinSession = (session) => {
        setActiveSession(session);
        setShowVideoCall(true);
    };

    const endCall = () => {
        setShowVideoCall(false);
        setActiveSession(null);
        fetchSessions(); // Refresh sessions
    };

    const rateSession = async (sessionId, rating) => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/telemedicine/rate-session/${sessionId}`, {
                rating
            }, {
                headers: { token }
            });

            if (data.success) {
                toast.success('Session rated successfully');
                fetchSessions();
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to rate session');
        }
    };

    const createNewSession = async (e) => {
        e.preventDefault();
        try {
            if (!userData || !userData._id) {
                toast.error('User data not available');
                return;
            }

            if (!selectedDoctor) {
                toast.error('Please select a doctor');
                return;
            }

            if (!scheduledTime) {
                toast.error('Please select a scheduled time');
                return;
            }

            console.log('Creating session with data:', {
                patientId: userData._id,
                doctorId: selectedDoctor,
                sessionType,
                scheduledTime: new Date(scheduledTime).toISOString()
            });

            const { data } = await axios.post(`${backendUrl}/api/telemedicine/create-session`, {
                patientId: userData._id,
                doctorId: selectedDoctor,
                sessionType,
                scheduledTime: new Date(scheduledTime).toISOString()
            }, {
                headers: { token }
            });

            console.log('Server response:', data);

            if (data.success) {
                toast.success('Telemedicine session created successfully');
                setShowCreateSession(false);
                fetchSessions();
                // Reset form
                setSelectedDoctor('');
                setSessionType('consultation');
                setScheduledTime('');
            } else {
                toast.error(data.message || 'Failed to create session');
            }
        } catch (error) {
            console.error('Full error:', error);
            console.error('Error response:', error.response);
            
            if (error.response?.status === 404) {
                toast.error('Telemedicine service not available. The backend may not have been updated yet.');
            } else if (error.response?.status === 401) {
                toast.error('Authentication failed. Please login again.');
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to create session');
            }
        }
    };

    if (showVideoCall && activeSession) {
        return (
            <VideoCall
                sessionId={activeSession._id}
                userType="patient"
                onEndCall={endCall}
            />
        );
    }

    return (
        <div className='m-5'>
            <div className='flex justify-between items-center pb-3 mt-12'>
                <p className='font-medium text-zinc-700 border-b'>My Telemedicine Sessions</p>
                <button 
                    onClick={() => {
                        if (!doctors || doctors.length === 0) {
                            toast.error('No doctors available. Please refresh the page.');
                            return;
                        }
                        setShowCreateSession(true);
                    }}
                    className='bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors'
                >
                    Book New Session
                </button>
            </div>

            {/* Create Session Modal */}
            {showCreateSession && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white p-6 rounded-lg max-w-md w-full mx-4'>
                        <h3 className='text-lg font-semibold mb-4'>Book Telemedicine Session</h3>
                        
                        {/* Debug info */}
                        <div className='mb-4 p-2 bg-gray-100 rounded text-xs'>
                            <p>Backend: {backendUrl}</p>
                            <p>Available Doctors: {doctors?.length || 0}</p>
                            <p>User ID: {userData?._id ? 'Available' : 'Missing'}</p>
                            <p>Token: {token ? 'Available' : 'Missing'}</p>
                        </div>
                        
                        <form onSubmit={createNewSession}>
                            <div className='mb-4'>
                                <label className='block text-sm font-medium mb-2'>Select Doctor</label>
                                <select 
                                    value={selectedDoctor} 
                                    onChange={(e) => setSelectedDoctor(e.target.value)}
                                    className='w-full p-2 border rounded-md'
                                    required
                                >
                                    <option value="">Choose a doctor</option>
                                    {doctors.map((doctor) => (
                                        <option key={doctor._id} value={doctor._id}>
                                            Dr. {doctor.name} - {doctor.speciality}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className='mb-4'>
                                <label className='block text-sm font-medium mb-2'>Session Type</label>
                                <select 
                                    value={sessionType} 
                                    onChange={(e) => setSessionType(e.target.value)}
                                    className='w-full p-2 border rounded-md'
                                >
                                    <option value="consultation">Consultation</option>
                                    <option value="follow-up">Follow-up</option>
                                    <option value="emergency">Emergency</option>
                                </select>
                            </div>

                            <div className='mb-4'>
                                <label className='block text-sm font-medium mb-2'>Scheduled Time</label>
                                <input 
                                    type="datetime-local" 
                                    value={scheduledTime} 
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    className='w-full p-2 border rounded-md'
                                    required
                                />
                            </div>

                            <div className='flex gap-2'>
                                <button 
                                    type="submit"
                                    className='flex-1 bg-primary text-white py-2 rounded-md hover:bg-primary-dark transition-colors'
                                >
                                    Book Session
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setShowCreateSession(false)}
                                    className='flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 transition-colors'
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <div className='w-full mt-5'>
                {sessions.length === 0 ? (
                    <div className='text-center py-10'>
                        <p className='text-gray-500'>No telemedicine sessions found</p>
                    </div>
                ) : (
                    sessions.map((session, index) => (
                        <div key={index} className='grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4 py-4 border-b'>
                            <div>
                                <img 
                                    className='w-32 bg-indigo-50' 
                                    src={validateImageUrl(session.doctor?.image, 'doctor')} 
                                    alt={session.doctor?.name || 'Doctor'}
                                    onError={(e) => handleImageError(e, 'doctor')}
                                />
                            </div>
                            <div className='flex-1 text-sm text-zinc-600'>
                                <p className='text-neutral-800 font-semibold'>Dr. {session.doctor.name}</p>
                                <p>{session.doctor.speciality}</p>
                                <p className='text-zinc-700 font-medium mt-1'>
                                    Session Type: <span className='text-xs text-indigo-600'>{session.sessionType}</span>
                                </p>
                                <p className='text-zinc-700 font-medium mt-1'>
                                    Scheduled: <span className='text-xs text-indigo-600'>
                                        {new Date(session.scheduledTime).toLocaleString()}
                                    </span>
                                </p>
                                <p className='text-zinc-700 font-medium mt-1'>
                                    Status: <span className={`text-xs ${
                                        session.sessionStatus === 'completed' ? 'text-green-600' :
                                        session.sessionStatus === 'ongoing' ? 'text-blue-600' :
                                        session.sessionStatus === 'scheduled' ? 'text-orange-600' :
                                        'text-red-600'
                                    }`}>
                                        {session.sessionStatus.charAt(0).toUpperCase() + session.sessionStatus.slice(1)}
                                    </span>
                                </p>
                                <p className='text-zinc-700 font-medium mt-1'>
                                    Duration: <span className='text-xs text-indigo-600'>{session.duration} minutes</span>
                                </p>
                                <p className='text-zinc-700 font-medium mt-1'>
                                    Fee: <span className='text-xs text-indigo-600'>${session.sessionFee}</span>
                                </p>
                                
                                {session.prescriptionNotes && (
                                    <div className='mt-2 p-2 bg-blue-50 rounded'>
                                        <p className='text-xs font-medium text-blue-800'>Prescription Notes:</p>
                                        <p className='text-xs text-blue-600'>{session.prescriptionNotes}</p>
                                    </div>
                                )}

                                <div className='flex gap-2 mt-3'>
                                    {session.sessionStatus === 'scheduled' && (
                                        <button 
                                            onClick={() => joinSession(session)}
                                            className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'
                                        >
                                            Join Session
                                        </button>
                                    )}
                                    
                                    {session.sessionStatus === 'completed' && !session.patientRating && (
                                        <div className='flex items-center gap-2'>
                                            <span className='text-xs'>Rate:</span>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => rateSession(session._id, star)}
                                                    className='text-yellow-400 hover:text-yellow-500'
                                                >
                                                    ⭐
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {session.patientRating && (
                                        <div className='flex items-center gap-1'>
                                            <span className='text-xs'>Your Rating:</span>
                                            <div className='flex'>
                                                {Array.from({ length: session.patientRating }, (_, i) => (
                                                    <span key={i} className='text-yellow-400'>⭐</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {session.followUpRequired && (
                                    <div className='mt-2 p-2 bg-yellow-50 rounded'>
                                        <p className='text-xs font-medium text-yellow-800'>
                                            Follow-up Required: {new Date(session.followUpDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyTelemedicine;
