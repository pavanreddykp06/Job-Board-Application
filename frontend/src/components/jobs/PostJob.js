import React, { useState } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { jobService } from '../../services/api';

const PostJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    job_type: 'Full-Time',
    skills_required: '',
    salary_min: '',
    salary_max: '',
    location_city: '',
    location_state: '',
    application_deadline: '',
    job_description_pdf: null,
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      job_description_pdf: e.target.files[0],
    });
  };

  const validateForm = () => {
    let newErrors = {};

    // Regex patterns
    const cityStateRegex = /^[A-Za-z\s]{2,50}$/; // only letters and spaces
    const skillsRegex = /^[A-Za-z0-9\s,.-]+$/;   // letters, numbers, comma, dot, dash
    const salaryRegex = /^[0-9]+$/;              // only digits

    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.description.trim()) newErrors.description = 'Job summary is required';
    if (!formData.job_type) newErrors.job_type = 'Job type is required';

    if (!formData.location_city.trim()) {
      newErrors.location_city = 'City is required';
    } else if (!cityStateRegex.test(formData.location_city)) {
      newErrors.location_city = 'City must contain only letters';
    }

    if (!formData.location_state.trim()) {
      newErrors.location_state = 'State is required';
    } else if (!cityStateRegex.test(formData.location_state)) {
      newErrors.location_state = 'State must contain only letters';
    }

    if (!formData.skills_required.trim()) {
      newErrors.skills_required = 'Skills are required';
    } else if (!skillsRegex.test(formData.skills_required)) {
      newErrors.skills_required = 'Only letters, numbers, commas, dots and dashes allowed';
    }

    if (formData.salary_min) {
      if (!salaryRegex.test(formData.salary_min)) {
        newErrors.salary_min = 'Minimum salary must be a valid number';
      } else if (parseInt(formData.salary_min, 10) < 0) {
        newErrors.salary_min = 'Minimum salary cannot be negative';
      }
    }

    if (formData.salary_max) {
      if (!salaryRegex.test(formData.salary_max)) {
        newErrors.salary_max = 'Maximum salary must be a valid number';
      } else if (parseInt(formData.salary_max, 10) < 0) {
        newErrors.salary_max = 'Maximum salary cannot be negative';
      } else if (
        formData.salary_min &&
        parseInt(formData.salary_max, 10) < parseInt(formData.salary_min, 10)
      ) {
        newErrors.salary_max = 'Maximum salary cannot be less than minimum salary';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('job_type', formData.job_type);
    data.append('skills_required', formData.skills_required);
    data.append('location_city', formData.location_city);
    data.append('location_state', formData.location_state);

    if (formData.application_deadline) {
      data.append('application_deadline', formData.application_deadline);
    }
    if (formData.salary_min) {
      data.append('salary_min', formData.salary_min);
    }
    if (formData.salary_max) {
      data.append('salary_max', formData.salary_max);
    }
    if (formData.job_description_pdf) {
      data.append('job_description_pdf', formData.job_description_pdf);
    }

    try {
      await jobService.createJob(data);
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        navigate('/employer/manage-jobs');
      }, 2000);
    } catch (err) {
      let errorMessage = 'Failed to post job. Please try again.';
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          const errors = [];
          for (const [field, messages] of Object.entries(err.response.data)) {
            if (Array.isArray(messages)) {
              errors.push(`${field}: ${messages.join(', ')}`);
            } else {
              errors.push(`${field}: ${messages}`);
            }
          }
          errorMessage = errors.join('; ');
        } else {
          errorMessage = err.response.data;
        }
      }
      setError(errorMessage);
      console.error('Job post error:', err.response?.data);
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm">
            <Card.Header as="h5" className="bg-primary text-white">
              Post a New Job
            </Card.Header>
            <Card.Body className="p-4">
              {success && <Alert variant="success">Job posted successfully! Redirecting...</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit} noValidate>
                <h5 className="mb-4">Job Details</h5>

                <Form.Group className="mb-3">
                  <Form.Label>Job Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    isInvalid={!!errors.title}
                  />
                  <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Brief Job Summary</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    isInvalid={!!errors.description}
                  />
                  <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Job Description (PDF)</Form.Label>
                  <Form.Control
                    type="file"
                    name="job_description_pdf"
                    onChange={handleFileChange}
                    accept=".pdf"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Job Type</Form.Label>
                      <Form.Select
                        name="job_type"
                        value={formData.job_type}
                        onChange={handleInputChange}
                        isInvalid={!!errors.job_type}
                      >
                        <option value="">Select Job Type</option>
                        <option value="Full-Time">Full-Time</option>
                        <option value="Part-Time">Part-Time</option>
                        <option value="Internship">Internship</option>
                        <option value="Remote">Remote</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.job_type}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>City</Form.Label>
                          <Form.Control
                            type="text"
                            name="location_city"
                            value={formData.location_city}
                            onChange={handleInputChange}
                            isInvalid={!!errors.location_city}
                          />
                          <Form.Control.Feedback type="invalid">{errors.location_city}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>State</Form.Label>
                          <Form.Control
                            type="text"
                            name="location_state"
                            value={formData.location_state}
                            onChange={handleInputChange}
                            isInvalid={!!errors.location_state}
                          />
                          <Form.Control.Feedback type="invalid">{errors.location_state}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Required Skills</Form.Label>
                  <Form.Control
                    type="text"
                    name="skills_required"
                    value={formData.skills_required}
                    onChange={handleInputChange}
                    isInvalid={!!errors.skills_required}
                  />
                  <Form.Control.Feedback type="invalid">{errors.skills_required}</Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Minimum Salary</Form.Label>
                      <Form.Control
                        type="text"
                        name="salary_min"
                        value={formData.salary_min}
                        onChange={handleInputChange}
                        isInvalid={!!errors.salary_min}
                      />
                      <Form.Control.Feedback type="invalid">{errors.salary_min}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Maximum Salary</Form.Label>
                      <Form.Control
                        type="text"
                        name="salary_max"
                        value={formData.salary_max}
                        onChange={handleInputChange}
                        isInvalid={!!errors.salary_max}
                      />
                      <Form.Control.Feedback type="invalid">{errors.salary_max}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Application Deadline (Optional)</Form.Label>
                  <Form.Control
                    type="date"
                    name="application_deadline"
                    value={formData.application_deadline}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <div className="d-grid gap-2 mt-4">
                  <Button variant="primary" type="submit" size="lg" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Posting Job...
                      </>
                    ) : 'Post Job'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PostJob;
