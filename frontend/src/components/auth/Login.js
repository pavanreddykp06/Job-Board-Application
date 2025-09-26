import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '', role: 'job_seeker' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokens, setTokens] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTokens(null);

    try {
      if (!form.username || !form.password) {
        setError('Please enter username and password');
        return;
      }

      // Call login function from AuthContext which uses the API
      const userData = await login({
        username: form.username,
        password: form.password,
        role: form.role
      });
      
      setSuccess('Login successful!');
      
      // Redirect after a short delay to show success message
      setTimeout(() => {
        if (userData.role === 'job_seeker') {
          navigate('/job-seeker/dashboard');
        } else {
          navigate('/employer/dashboard');
        }
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    }
  };

  return (
    <Container className="mt-5">
      <Card className="p-4 shadow col-md-6 mx-auto">
        <Form onSubmit={handleSubmit}>
          <h3 className="mb-4 text-center">Login</h3>

          {success && <Alert variant="success">{success}</Alert>}
          
          {tokens && (
            <Alert variant="success">
              <p><strong>Login successful!</strong></p>
              <p><strong>Access Token:</strong> {tokens.access}</p>
              <p><strong>Refresh Token:</strong> {tokens.refresh}</p>
            </Alert>
          )}
          
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control 
              type="text" 
              name="username" 
              value={form.username} 
              onChange={handleChange} 
              required 
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control 
              type="password" 
              name="password" 
              value={form.password} 
              onChange={handleChange} 
              required 
            />
          </Form.Group>


          <Button type="submit" variant="primary" className="w-100">
            Login
          </Button>
        </Form>

        <p className="text-center mt-3 mb-0">
          Don't have an account?
          <Link to="/register"> Register</Link>
        </p>

        <p className="text-center mt-3 mb-0">
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>
      </Card>
    </Container>
  );
};

export default Login;