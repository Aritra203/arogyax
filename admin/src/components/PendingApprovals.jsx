import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const PendingApprovals = () => {
    const { backendUrl, aToken } = useContext(AdminContext);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchSessions = async () => {
        if (!aToken || !backendUrl) return;
        setLoading(true);
        try {
            const response = await axios.get(backendUrl + '/api/telemedicine/pending-sessions', {
                headers: { Authorization: 'Bearer ' + aToken }
            });
            const validSessions = response.data.sessions ? response.data.sessions.filter(s => s && s._id) : [];
            setSessions(validSessions);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to load sessions');
            setSessions([]);
        }
        setLoading(false);
    };

    const handleAction = async (sessionId, action) => {
        if (!sessionId) return;
        try {
            await axios.patch(backendUrl + '/api/telemedicine/admin/' + action + '-session/' + sessionId, 
                { notes: action + 'd by admin' },
                { headers: { Authorization: 'Bearer ' + aToken } }
            );
            toast.success('Session ' + action + 'd successfully');
            fetchSessions();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to ' + action + ' session');
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [aToken, backendUrl]);

    if (loading) return React.createElement('div', { className: 'p-6' }, 'Loading sessions...');

    return React.createElement('div', { className: 'p-6' }, [
        React.createElement('h2', { key: 'title', className: 'text-2xl font-bold mb-6' }, 'Pending Sessions (' + sessions.length + ')'),
        sessions.length === 0 ? 
            React.createElement('p', { key: 'empty', className: 'text-gray-500' }, 'No pending sessions') :
            React.createElement('div', { key: 'list', className: 'space-y-4' }, 
                sessions.map(function(session) {
                    const sessionId = session._id || 'unknown';
                    const patientName = (session.patient && session.patient.name) ? session.patient.name : 'Unknown Patient';
                    const doctorName = (session.doctor && session.doctor.name) ? session.doctor.name : 'Unknown Doctor';
                    const sessionType = session.sessionType || 'Unknown';
                    
                    return React.createElement('div', { 
                        key: sessionId, 
                        className: 'bg-white p-4 border rounded shadow' 
                    }, [
                        React.createElement('p', { key: 'patient' }, React.createElement('strong', null, 'Patient: '), patientName),
                        React.createElement('p', { key: 'doctor' }, React.createElement('strong', null, 'Doctor: '), doctorName),
                        React.createElement('p', { key: 'type' }, React.createElement('strong', null, 'Type: '), sessionType),
                        React.createElement('div', { key: 'actions', className: 'mt-4 space-x-2' }, [
                            React.createElement('button', {
                                key: 'approve',
                                onClick: function() { handleAction(sessionId, 'approve'); },
                                className: 'bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700'
                            }, 'Approve'),
                            React.createElement('button', {
                                key: 'reject', 
                                onClick: function() { handleAction(sessionId, 'reject'); },
                                className: 'bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700'
                            }, 'Reject')
                        ])
                    ]);
                })
            )
    ]);
};

export default PendingApprovals;
