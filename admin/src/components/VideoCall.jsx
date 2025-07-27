import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

const VideoCall = ({ sessionId, userType, onEndCall }) => {
    const [isCallActive, setIsCallActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sessionData, setSessionData] = useState(null);
    
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);

    const fetchSessionData = useCallback(async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/telemedicine/session/${sessionId}`);
            if (data.success) {
                setSessionData(data.session);
                setChatMessages(data.session.chatHistory || []);
            }
        } catch (error) {
            console.error('Error fetching session data:', error);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchSessionData();
        initializeWebRTC();
        
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
        };
    }, [fetchSessionData]);

    const initializeWebRTC = async () => {
        try {
            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Create peer connection
            const configuration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }
                ]
            };
            
            peerConnectionRef.current = new RTCPeerConnection(configuration);
            
            // Add local stream to peer connection
            stream.getTracks().forEach(track => {
                peerConnectionRef.current.addTrack(track, stream);
            });

            // Handle remote stream
            peerConnectionRef.current.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };

        } catch (error) {
            console.error('Error initializing WebRTC:', error);
        }
    };

    const joinCall = async () => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/telemedicine/join-session/${sessionId}`, {
                userType
            });
            
            if (data.success) {
                setIsCallActive(true);
            }
        } catch (error) {
            console.error('Error joining call:', error);
        }
    };

    const endCall = async () => {
        try {
            setIsCallActive(false);
            
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            
            if (onEndCall) {
                onEndCall();
            }
        } catch (error) {
            console.error('Error ending call:', error);
        }
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/telemedicine/add-message/${sessionId}`, {
                sender: userType,
                message: newMessage,
                messageType: 'text'
            });

            setChatMessages(prev => [...prev, {
                sender: userType,
                message: newMessage,
                timestamp: new Date(),
                messageType: 'text'
            }]);

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Video Section */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 relative bg-black">
                    {/* Remote Video */}
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    
                    {/* Local Video */}
                    <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Session Info */}
                    <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
                        <h3 className="font-semibold">
                            {sessionData && userType === 'patient' 
                                ? `Dr. ${sessionData.doctor?.name}` 
                                : sessionData?.patient?.name}
                        </h3>
                        <p className="text-sm text-gray-300">
                            {sessionData?.sessionType} consultation
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-white p-4 flex justify-center space-x-4">
                    {!isCallActive ? (
                        <button
                            onClick={joinCall}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
                        >
                            Join Call
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={toggleMute}
                                className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-500'} text-white`}
                            >
                                {isMuted ? '🔇' : '🎤'}
                            </button>
                            
                            <button
                                onClick={toggleVideo}
                                className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-500'} text-white`}
                            >
                                {isVideoOff ? '📹' : '📷'}
                            </button>
                            
                            <button
                                onClick={endCall}
                                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold"
                            >
                                End Call
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Chat Section */}
            <div className="w-80 bg-white border-l flex flex-col">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Chat</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map((msg, index) => (
                        <div
                            key={index}
                            className={`p-2 rounded-lg max-w-xs ${
                                msg.sender === userType
                                    ? 'bg-blue-500 text-white ml-auto'
                                    : 'bg-gray-200 text-gray-800'
                            }`}
                        >
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    ))}
                </div>
                
                <div className="p-4 border-t">
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 border rounded-lg px-3 py-2 text-sm"
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

VideoCall.propTypes = {
    sessionId: PropTypes.string.isRequired,
    userType: PropTypes.oneOf(['patient', 'doctor']).isRequired,
    onEndCall: PropTypes.func
};

export default VideoCall;
