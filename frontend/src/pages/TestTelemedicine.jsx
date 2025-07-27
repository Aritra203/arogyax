import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';

const TestTelemedicine = () => {
    const { backendUrl, token, userData } = useContext(AppContext);
    const [testResults, setTestResults] = useState({});

    const runTests = async () => {
        const results = {};
        
        // Test 1: Check backend health
        try {
            const healthResponse = await axios.get(`${backendUrl}/api/health`);
            results.healthCheck = { success: true, data: healthResponse.data };
        } catch (error) {
            results.healthCheck = { success: false, error: error.message };
        }

        // Test 2: Check if user data is available
        results.userData = userData ? { success: true, userId: userData._id } : { success: false, error: 'No user data' };

        // Test 3: Check if token is available
        results.token = token ? { success: true, hasToken: true } : { success: false, error: 'No token' };

        // Test 4: Test telemedicine endpoint
        if (userData && userData._id && token) {
            try {
                const telemedicineResponse = await axios.get(
                    `${backendUrl}/api/telemedicine/patient-sessions/${userData._id}`,
                    { headers: { token } }
                );
                results.telemedicineAPI = { success: true, data: telemedicineResponse.data };
            } catch (error) {
                results.telemedicineAPI = { 
                    success: false, 
                    error: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText
                };
            }
        } else {
            results.telemedicineAPI = { success: false, error: 'Missing userData or token' };
        }

        setTestResults(results);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Telemedicine API Test</h1>
            
            <button 
                onClick={runTests}
                className="bg-blue-500 text-white px-4 py-2 rounded mb-4 hover:bg-blue-600"
            >
                Run Tests
            </button>

            <div className="space-y-4">
                <div className="bg-gray-100 p-4 rounded">
                    <h3 className="font-semibold">Current Configuration:</h3>
                    <p>Backend URL: {backendUrl}</p>
                    <p>Has Token: {token ? 'Yes' : 'No'}</p>
                    <p>User ID: {userData?._id || 'Not available'}</p>
                </div>

                {Object.keys(testResults).length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg">Test Results:</h3>
                        
                        {Object.entries(testResults).map(([testName, result]) => (
                            <div 
                                key={testName}
                                className={`p-3 rounded border-l-4 ${
                                    result.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                                }`}
                            >
                                <h4 className="font-medium capitalize">{testName.replace(/([A-Z])/g, ' $1')}</h4>
                                <pre className="text-sm mt-2 overflow-x-auto">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestTelemedicine;
