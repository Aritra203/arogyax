import { useState } from 'react';
import VideoCall from '../components/VideoCall';

const VideoCallTest = () => {
    const [sessionId, setSessionId] = useState('');
    const [userType, setUserType] = useState('patient');
    const [showVideoCall, setShowVideoCall] = useState(false);

    const handleStartCall = () => {
        if (!sessionId.trim()) {
            alert('Please enter a session ID');
            return;
        }
        setShowVideoCall(true);
    };

    const handleEndCall = () => {
        setShowVideoCall(false);
        setSessionId('');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {!showVideoCall ? (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-6 text-center">Video Call Test</h2>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Session ID
                            </label>
                            <input
                                type="text"
                                value={sessionId}
                                onChange={(e) => setSessionId(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter session ID"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                User Type
                            </label>
                            <select
                                value={userType}
                                onChange={(e) => setUserType(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="patient">Patient</option>
                                <option value="doctor">Doctor</option>
                            </select>
                        </div>

                        <button
                            onClick={handleStartCall}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition duration-200"
                        >
                            Start Video Call
                        </button>

                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <h3 className="text-sm font-medium text-yellow-800 mb-2">Test Instructions:</h3>
                            <ul className="text-sm text-yellow-700 space-y-1">
                                <li>• Enter any session ID (e.g., &quot;test123&quot;)</li>
                                <li>• Select your user type</li>
                                <li>• Grant camera and microphone permissions</li>
                                <li>• Test device switching and controls</li>
                            </ul>
                        </div>
                    </div>
                </div>
            ) : (
                <VideoCall
                    sessionId={sessionId}
                    userType={userType}
                    onEndCall={handleEndCall}
                />
            )}
        </div>
    );
};

export default VideoCallTest;
