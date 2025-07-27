import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { toast } from 'react-toastify';

const VideoCall = ({ sessionId, userType, onEndCall }) => {
    const [isCallActive, setIsCallActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sessionData, setSessionData] = useState(null);
    const [availableDevices, setAvailableDevices] = useState({ cameras: [], microphones: [] });
    const [selectedCamera, setSelectedCamera] = useState('');
    const [selectedMicrophone, setSelectedMicrophone] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [showEndCallConfirm, setShowEndCallConfirm] = useState(false);
    
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const containerRef = useRef(null);

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
        checkDevicePermissions();
        initializeWebRTC();
        
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
        };
    }, [fetchSessionData, checkDevicePermissions, initializeWebRTC]);

    // Check and request device permissions
    const checkDevicePermissions = useCallback(async () => {
        try {
            // Get available devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(device => device.kind === 'videoinput');
            const microphones = devices.filter(device => device.kind === 'audioinput');
            
            setAvailableDevices({ cameras, microphones });
            
            if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
            if (microphones.length > 0) setSelectedMicrophone(microphones[0].deviceId);
            
        } catch (error) {
            console.error('Error checking device permissions:', error);
            toast.error('Unable to access device permissions');
        }
    }, []);

    const initializeWebRTC = useCallback(async () => {
        try {
            setConnectionStatus('connecting');
            
            // Enhanced media constraints with selected devices
            const constraints = {
                video: {
                    deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 60 }
                },
                audio: {
                    deviceId: selectedMicrophone ? { exact: selectedMicrophone } : undefined,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };

            // Get user media with enhanced constraints
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.muted = true; // Prevent echo
            }

            // Enhanced peer connection configuration
            const configuration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            };
            
            peerConnectionRef.current = new RTCPeerConnection(configuration);
            
            // Add local stream to peer connection
            stream.getTracks().forEach(track => {
                peerConnectionRef.current.addTrack(track, stream);
            });

            // Enhanced connection state monitoring
            peerConnectionRef.current.onconnectionstatechange = () => {
                setConnectionStatus(peerConnectionRef.current.connectionState);
            };

            // Handle remote stream
            peerConnectionRef.current.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };

            setConnectionStatus('connected');
            toast.success('Camera and microphone connected successfully');

        } catch (error) {
            console.error('Error initializing WebRTC:', error);
            setConnectionStatus('failed');
            
            if (error.name === 'NotAllowedError') {
                toast.error('Camera and microphone access denied. Please allow permissions and refresh.');
            } else if (error.name === 'NotFoundError') {
                toast.error('No camera or microphone found. Please connect devices and refresh.');
            } else {
                toast.error('Failed to initialize video call. Please check your devices.');
            }
        }
    }, [selectedCamera, selectedMicrophone]);

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
            setConnectionStatus('disconnecting');
            
            if (userType === 'doctor' || userType === 'admin') {
                // Doctors and admins can officially end the session
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/telemedicine/end-session/${sessionId}`, {
                    prescriptionNotes: '',
                    doctorNotes: '',
                    followUpRequired: false
                });
                toast.success('Session ended successfully');
            } else {
                toast.info('You have left the session');
            }
            
            setIsCallActive(false);
            setConnectionStatus('disconnected');
            
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            
            if (onEndCall) {
                onEndCall();
            }
        } catch (error) {
            console.error('Error ending call:', error);
            toast.error('Failed to end session properly');
        }
    };

    const confirmEndCall = () => {
        if (userType === 'doctor' || userType === 'admin') {
            setShowEndCallConfirm(true);
        } else {
            endCall();
        }
    };

    const switchCamera = async (deviceId) => {
        try {
            setSelectedCamera(deviceId);
            
            if (localStreamRef.current) {
                const videoTrack = localStreamRef.current.getVideoTracks()[0];
                if (videoTrack) {
                    videoTrack.stop();
                }

                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: deviceId } },
                    audio: false
                });

                const newVideoTrack = newStream.getVideoTracks()[0];
                
                // Replace track in peer connection
                const sender = peerConnectionRef.current.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                if (sender) {
                    await sender.replaceTrack(newVideoTrack);
                }

                // Update local video
                localStreamRef.current.removeTrack(videoTrack);
                localStreamRef.current.addTrack(newVideoTrack);
                localVideoRef.current.srcObject = localStreamRef.current;
            }
        } catch (error) {
            console.error('Error switching camera:', error);
            toast.error('Failed to switch camera');
        }
    };

    const switchMicrophone = async (deviceId) => {
        try {
            setSelectedMicrophone(deviceId);
            
            if (localStreamRef.current) {
                const audioTrack = localStreamRef.current.getAudioTracks()[0];
                if (audioTrack) {
                    audioTrack.stop();
                }

                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: { deviceId: { exact: deviceId } }
                });

                const newAudioTrack = newStream.getAudioTracks()[0];
                
                // Replace track in peer connection
                const sender = peerConnectionRef.current.getSenders().find(s => 
                    s.track && s.track.kind === 'audio'
                );
                if (sender) {
                    await sender.replaceTrack(newAudioTrack);
                }

                // Update local stream
                localStreamRef.current.removeTrack(audioTrack);
                localStreamRef.current.addTrack(newAudioTrack);
            }
        } catch (error) {
            console.error('Error switching microphone:', error);
            toast.error('Failed to switch microphone');
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
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
        <div ref={containerRef} className="flex flex-col lg:flex-row h-screen bg-gray-900 relative">
            {/* Video Section - Responsive */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 relative bg-black">
                    {/* Connection Status */}
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            connectionStatus === 'connected' ? 'bg-green-500 text-white' :
                            connectionStatus === 'connecting' ? 'bg-yellow-500 text-black' :
                            connectionStatus === 'disconnecting' ? 'bg-orange-500 text-white' :
                            'bg-red-500 text-white'
                        }`}>
                            {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                        </div>
                    </div>

                    {/* Remote Video */}
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ 
                            aspectRatio: 'auto',
                            maxHeight: 'calc(100vh - 120px)'
                        }}
                    />
                    
                    {/* Local Video - Responsive positioning */}
                    <div className="absolute top-4 right-4 w-32 h-24 sm:w-48 sm:h-36 lg:w-64 lg:h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        {isVideoOff && (
                            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                                <span className="text-white text-2xl">📷</span>
                            </div>
                        )}
                    </div>

                    {/* Session Info */}
                    <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg shadow-lg">
                        <h3 className="font-semibold text-sm sm:text-base">
                            {sessionData && userType === 'patient' 
                                ? `Dr. ${sessionData.doctor?.name}` 
                                : sessionData?.patient?.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-300">
                            {sessionData?.sessionType} consultation
                        </p>
                        <p className="text-xs text-green-400 mt-1">
                            {sessionData?.duration || 30} min session
                        </p>
                    </div>

                    {/* Device Controls - Mobile responsive */}
                    <div className="absolute bottom-20 left-4 space-y-2">
                        {availableDevices.cameras.length > 1 && (
                            <select
                                value={selectedCamera}
                                onChange={(e) => switchCamera(e.target.value)}
                                className="bg-black bg-opacity-75 text-white text-xs p-2 rounded border-none outline-none"
                            >
                                {availableDevices.cameras.map(camera => (
                                    <option key={camera.deviceId} value={camera.deviceId}>
                                        📷 {camera.label || `Camera ${availableDevices.cameras.indexOf(camera) + 1}`}
                                    </option>
                                ))}
                            </select>
                        )}
                        
                        {availableDevices.microphones.length > 1 && (
                            <select
                                value={selectedMicrophone}
                                onChange={(e) => switchMicrophone(e.target.value)}
                                className="bg-black bg-opacity-75 text-white text-xs p-2 rounded border-none outline-none block"
                            >
                                {availableDevices.microphones.map(mic => (
                                    <option key={mic.deviceId} value={mic.deviceId}>
                                        🎤 {mic.label || `Microphone ${availableDevices.microphones.indexOf(mic) + 1}`}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Fullscreen Toggle */}
                    <button
                        onClick={toggleFullscreen}
                        className="absolute bottom-20 right-4 bg-black bg-opacity-75 text-white p-2 rounded-full hover:bg-opacity-90 transition-all"
                    >
                        {isFullscreen ? '🗗' : '🗖'}
                    </button>
                </div>

                {/* Enhanced Controls - Responsive */}
                <div className="bg-gray-800 p-3 sm:p-4 flex flex-wrap justify-center items-center gap-2 sm:gap-4">
                    {!isCallActive ? (
                        <button
                            onClick={joinCall}
                            disabled={connectionStatus === 'failed'}
                            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors flex items-center gap-2"
                        >
                            📞 Join Call
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={toggleMute}
                                className={`p-2 sm:p-3 rounded-full transition-all ${
                                    isMuted 
                                        ? 'bg-red-500 hover:bg-red-600' 
                                        : 'bg-gray-600 hover:bg-gray-700'
                                } text-white shadow-lg`}
                                title={isMuted ? 'Unmute' : 'Mute'}
                            >
                                <span className="text-lg">{isMuted ? '🔇' : '🎤'}</span>
                            </button>
                            
                            <button
                                onClick={toggleVideo}
                                className={`p-2 sm:p-3 rounded-full transition-all ${
                                    isVideoOff 
                                        ? 'bg-red-500 hover:bg-red-600' 
                                        : 'bg-gray-600 hover:bg-gray-700'
                                } text-white shadow-lg`}
                                title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                            >
                                <span className="text-lg">{isVideoOff ? '📹' : '📷'}</span>
                            </button>
                            
                            {/* End Call Button - Enhanced for doctor/admin */}
                            <button
                                onClick={confirmEndCall}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors flex items-center gap-2 shadow-lg"
                            >
                                📞 {userType === 'doctor' || userType === 'admin' ? 'End Session' : 'Leave Call'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Chat Section - Responsive */}
            <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l flex flex-col max-h-96 lg:max-h-none">
                <div className="p-3 sm:p-4 border-b bg-gray-50">
                    <h3 className="font-semibold text-sm sm:text-base">Chat Messages</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 min-h-32">
                    {chatMessages.length === 0 ? (
                        <p className="text-gray-500 text-center text-sm italic">No messages yet</p>
                    ) : (
                        chatMessages.map((msg, index) => (
                            <div
                                key={index}
                                className={`p-2 sm:p-3 rounded-lg max-w-xs ${
                                    msg.sender === userType
                                        ? 'bg-blue-500 text-white ml-auto'
                                        : 'bg-gray-200 text-gray-800'
                                }`}
                            >
                                <p className="text-xs sm:text-sm">{msg.message}</p>
                                <p className="text-xs opacity-70 mt-1">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        ))
                    )}
                </div>
                
                <div className="p-3 sm:p-4 border-t bg-gray-50">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!newMessage.trim()}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                            📤
                        </button>
                    </div>
                </div>
            </div>

            {/* End Call Confirmation Modal */}
            {showEndCallConfirm && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-semibold mb-4">End Session?</h3>
                        <p className="text-gray-600 mb-6">
                            {userType === 'doctor' || userType === 'admin' 
                                ? 'This will end the telemedicine session for all participants.' 
                                : 'Are you sure you want to leave this session?'}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowEndCallConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowEndCallConfirm(false);
                                    endCall();
                                }}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                                {userType === 'doctor' || userType === 'admin' ? 'End Session' : 'Leave'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

VideoCall.propTypes = {
    sessionId: PropTypes.string.isRequired,
    userType: PropTypes.oneOf(['patient', 'doctor']).isRequired,
    onEndCall: PropTypes.func
};

export default VideoCall;
