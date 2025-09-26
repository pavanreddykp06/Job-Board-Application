import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Row, Col, InputGroup, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/api';

const initialForm = {
  full_name: '',
  username: '',
  email: '',
  password: '',
  gender: '',
  role: '',
  country: '',
  state: '',
  city: '',
  phone: '',
};

const Register = () => {
  const [form, setForm] = useState(initialForm);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState({
    countries: false,
    states: false,
    cities: false,
    submit: false,
  });
  const [error, setError] = useState({});
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false); // New state for password toggle
  const navigate = useNavigate();
  const { login } = useAuth();

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(prev => ({ ...prev, countries: true }));
      try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries');
        const data = await response.json();
        if (data.error === false) {
          const countryList = data.data.map(country => country.country).sort();
          setCountries(countryList);
        } else {
          throw new Error('Failed to fetch countries');
        }
      } catch (err) {
        console.error('Error fetching countries:', err);
        setError(prev => ({ ...prev, location: 'Failed to load countries. Please try again.' }));
      } finally {
        setLoading(prev => ({ ...prev, countries: false }));
      }
    };
    fetchCountries();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    const fetchStates = async () => {
      if (!form.country) {
        setStates([]);
        setCities([]);
        setForm(prev => ({ ...prev, state: '', city: '' }));
        return;
      }

      setLoading(prev => ({ ...prev, states: true }));
      setError(prev => ({ ...prev, location: null }));
      try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country: form.country }),
        });
        const data = await response.json();
        if (data.error === false && data.data.states) {
          const stateList = data.data.states.map(state => state.name).sort();
          setStates(stateList);
        } else {
          setStates([]);
        }
      } catch (err) {
        console.error('Error fetching states:', err);
        setError(prev => ({ ...prev, location: 'Failed to load states.' }));
        setStates([]);
      } finally {
        setLoading(prev => ({ ...prev, states: false }));
      }
      setForm(prev => ({ ...prev, state: '', city: '' }));
      setCities([]);
    };

    if (form.country) fetchStates();
  }, [form.country]);

  // Fetch cities when state changes
  useEffect(() => {
    const fetchCities = async () => {
      if (!form.country || !form.state) {
        setCities([]);
        setForm(prev => ({ ...prev, city: '' }));
        return;
      }

      setLoading(prev => ({ ...prev, cities: true }));
      setError(prev => ({ ...prev, location: null }));
      try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country: form.country, state: form.state }),
        });
        const data = await response.json();
        if (data.error === false && data.data) {
          setCities(data.data.sort());
        } else {
          setCities([]);
        }
      } catch (err) {
        console.error('Error fetching cities:', err);
        setError(prev => ({ ...prev, location: 'Failed to load cities.' }));
        setCities([]);
      } finally {
        setLoading(prev => ({ ...prev, cities: false }));
      }
      setForm(prev => ({ ...prev, city: '' }));
    };

    if (form.state) fetchCities();
  }, [form.state, form.country]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error[name]) setError(prev => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    let newErrors = {};
    if (!form.full_name.trim()) newErrors.full_name = "Full name is required.";
    if (!form.username.trim()) newErrors.username = "Username is required.";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = "Valid email is required.";
    if (!form.password || form.password.length < 6) newErrors.password = "Password must be at least 6 characters.";
    if (!form.gender) newErrors.gender = "Gender is required.";
    if (!form.role) newErrors.role = "Role is required.";
    if (!form.country) newErrors.country = "Country is required.";
    if (!form.state) newErrors.state = "State is required.";
    if (!form.city) newErrors.city = "City is required.";
    if (!form.phone.match(/^\d{10}$/)) newErrors.phone = "Valid 10-digit phone number is required.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({});
    setSuccess('');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setError(validationErrors);
      return;
    }

    setLoading(prev => ({ ...prev, submit: true }));

    try {
      await authService.register(form);
      setSuccess('Registration successful! Redirecting...');
      await login({ username: form.username, password: form.password });
      navigate(form.role === 'job_seeker' ? '/job-seeker/dashboard' : '/employer/dashboard');
    } catch (err) {
      const backendErrors = err.response?.data || {};
      let newErrors = {};
      for (const key in backendErrors) {
        newErrors[key] = Array.isArray(backendErrors[key]) ? backendErrors[key][0] : backendErrors[key];
      }
      if (Object.keys(newErrors).length === 0) {
        newErrors.general = err.message || 'Registration failed. Please try again.';
      }
      setError(newErrors);
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  return (
    <Container className="mt-5">
      <Card className="p-4 shadow col-md-8 mx-auto">
        <Form onSubmit={handleSubmit} noValidate>
          <h3 className="mb-4 text-center">Register</h3>

          {success && <Alert variant="success" className="text-center">{success}</Alert>}
          {error.general && <Alert variant="danger">{error.general}</Alert>}
          {error.location && <Alert variant="warning">{error.location}</Alert>}

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Full Name</Form.Label>
                <Form.Control type="text" name="full_name" value={form.full_name} onChange={handleChange} isInvalid={!!error.full_name} />
                <Form.Control.Feedback type="invalid">{error.full_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Username</Form.Label>
                <Form.Control type="text" name="username" value={form.username} onChange={handleChange} isInvalid={!!error.username} />
                <Form.Control.Feedback type="invalid">{error.username}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" name="email" value={form.email} onChange={handleChange} isInvalid={!!error.email} />
                <Form.Control.Feedback type="invalid">{error.email}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    isInvalid={!!error.password}
                    placeholder="Enter password"
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowPassword(prev => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </Button>
                  <Form.Control.Feedback type="invalid">{error.password}</Form.Control.Feedback>
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Gender</Form.Label>
                <Form.Select name="gender" value={form.gender} onChange={handleChange} isInvalid={!!error.gender}>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{error.gender}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Role</Form.Label>
                <Form.Select name="role" value={form.role} onChange={handleChange} isInvalid={!!error.role}>
                  <option value="">Select Role</option>
                  <option value="employer">Employer</option>
                  <option value="job_seeker">Job Seeker</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{error.role}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          {/* Country, State, City Fields */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Country</Form.Label>
                <InputGroup>
                  <Form.Select name="country" value={form.country} onChange={handleChange} isInvalid={!!error.country} disabled={loading.countries}>
                    <option value="">Select Country</option>
                    {countries.map(country => <option key={country} value={country}>{country}</option>)}
                  </Form.Select>
                  {loading.countries && <InputGroup.Text><Spinner animation="border" size="sm" /></InputGroup.Text>}
                </InputGroup>
                <Form.Control.Feedback type="invalid">{error.country}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>State</Form.Label>
                <InputGroup>
                  <Form.Select name="state" value={form.state} onChange={handleChange} isInvalid={!!error.state} disabled={!form.country || loading.states}>
                    <option value="">Select State</option>
                    {states.map(state => <option key={state} value={state}>{state}</option>)}
                  </Form.Select>
                  {loading.states && <InputGroup.Text><Spinner animation="border" size="sm" /></InputGroup.Text>}
                </InputGroup>
                <Form.Control.Feedback type="invalid">{error.state}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>City</Form.Label>
                <InputGroup>
                  <Form.Select name="city" value={form.city} onChange={handleChange} isInvalid={!!error.city} disabled={!form.state || loading.cities}>
                    <option value="">Select City</option>
                    {cities.map(city => <option key={city} value={city}>{city}</option>)}
                  </Form.Select>
                  {loading.cities && <InputGroup.Text><Spinner animation="border" size="sm" /></InputGroup.Text>}
                </InputGroup>
                <Form.Control.Feedback type="invalid">{error.city}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Phone</Form.Label>
                <Form.Control type="tel" name="phone" value={form.phone} onChange={handleChange} isInvalid={!!error.phone} placeholder="e.g., 9876543210" />
                <Form.Control.Feedback type="invalid">{error.phone}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Button type="submit" variant="primary" className="w-100 mt-3" disabled={loading.submit}>
            {loading.submit ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Register'}
          </Button>
        </Form>

        <p className="text-center mt-3 mb-0">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </Card>
    </Container>
  );
};

export default Register;
