import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokens, setTokens] = useState(null);
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTokens(null);
    // TODO: Replace with real API call
    if (form.username && form.password) {
      setSuccess('Login successful!');
      setTokens({ access: 'demo-access-token', refresh: 'demo-refresh-token' });
      setTimeout(() => navigate('/dashboard'), 1500);
    } else {
      setError('Please enter username and password');
    }
  };

  return (
    <Container className="mt-5">
      <Card className="p-4 shadow col-md-6 mx-auto">
        <form onSubmit={handleSubmit}>
          <h3 className="mb-4 text-center">Login</h3>
          {success && <div className="alert alert-success text-center">{success}</div>}
          {tokens && (
            <div className="alert alert-success">
              <p><strong>Login successful!</strong></p>
              <p><strong>Access Token:</strong> {tokens.access}</p>
              <p><strong>Refresh Token:</strong> {tokens.refresh}</p>
            </div>
          )}
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="mb-3">
            <label htmlFor="username">Username</label>
            <input type="text" className="form-control" name="username" value={form.username} onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label htmlFor="password">Password</label>
            <input type="password" className="form-control" name="password" value={form.password} onChange={handleChange} required />
          </div>
          <Button type="submit" className="w-100">Login</Button>
        </form>
        <p className="text-center mt-3 mb-0">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
        <p className="text-center mt-3 mb-0">
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>
      </Card>
    </Container>
  );
}