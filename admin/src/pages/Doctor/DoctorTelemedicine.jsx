import { useContext, useEffect, useState, useCallback } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import VideoCall from '../../components/VideoCall';

const DoctorTelemedicine = () => {
    const { dToken, backendUrl, profileData, getProfileData } = useContext(DoctorContext);
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [showEndSessionModal, setShowEndSessionModal] = useState(false);
    const [endSessionData, setEndSessionData] = useState({
        prescriptionNotes: '',
        doctorNotes: '',
        followUpRequired: false,
        followUpDate: ''
    });

    const fetchSessions = useCallback(async () => {
        try {
            if (!profileData || !profileData._id) {
                toast.error('Doctor profile not available');
                return;
            }

            const { data } = await axios.get(`${backendUrl}/api/telemedicine/doctor-sessions/${profileData._id}`, {
                headers: { dToken }
            });

            if (data.success) {
                setSessions(data.sessions);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch telemedicine sessions');
        }
    }, [backendUrl, dToken, profileData]);

    useEffect(() => {
        if (dToken && !profileData) {
            getProfileData();
        }
    }, [dToken, profileData, getProfileData]);

    useEffect(() => {
        if (dToken && profileData) {
            fetchSessions();
        }
    }, [dToken, profileData, fetchSessions]);

    const joinSession = (session) => {
        setActiveSession(session);
        setShowVideoCall(true);
    };

    const handleEndCall = () => {
        setShowVideoCall(false);
        setShowEndSessionModal(true);
    };

    const endSession = async () => {
        try {
            const { data } = await axios.post(`${backendUrl}/api/telemedicine/end-session/${activeSession._id}`, 
                endSessionData,
                { headers: { dToken } }
            );

            if (data.success) {
                toast.success('Session ended successfully');
                setShowEndSessionModal(false);
                setActiveSession(null);
                setEndSessionData({
                    prescriptionNotes: '',
                    doctorNotes: '',
                    followUpRequired: false,
                    followUpDate: ''
                });
                fetchSessions();
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to end session');
        }
    };

    if (showVideoCall && activeSession) {
        return (
            <VideoCall
                sessionId={activeSession._id}
                userType="doctor"
                onEndCall={handleEndCall}
            />
        );
    }

    return (
        <div className='w-full max-w-6xl m-5'>
            <p className='mb-3 text-lg font-medium'>Telemedicine Sessions</p>

            <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll'>
                <div className='hidden sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_1fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
                    <p>#</p>
                    <p>Patient</p>
                    <p>Type</p>
                    <p>Scheduled Time</p>
                    <p>Duration</p>
                    <p>Status</p>
                    <p>Actions</p>
                </div>

                {sessions.map((session, index) => (
                    <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_2fr_1fr_1fr_1fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
                        <p className='max-sm:hidden'>{index + 1}</p>
                        
                        <div className='flex items-center gap-2'>
                            <img 
                                className='w-8 rounded-full' 
                                src={session.patient.image || 'https://via.placeholder.com/32x32/f3f4f6/6b7280?text=P'} 
                                alt={session.patient.name}
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/32x32/f3f4f6/6b7280?text=P';
                                }}
                            />
                            <p>{session.patient.name}</p>
                        </div>
                        
                        <p className='max-sm:hidden'>
                            <span className={`px-2 py-1 rounded text-xs ${
                                session.sessionType === 'video' ? 'bg-blue-100 text-blue-600' :
                                session.sessionType === 'audio' ? 'bg-green-100 text-green-600' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {session.sessionType}
                            </span>
                        </p>
                        
                        <p className='max-sm:hidden'>
                            {new Date(session.scheduledTime).toLocaleString()}
                        </p>
                        
                        <p className='max-sm:hidden'>{session.duration} min</p>
                        
                        <p>
                            <span className={`px-2 py-1 rounded text-xs ${
                                session.sessionStatus === 'completed' ? 'bg-green-100 text-green-600' :
                                session.sessionStatus === 'ongoing' ? 'bg-blue-100 text-blue-600' :
                                session.sessionStatus === 'scheduled' ? 'bg-orange-100 text-orange-600' :
                                'bg-red-100 text-red-600'
                            }`}>
                                {session.sessionStatus}
                            </span>
                        </p>
                        
                        <div className='flex gap-2'>
                            {session.sessionStatus === 'scheduled' && (
                                <button 
                                    onClick={() => joinSession(session)}
                                    className='bg-primary px-3 py-1 rounded text-white text-xs hover:bg-primary-dark'
                                >
                                    Join
                                </button>
                            )}
                            
                            {session.sessionStatus === 'completed' && (
                                <button 
                                    className='bg-gray-100 px-3 py-1 rounded text-gray-600 text-xs cursor-default'
                                >
                                    Completed
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* End Session Modal */}
            {showEndSessionModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white p-6 rounded-lg w-96 max-w-md'>
                        <h3 className='text-lg font-medium mb-4'>End Session</h3>
                        
                        <div className='space-y-4'>
                            <div>
                                <label className='block text-sm font-medium mb-1'>Prescription Notes</label>
                                <textarea
                                    value={endSessionData.prescriptionNotes}
                                    onChange={(e) => setEndSessionData({...endSessionData, prescriptionNotes: e.target.value})}
                                    className='w-full border rounded px-3 py-2 text-sm'
                                    rows={3}
                                    placeholder='Enter prescription notes...'
                                />
                            </div>
                            
                            <div>
                                <label className='block text-sm font-medium mb-1'>Doctor Notes</label>
                                <textarea
                                    value={endSessionData.doctorNotes}
                                    onChange={(e) => setEndSessionData({...endSessionData, doctorNotes: e.target.value})}
                                    className='w-full border rounded px-3 py-2 text-sm'
                                    rows={3}
                                    placeholder='Enter private notes...'
                                />
                            </div>
                            
                            <div className='flex items-center gap-2'>
                                <input
                                    type='checkbox'
                                    id='followUp'
                                    checked={endSessionData.followUpRequired}
                                    onChange={(e) => setEndSessionData({...endSessionData, followUpRequired: e.target.checked})}
                                />
                                <label htmlFor='followUp' className='text-sm'>Follow-up required</label>
                            </div>
                            
                            {endSessionData.followUpRequired && (
                                <div>
                                    <label className='block text-sm font-medium mb-1'>Follow-up Date</label>
                                    <input
                                        type='date'
                                        value={endSessionData.followUpDate}
                                        onChange={(e) => setEndSessionData({...endSessionData, followUpDate: e.target.value})}
                                        className='w-full border rounded px-3 py-2 text-sm'
                                    />
                                </div>
                            )}
                        </div>
                        
                        <div className='flex gap-3 mt-6'>
                            <button
                                onClick={() => setShowEndSessionModal(false)}
                                className='flex-1 border border-gray-300 py-2 rounded text-sm hover:bg-gray-50'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={endSession}
                                className='flex-1 bg-primary text-white py-2 rounded text-sm hover:bg-primary-dark'
                            >
                                End Session
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorTelemedicine;
