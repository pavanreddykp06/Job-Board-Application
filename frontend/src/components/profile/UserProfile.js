import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Nav } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/api';

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: '',
  });

  // Job seeker specific form state
  const [jobSeekerForm, setJobSeekerForm] = useState({
    skills: '',
    experience: '',
    portfolio_url: '',
    resume: null,
  });

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const profileData = await userService.getProfile();
        setProfileForm({
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          city: profileData.city || '',
          state: profileData.state || '',
          country: profileData.country || '',
        });

        if (user?.role === 'job_seeker') {
          const jobSeekerData = await userService.getJobSeekerProfile();
          setJobSeekerForm({
            skills: jobSeekerData.skills || '',
            experience: jobSeekerData.experience || '',
            portfolio_url: jobSeekerData.portfolio_url || '',
            resume: null, // file input not prefilled
          });
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch profile data. Please try again later.');
        setLoading(false);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm({ ...profileForm, [name]: value });
  };

  const handleJobSeekerChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'resume' && files && files[0]) {
      setJobSeekerForm({ ...jobSeekerForm, resume: files[0] });
    } else {
      setJobSeekerForm({ ...jobSeekerForm, [name]: value });
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      const payload = {
        full_name: profileForm.full_name,
        email: profileForm.email,
        phone: profileForm.phone,
        city: profileForm.city,
        state: profileForm.state,
        country: profileForm.country,
      };

      const updatedUser = await userService.updateProfile(payload); // PATCH request
      // Refresh profile after update
      const refreshedProfile = await userService.getProfile();
      setProfileForm({
        full_name: refreshedProfile.full_name,
        email: refreshedProfile.email,
        phone: refreshedProfile.phone,
        city: refreshedProfile.city,
        state: refreshedProfile.state,
        country: refreshedProfile.country,
      });
      if (updateUser) {
        updateUser(refreshedProfile);
      }
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update user information.');
    }
  };

  const handleJobSeekerSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      await userService.updateJobSeekerProfile(jobSeekerForm);
      setSuccess('Professional information updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update information. Please try again.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match.');
      return;
    }
    try {
      // await authService.changePassword(passwordForm);
      setSuccess('Password updated successfully!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError('Failed to update password. Please try again.');
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">My Profile</h2>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      {success && <Alert variant="success" className="mb-4">{success}</Alert>}

      <Tab.Container id="profile-tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Row>
          <Col md={3} className="mb-4">
            <Card className="shadow-sm">
              <Card.Body>
                <div className="text-center mb-4">
                  <div className="avatar-placeholder rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}>
                    {profileForm.full_name.charAt(0)}
                  </div>
                  <h5>{profileForm.full_name}</h5>
                  <p className="text-muted">{user?.role === 'job_seeker' ? 'Job Seeker' : 'Employer'}</p>
                </div>

                <Nav variant="pills" className="flex-column">
                  <Nav.Item>
                    <Nav.Link eventKey="profile" className="mb-2">
                      <i className="bi bi-person me-2"></i> Basic Information
                    </Nav.Link>
                  </Nav.Item>
                  {user?.role === 'job_seeker' && (
                    <Nav.Item>
                      <Nav.Link eventKey="job_seeker" className="mb-2">
                        <i className="bi bi-briefcase me-2"></i> Professional Info
                      </Nav.Link>
                    </Nav.Item>
                  )}
                  <Nav.Item>
                    <Nav.Link eventKey="password" className="mb-2">
                      <i className="bi bi-shield-lock me-2"></i> Change Password
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          <Col md={9}>
            <Card className="shadow-sm">
              <Card.Body>
                <Tab.Content>
                  <Tab.Pane eventKey="profile">
                    <h4 className="mb-4">Basic Information</h4>
                    <Form onSubmit={handleProfileSubmit}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control
                              type="text"
                              name="full_name"
                              value={profileForm.full_name}
                              onChange={handleProfileChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                              type="email"
                              name="email"
                              value={profileForm.email}
                              onChange={handleProfileChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Phone Number</Form.Label>
                            <Form.Control
                              type="tel"
                              name="phone"
                              value={profileForm.phone}
                              onChange={handleProfileChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>City</Form.Label>
                            <Form.Control
                              type="text"
                              name="city"
                              value={profileForm.city}
                              onChange={handleProfileChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>State</Form.Label>
                            <Form.Control
                              type="text"
                              name="state"
                              value={profileForm.state}
                              onChange={handleProfileChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Country</Form.Label>
                            <Form.Control
                              type="text"
                              name="country"
                              value={profileForm.country}
                              onChange={handleProfileChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                        <Button variant="primary" type="submit">
                          Save Changes
                        </Button>
                      </div>
                    </Form>
                  </Tab.Pane>

                  {/* Job Seeker Tab */}
                  {user?.role === 'job_seeker' && (
                    <Tab.Pane eventKey="job_seeker">
                      <h4 className="mb-4">Professional Information</h4>
                      <Form onSubmit={handleJobSeekerSubmit}>
                        <Form.Group className="mb-3">
                          <Form.Label>Skills</Form.Label>
                          <Form.Control
                            type="text"
                            name="skills"
                            value={jobSeekerForm.skills}
                            onChange={handleJobSeekerChange}
                            placeholder="e.g. JavaScript, React, Node.js"
                          />
                          <Form.Text className="text-muted">Separate skills with commas</Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Work Experience</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="experience"
                            value={jobSeekerForm.experience}
                            onChange={handleJobSeekerChange}
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Resume</Form.Label>
                          <Form.Control type="file" name="resume" onChange={handleJobSeekerChange} />
                          <Form.Text className="text-muted">Upload your resume (PDF recommended)</Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Portfolio URL</Form.Label>
                          <Form.Control
                            type="url"
                            name="portfolio_url"
                            value={jobSeekerForm.portfolio_url}
                            onChange={handleJobSeekerChange}
                          />
                        </Form.Group>

                        <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                          <Button variant="primary" type="submit">Save Changes</Button>
                        </div>
                      </Form>
                    </Tab.Pane>
                  )}

                  {/* Password Tab */}
                  <Tab.Pane eventKey="password">
                    <h4 className="mb-4">Change Password</h4>
                    <Form onSubmit={handlePasswordSubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label>Current Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="current_password"
                          value={passwordForm.current_password}
                          onChange={handlePasswordChange}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>New Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="new_password"
                          value={passwordForm.new_password}
                          onChange={handlePasswordChange}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Confirm New Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="confirm_password"
                          value={passwordForm.confirm_password}
                          onChange={handlePasswordChange}
                          required
                        />
                      </Form.Group>

                      <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                        <Button variant="primary" type="submit">Update Password</Button>
                      </div>
                    </Form>
                  </Tab.Pane>
                </Tab.Content>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default UserProfile;
