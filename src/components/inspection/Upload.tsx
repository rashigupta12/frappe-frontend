/* eslint-disable @typescript-eslint/no-explicit-any */
import  { useState } from 'react';

type UploadResult =
  | {
      success: true;
      data: any;
      fileUrl: string;
      rawResponse: string;
    }
  | {
      success: false;
      error: string;
      details: any;
      rawResponse?: string;
      statusCode?: number;
    }
  | null;

const EnhancedFileUploadDebug = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult>(null);
  const [loading, setLoading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const clearLogs = () => {
    setDebugLogs([]);
    console.clear();
  };

  // Enhanced upload with better error handling
  type UploadOptions = {
    withAuth?: boolean;
    // Add other options here if needed
  };
  const uploadWithFetch = async (fileToUpload: File, options: UploadOptions = {}) => {
    const formData = new FormData();
    formData.append('file', fileToUpload);
    
    // Add additional fields that might be expected
    formData.append('doctype', 'File');
    formData.append('is_private', '0');
    
    addLog(`Starting upload for: ${fileToUpload.name} (${fileToUpload.size} bytes)`);
    
    try {
      const headers = {
        'Accept': 'application/json',
        // Note: Don't set Content-Type when using FormData, let browser set it
      };

      // Add any additional headers for testing
      if (options.withAuth) {
        // Add your auth headers here if needed
        // headers['Authorization'] = 'Bearer your-token';
      }

      const response = await fetch('/api/method/upload_file', {
        method: 'POST',
        body: formData,
        headers
      });
      
      addLog(`Response received - Status: ${response.status} ${response.statusText}`);
      addLog(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
      
      // Get raw response text first
      const rawResponse = await response.text();
      addLog(`Raw response (first 500 chars): ${rawResponse.substring(0, 500)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${rawResponse}`);
      }
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(rawResponse);
        addLog(`Successfully parsed JSON response`);
      } catch (parseError) {
        addLog(`JSON parse failed: ${parseError}`);
        throw new Error(`Invalid JSON response: ${rawResponse.substring(0, 200)}...`);
      }
      
      return { data, rawResponse };
    } catch (error) {
      addLog(`Upload error: ${error}`);
      throw error;
    }
  };

  const testUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setResult(null);
    clearLogs();
    
    try {
      const { data, rawResponse } = await uploadWithFetch(file);
      setResult({
        success: true,
        data: data,
        rawResponse: rawResponse,
        fileUrl: data.message?.file_url || data.message?.file_name || data.file_url || 'No URL found'
      });
      addLog('Upload completed successfully');
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      const statusCode = error?.message?.match(/HTTP (\d+):/)?.[1];
      
      setResult({
        success: false,
        error: errorMessage,
        details: error,
        rawResponse: error?.message?.includes('HTTP') ? error.message.split(': ').slice(1).join(': ') : undefined,
        statusCode: statusCode ? parseInt(statusCode) : undefined
      });
      addLog(`Upload failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced debug function
  const debugRequest = () => {
    if (!file) return;
    
    clearLogs();
    const formData = new FormData();
    formData.append('file', file);
    
    addLog('=== REQUEST DEBUG INFO ===');
    addLog(`File details: ${JSON.stringify({
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    })}`);
    
    addLog('FormData entries:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        addLog(`  ${key}: File(name=${value.name}, type=${value.type}, size=${value.size})`);
      } else {
        addLog(`  ${key}: ${value}`);
      }
    }
    
    addLog(`Target URL: ${window.location.origin}/api/method/upload_file`);
    addLog(`User Agent: ${navigator.userAgent}`);
    addLog('=== END DEBUG INFO ===');
  };

  // Test different request formats
  const testDifferentFormats = async () => {
    if (!file) return;
    
    clearLogs();
    addLog('Testing different request formats...');
    
    // Test 1: Minimal FormData (like Bruno might send)
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      addLog('Test 1: Minimal FormData');
      const response1 = await fetch('/api/method/upload_file', {
        method: 'POST',
        body: formData
      });
      const text1 = await response1.text();
      addLog(`Response 1: ${response1.status} - ${text1.substring(0, 200)}`);
    } catch (e) {
      addLog(`Test 1 failed: ${e}`);
    }

    // Test 2: With doctype field
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doctype', 'File');
      
      addLog('Test 2: With doctype field');
      const response2 = await fetch('/api/method/upload_file', {
        method: 'POST',
        body: formData
      });
      const text2 = await response2.text();
      addLog(`Response 2: ${response2.status} - ${text2.substring(0, 200)}`);
    } catch (e) {
      addLog(`Test 2 failed: ${e}`);
    }

    // Test 3: With additional common fields
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doctype', 'File');
      formData.append('is_private', '0');
      formData.append('folder', 'Home');
      
      addLog('Test 3: With additional fields');
      const response3 = await fetch('/api/method/upload_file', {
        method: 'POST',
        body: formData
      });
      const text3 = await response3.text();
      addLog(`Response 3: ${response3.status} - ${text3.substring(0, 200)}`);
    } catch (e) {
      addLog(`Test 3 failed: ${e}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Enhanced File Upload Debug Tool</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* File Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File to Test
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* File Info */}
            {file && (
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">File Info:</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Name: <code className="bg-white px-1 rounded">{file.name}</code></div>
                  <div>Type: <code className="bg-white px-1 rounded">{file.type}</code></div>
                  <div>Size: <code className="bg-white px-1 rounded">{(file.size / 1024).toFixed(2)} KB</code></div>
                  <div>Modified: <code className="bg-white px-1 rounded">{new Date(file.lastModified).toLocaleString()}</code></div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={testDifferentFormats}
                disabled={!file}
                className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 text-sm"
              >
                Test Formats
              </button>
              <button
                onClick={debugRequest}
                disabled={!file}
                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 text-sm"
              >
                Debug Request
              </button>
              <button
                onClick={testUpload}
                disabled={!file || loading}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
              >
                {loading ? 'Uploading...' : 'Test Upload'}
              </button>
              <button
                onClick={clearLogs}
                className="px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm"
              >
                Clear Logs
              </button>
            </div>

            {/* Results */}
            {result && (
              <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h3 className="font-medium mb-2">
                  {result.success ? '✅ Upload Success' : '❌ Upload Failed'}
                </h3>
                {result.success ? (
                  <div className="space-y-2">
                    <div className="text-sm">
                      File URL: <code className="bg-gray-100 px-1 rounded text-xs">{result.fileUrl}</code>
                    </div>
                    <details className="text-sm">
                      <summary className="cursor-pointer font-medium">Raw Response</summary>
                      <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                        {result.rawResponse}
                      </pre>
                    </details>
                    <details className="text-sm">
                      <summary className="cursor-pointer font-medium">Parsed Data</summary>
                      <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-red-700">
                      <strong>Error:</strong> {result.error}
                    </div>
                    {result.statusCode && (
                      <div className="text-sm text-red-600">
                        <strong>HTTP Status:</strong> {result.statusCode}
                      </div>
                    )}
                    {result.rawResponse && (
                      <details className="text-sm">
                        <summary className="cursor-pointer font-medium">Raw Server Response</summary>
                        <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                          {result.rawResponse}
                        </pre>
                      </details>
                    )}
                    <details className="text-sm">
                      <summary className="cursor-pointer font-medium">Error Details</summary>
                      <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Debug Log Panel */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Debug Logs</h3>
            <div className="bg-black text-green-400 p-3 rounded-md h-96 overflow-auto font-mono text-xs">
              {debugLogs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Click "Debug Request" or "Test Upload" to see logs.</div>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Troubleshooting Tips */}
        <div className="mt-6 bg-red-50 p-4 rounded-md">
          <h3 className="font-medium text-red-900 mb-2">🔍 JSONDecodeError Analysis:</h3>
          <div className="text-sm text-red-800 space-y-2">
            <p><strong>Your server is returning:</strong> <code>{"{"}"exc_type":"JSONDecodeError"{"}"}</code></p>
            <p><strong>This means:</strong> The backend is trying to parse JSON data and failing.</p>
            
            <div className="mt-3">
              <p className="font-medium mb-1">Possible causes:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Server expects additional form fields (doctype, is_private, etc.)</li>
                <li>Missing authentication headers/cookies</li>
                <li>Server configuration expecting JSON payload instead of FormData</li>
                <li>Backend trying to parse malformed JSON from database/config</li>
                <li>Different request format than what Bruno sends</li>
              </ul>
            </div>

            <div className="mt-3">
              <p className="font-medium mb-1">Debug steps:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Click "Test Formats" to try different FormData structures</li>
                <li>Compare with Bruno: Check what form fields Bruno sends</li>
                <li>Check backend logs for the actual JSON parsing error</li>
                <li>Verify if authentication/session is required</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFileUploadDebug;