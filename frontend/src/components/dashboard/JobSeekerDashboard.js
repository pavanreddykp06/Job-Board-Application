import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/api';

const JobSeekerDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await dashboardService.getJobSeekerDashboard();
        setDashboardData(data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <Container className="mt-5">
      {/* Header */}
      <Row className="mb-4">
        <Col xs={12}>
          <h2>Welcome, {user?.username || 'Job Seeker'}!</h2>
          <p className="text-muted">Track your job applications and career progress</p>
        </Col>
      </Row>

      {/* Stats Row */}
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : dashboardData && (
        <Row className="mb-4">
          <Col md={4} className="mb-3">
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h3 className="text-primary">{dashboardData.applied_count || 0}</h3>
                <p className="card-text text-muted">Applied</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-3">
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h3 className="text-primary">{dashboardData.shortlisted_count || 0}</h3>
                <p className="card-text text-muted">Shortlisted</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-3">
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h3 className="text-primary">{dashboardData.rejected_count || 0}</h3>
                <p className="card-text text-muted">Rejected</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Actions */}
      <Row>
        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Find Jobs</h5>
            </Card.Header>
            <Card.Body>
              <p className="card-text">Search and discover job opportunities that match your skills and career goals.</p>
              <ul className="list-unstyled">
                <li>• Browse job listings</li>
                <li>• Filter by location</li>
                <li>• Filter by salary</li>
                <li>• Save favorite jobs</li>
              </ul>
            </Card.Body>
            <Card.Footer>
              <Link to="/browse-jobs" className="btn btn-primary w-100">Browse Jobs</Link>
            </Card.Footer>
          </Card>
        </Col>

        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">My Applications</h5>
            </Card.Header>
            <Card.Body>
              {dashboardData && dashboardData.applied_count > 0 ? (
                <>
                  <p className="card-text">Track the status of your job applications and manage your application history.</p>
                  <ul className="list-unstyled">
                    <li>• View application status</li>
                    <li>• Track shortlisted jobs</li>
                    <li>• See rejected applications</li>
                  </ul>
                </>
              ) : (
                <p className="card-text text-muted">You have not applied to any jobs yet. Start by browsing for jobs.</p>
              )}
            </Card.Body>
            <Card.Footer>
              <Link to="/job-seeker/applications" className="btn btn-primary w-100">View Applications</Link>
            </Card.Footer>
          </Card>
        </Col>

        <Col md={4} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">My Profile</h5>
            </Card.Header>
            <Card.Body>
              <p className="card-text">Keep your profile updated to attract employers and showcase your skills.</p>
              <ul className="list-unstyled">
                <li>• Update resume</li>
                <li>• Add skills</li>
                <li>• Edit personal information</li>
                <li>• Manage visibility</li>
              </ul>
            </Card.Body>
            <Card.Footer>
              <Link to="/job-seeker/profile" className="btn btn-primary w-100">Edit Profile</Link>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default JobSeekerDashboard;
