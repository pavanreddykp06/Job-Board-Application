import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobService, applicationService } from '../../services/api';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';

const ApplyJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [formData, setFormData] = useState({
    resume: null,
    cover_letter: '',
    education_level: '',
    university: '',
    major: '',
    gpa: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await jobService.getJob(id);
        setJob(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch job details');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, resume: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const applicationData = new FormData();
    applicationData.append('job', id);
    if (formData.resume) applicationData.append('resume', formData.resume);
    applicationData.append('cover_letter', formData.cover_letter);
    applicationData.append('education_level', formData.education_level);
    applicationData.append('university', formData.university);
    applicationData.append('major', formData.major);
    applicationData.append('gpa', formData.gpa);

    try {
      await applicationService.applyToJob(applicationData);
      setSuccess('Application submitted successfully! Redirecting to dashboard...');
      setTimeout(() => navigate('/job-seeker/dashboard'), 2000); // Correct route
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" /> <p>Loading...</p>
      </Container>
    );
  }

  if (error && !job) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Header>Apply for {job?.title}</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Cover Letter</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="cover_letter"
                    value={formData.cover_letter}
                    onChange={handleInputChange}
                    placeholder="Write a brief cover letter..."
                  />
                </Form.Group>

                <h5 className="mt-4 mb-3">Academic Information (Optional)</h5>

                <Form.Group className="mb-3">
                  <Form.Label>Highest Education Level</Form.Label>
                  <Form.Control
                    type="text"
                    name="education_level"
                    value={formData.education_level}
                    onChange={handleInputChange}
                    placeholder="e.g., Bachelor's Degree"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>University/Institution</Form.Label>
                  <Form.Control
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleInputChange}
                    placeholder="e.g., University of Example"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Major/Field of Study</Form.Label>
                  <Form.Control
                    type="text"
                    name="major"
                    value={formData.major}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>GPA</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="gpa"
                    value={formData.gpa}
                    onChange={handleInputChange}
                    placeholder="e.g., 3.8"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Resume (PDF only)</Form.Label>
                  <Form.Control
                    type="file"
                    name="resume"
                    accept=".pdf"
                    onChange={handleFileChange}
                    required
                  />
                </Form.Group>

                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ApplyJob;
