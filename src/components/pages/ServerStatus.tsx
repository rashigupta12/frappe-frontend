import { useState } from 'react';

const ServerDownScreen = () => {
  const [isRetrying, setIsRetrying] = useState(false);
  
  const handleRetry = () => {
    setIsRetrying(true);
    // Force a page reload to re-check server status
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '90%'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 1.5rem',
          backgroundColor: '#dc3545',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '2rem'
        }}>
          ⚠️
        </div>
        
        <h1 style={{
          color: '#dc3545',
          fontSize: '1.5rem',
          marginBottom: '1rem',
          fontWeight: '600'
        }}>
          Server is Currently Unavailable
        </h1>
        
        <p style={{
          color: '#6c757d',
          fontSize: '1rem',
          lineHeight: '1.5',
          marginBottom: '2rem'
        }}>
          We're unable to connect to the server at the moment. This could be due to maintenance or technical issues. Please try again later.
        </p>
        
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          style={{
            backgroundColor: isRetrying ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: isRetrying ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
        >
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
        
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          fontSize: '0.9rem',
          color: '#495057'
        }}>
          <strong>What you can do:</strong>
          <ul style={{
            textAlign: 'left',
            marginTop: '0.5rem',
            paddingLeft: '1rem'
          }}>
            <li>Check your internet connection</li>
            <li>Wait a few minutes and try again</li>
            <li>Contact support if the issue persists</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ServerDownScreen;