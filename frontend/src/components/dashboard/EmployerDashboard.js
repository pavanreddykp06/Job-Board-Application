import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const EmployerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getEmployerDashboard();

      const allActivities = response.data.recent_activities || [];

      setStats({
        ...response.data,
        recent_activities: allActivities.slice(0, 3) // top 3 for display
      });

    } catch (err) {
      setError('Failed to load dashboard data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading Dashboard...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2>Welcome, {user?.full_name || 'Employer'}!</h2>
          <p className="text-muted mb-0">Manage your recruitment process efficiently</p>
        </Col>
        <Col xs="auto">
          <Button as={Link} to="/employer/post-job" variant="primary">Post a New Job</Button>
        </Col>
      </Row>

      {stats && (
        <>
          <Row className="mb-4">
            <Col md={6} className="mb-3">
              <Card className="text-center shadow-sm">
                <Card.Body>
                  <h3 className="text-primary">{stats.job_count}</h3>
                  <p className="card-text text-muted">Active Jobs</p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-3">
              <Card className="text-center shadow-sm">
                <Card.Body>
                  <h3 className="text-primary">{stats.application_count}</h3>
                  <p className="card-text text-muted">Applications Received</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={4} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header as="h5">Manage Jobs</Card.Header>
                <Card.Body>
                  <p className="card-text">Post new jobs, view active listings, and manage your job postings.</p>
                  <ul className="list-unstyled">
                    <li>• Post new job openings</li>
                    <li>• Edit existing jobs</li>
                    <li>• View job performance</li>
                  </ul>
                </Card.Body>
                <Card.Footer>
                  <Link to="/employer/manage-jobs" className="btn btn-primary w-100">Manage Jobs</Link>
                </Card.Footer>
              </Card>
            </Col>

            <Col md={4} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header as="h5">Review Applicants</Card.Header>
                <Card.Body>
                  <p className="card-text">Review applications, manage candidates, and communicate with potential hires.</p>
                  <ul className="list-unstyled">
                    <li>• View applicant profiles</li>
                    <li>• Track application status</li>
                    <li>• Message candidates</li>
                  </ul>
                </Card.Body>
                <Card.Footer>
                  <Link to="/employer/manage-jobs" className="btn btn-primary w-100">Review Applications</Link>
                </Card.Footer>
              </Card>
            </Col>

            <Col md={4} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header as="h5">Company Profile</Card.Header>
                <Card.Body>
                  <p className="card-text">Keep your company profile up-to-date to attract the best talent.</p>
                  <ul className="list-unstyled">
                    <li>• Update company details</li>
                    <li>• Add company logo</li>
                    <li>• Manage contact info</li>
                  </ul>
                </Card.Body>
                <Card.Footer>
                  <Link to="/employer/profile" className="btn btn-primary w-100">Edit Profile</Link>
                </Card.Footer>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col>
              <Card className="shadow-sm">
                <Card.Header as="h5">Recent Activity</Card.Header>
                <Card.Body>
                  {stats.recent_activities && stats.recent_activities.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {stats.recent_activities.map((activity) => (
                        <li key={activity.id} className="list-group-item d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-bold text-capitalize">
                              {activity.activity_type.replace(/_/g, ' ')}
                            </div>
                            <div className="text-muted">{activity.description}</div>
                          </div>
                          <small className="text-muted">
                            {dayjs(activity.timestamp).fromNow()}
                          </small>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted mb-3">No recent activity to display.</p>
                      <p className="text-muted">Start by posting a job to see your activity here!</p>
                      <Button as={Link} to="/employer/post-job" variant="primary" size="sm">
                        Post Your First Job
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default EmployerDashboard;
