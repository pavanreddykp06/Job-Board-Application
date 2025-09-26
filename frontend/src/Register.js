import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';

const locationData = {
  India: {
    Karnataka: ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy'],
    Delhi: ['New Delhi', 'Dwarka', 'Rohini', 'Saket', 'Karol Bagh'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol'],
  },
};

const initialForm = {
  full_name: '',
  username: '',
  email: '',
  password: '',
  gender: '',
  role: '',
  country: 'India',
  state: '',
  city: '',
  phone: '',
};

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Update states when country changes
    if (form.country && locationData[form.country]) {
      setStates(Object.keys(locationData[form.country]));
    } else {
      setStates([]);
    }
    setForm(f => ({ ...f, state: '', city: '' }));
    setCities([]);
  }, [form.country]);

  useEffect(() => {
    // Update cities when state changes
    if (form.country && form.state && locationData[form.country][form.state]) {
      setCities(locationData[form.country][form.state]);
    } else {
      setCities([]);
    }
    setForm(f => ({ ...f, city: '' }));
  }, [form.state, form.country]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // TODO: Replace with real API call
    if (Object.values(form).some(v => !v)) {
      setError('Please fill all fields.');
      return;
    }
    setSuccess('Registration successful! You can now log in.');
    setTimeout(() => navigate('/login'), 1500);
  };

  return (
    <Container className="mt-5">
      <Card className="p-4 shadow col-md-8 mx-auto">
        <form onSubmit={handleSubmit}>
          <h3 className="mb-4 text-center">Register</h3>
          {success && <div className="alert alert-success text-center">{success}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="full_name">Full Name</label>
              <input type="text" className="form-control" name="full_name" value={form.full_name} onChange={handleChange} required />
            </div>
            <div className="col">
              <label htmlFor="username">Username</label>
              <input type="text" className="form-control" name="username" value={form.username} onChange={handleChange} required />
            </div>
          </div>
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="email">Email</label>
              <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="col">
              <label htmlFor="password">Password</label>
              <input type="password" className="form-control" name="password" value={form.password} onChange={handleChange} required />
            </div>
          </div>
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="gender">Gender</label>
              <select className="form-select" name="gender" value={form.gender} onChange={handleChange} required>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col">
              <label htmlFor="role">Role</label>
              <select className="form-select" name="role" value={form.role} onChange={handleChange} required>
                <option value="">Select Role</option>
                <option value="employer">Employer</option>
                <option value="job_seeker">Job Seeker</option>
              </select>
            </div>
          </div>
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="country">Country</label>
              <select className="form-select" name="country" value={form.country} onChange={handleChange} required>
                <option value="India">India</option>
              </select>
            </div>
            <div className="col">
              <label htmlFor="state">State</label>
              <select className="form-select" name="state" value={form.state} onChange={handleChange} required>
                <option value="">Select State</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="city">City</label>
              <select className="form-select" name="city" value={form.city} onChange={handleChange} required>
                <option value="">Select City</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="col">
              <label htmlFor="phone">Phone Number</label>
              <div className="input-group">
                <span className="input-group-text">+91</span>
                <input type="tel" className="form-control" name="phone" value={form.phone} onChange={handleChange} required placeholder="e.g. 9876543210" pattern="\d{10}" maxLength="10" title="Please enter exactly 10 digits" />
              </div>
            </div>
          </div>
          <Button type="submit" className="w-100">Register</Button>
          <div className="text-center mt-3">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </form>
      </Card>
    </Container>
  );
}