import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { profileService } from '../../services/api';

const CompanyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await profileService.getCompanyProfile();
        setProfile(data);
        setFormData(data);
        if (data.logo) {
          setLogoPreview(data.logo);
        }
      } catch (err) {
        setError('Failed to fetch company profile. Please try again later.');
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, logo: file });
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Create a new FormData object for submission
    const submissionData = new FormData();

    // Append all form fields to the FormData object
    Object.keys(formData).forEach(key => {
      // Special handling for the logo file
      if (key === 'logo') {
        // Only append if it's a File object (a new logo was selected)
        if (formData.logo instanceof File) {
          submissionData.append('logo', formData.logo);
        }
      } else if (formData[key] !== null && formData[key] !== undefined) {
        submissionData.append(key, formData[key]);
      }
    });

    try {
      const response = await profileService.updateCompanyProfile(submissionData);
      setProfile(response.data);
      setFormData(response.data);
      if (response.data.logo) {
        setLogoPreview(response.data.logo);
      }
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile. Please check your input and try again.');
    }
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  if (error && !profile) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <Container className="py-5">
      <Card>
        <Card.Header as="h4">Company Profile</Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4} className="text-center">
                {logoPreview && <img src={logoPreview} alt="Company Logo" className="img-thumbnail mb-3" style={{ maxWidth: '150px' }} />}
                <Form.Group controlId="formFile" className="mb-3">
                  <Form.Label>Company Logo</Form.Label>
                  <Form.Control type="file" name="logo" onChange={handleFileChange} />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Company Name</Form.Label>
                  <Form.Control type="text" name="company_name" value={formData.company_name || ''} onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Website</Form.Label>
                  <Form.Control type="url" name="website" value={formData.website || ''} onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Email</Form.Label>
                  <Form.Control type="email" name="contact_email" value={formData.contact_email || ''} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={4} name="description" value={formData.description || ''} onChange={handleChange} />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control type="text" name="location_city" value={formData.location_city || ''} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control type="text" name="location_state" value={formData.location_state || ''} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Industry</Form.Label>
                  <Form.Control type="text" name="industry" value={formData.industry || ''} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Company Size</Form.Label>
                  <Form.Control type="text" name="company_size" value={formData.company_size || ''} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                    <Form.Label>LinkedIn Profile</Form.Label>
                    <Form.Control type="url" name="linkedin" value={formData.linkedin || ''} onChange={handleChange} />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                    <Form.Label>Twitter Profile</Form.Label>
                    <Form.Control type="url" name="twitter" value={formData.twitter || ''} onChange={handleChange} />
                    </Form.Group>
                </Col>
            </Row>
            <Button variant="primary" type="submit">Save Changes</Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CompanyProfile;

