import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { authService } from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    // Basic validation
    if (!email) {
      setError('Please enter your email address');
      setIsSubmitting(false);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      // Call the API to request password reset
      await authService.requestPasswordReset(email);
      setSuccess('Password reset link has been sent to your email. Please check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="mt-5">
      <Card className="p-4 shadow col-md-6 mx-auto">
        <Form onSubmit={handleSubmit}>
          <h3 className="mb-4 text-center">Forgot Password</h3>

          {success && <Alert variant="success">{success}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          <p className="text-muted mb-4">
            Enter your email address below and we'll send you a link to reset your password.
          </p>

          <Form.Group className="mb-3">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </Form.Group>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-100"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <div className="text-center mt-3">
            <Link to="/login">Back to Login</Link>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default ForgotPassword;