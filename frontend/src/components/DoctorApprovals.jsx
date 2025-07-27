import { useState, useEffect, useContext, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

const DoctorApprovals = () => {
    const { token, backendUrl } = useContext(AppContext);
    const [pendingSessions, setPendingSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [actionType, setActionType] = useState('');
    const [note, setNote] = useState('');

    // Fetch pending sessions
    const fetchPendingSessions = useCallback(async () => {
        try {
            const response = await fetch(backendUrl + '/api/telemedicine/pending-sessions', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Filter for sessions assigned to this doctor
                const doctorSessions = data.sessions.filter(session => 
                    session.doctor._id === localStorage.getItem('doctorId')
                );
                setPendingSessions(doctorSessions);
            } else {
                toast.error('Failed to fetch pending sessions');
            }
        } catch (error) {
            console.error('Error fetching pending sessions:', error);
            toast.error('Error loading pending sessions');
        } finally {
            setLoading(false);
        }
    }, [backendUrl, token]);

    useEffect(() => {
        if (token) {
            fetchPendingSessions();
        }
    }, [token, fetchPendingSessions]);

    // Handle approve/reject action
    const handleAction = (session, action) => {
        setSelectedSession(session);
        setActionType(action);
        setShowModal(true);
    };

    // Submit action (approve/reject)
    const submitAction = async () => {
        try {
            const response = await fetch(
                backendUrl + `/api/telemedicine/doctor/${actionType}-session/${selectedSession._id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ note })
                }
            );

            if (response.ok) {
                toast.success(`Session ${actionType}d successfully`);
                fetchPendingSessions();
                setShowModal(false);
                setNote('');
                setSelectedSession(null);
            } else {
                const data = await response.json();
                toast.error(data.message || `Failed to ${actionType} session`);
            }
        } catch (error) {
            console.error(`Error ${actionType}ing session:`, error);
            toast.error(`Error ${actionType}ing session`);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl m-5">
            <div className="bg-white border rounded-lg shadow-sm">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-semibold text-gray-800">
                        Pending Telemedicine Approvals
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Review and approve/reject telemedicine session requests
                    </p>
                </div>

                {pendingSessions.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-gray-400 text-lg">No pending approvals</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Patient
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Session Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pendingSessions.map((session) => (
                                    <tr key={session._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {session.patient?.name || 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {session.patient?.email || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                                {session.sessionType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(session.scheduledTime)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                                                {session.sessionStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleAction(session, 'approve')}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleAction(session, 'reject')}
                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            {actionType === 'approve' ? 'Approve' : 'Reject'} Session
                        </h3>
                        
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                Patient: {selectedSession?.patient?.name}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                                Session Type: {selectedSession?.sessionType}
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Note (Optional)
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows="3"
                                placeholder={`Add a note about this ${actionType}...`}
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={submitAction}
                                className={`flex-1 py-2 px-4 rounded-md text-white font-medium ${
                                    actionType === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                {actionType === 'approve' ? 'Approve' : 'Reject'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setNote('');
                                    setSelectedSession(null);
                                }}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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

export default DoctorApprovals;
