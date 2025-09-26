import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Alert, Button, Spinner } from 'react-bootstrap';
import { authService } from '../../services/api';

const EmailVerification = () => {
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get token from URL query parameters
        const queryParams = new URLSearchParams(location.search);
        const token = queryParams.get('token');

        if (!token) {
          setStatus('error');
          setMessage('Verification token is missing. Please check your email link.');
          return;
        }

        // Call the API to verify the email
        await authService.verifyEmail(token);
        
        setStatus('success');
        setMessage('Your email has been successfully verified! You can now log in to your account.');
      } catch (error) {
        setStatus('error');
        setMessage(error.message || 'Email verification failed. The token may be invalid or expired.');
      }
    };

    verifyEmail();
  }, [location]);

  const handleRedirect = () => {
    navigate('/login');
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="shadow-sm" style={{ width: '100%', maxWidth: '500px' }}>
        <Card.Body className="p-4">
          <Card.Title className="text-center mb-4">Email Verification</Card.Title>
          
          {status === 'verifying' && (
            <div className="text-center my-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Verifying your email address...</p>
            </div>
          )}

          {status === 'success' && (
            <Alert variant="success">
              <Alert.Heading>Verification Successful!</Alert.Heading>
              <p>{message}</p>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="danger">
              <Alert.Heading>Verification Failed</Alert.Heading>
              <p>{message}</p>
            </Alert>
          )}

          {(status === 'success' || status === 'error') && (
            <div className="text-center mt-3">
              <Button variant="primary" onClick={handleRedirect}>
                Go to Login
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EmailVerification;