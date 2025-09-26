import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobService } from '../services/api';

const Home = () => {
  const { user } = useAuth();
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState('');

 useEffect(() => {
  const fetchFeaturedJobs = async () => {
    try {
      setLoadingJobs(true);
      const jobs = await jobService.searchJobs({ limit: 3 });
      
      // 👀 Add this line to see exactly what your API is returning
      console.log("Featured Jobs Response:", jobs);
      
      setFeaturedJobs(jobs.slice(0, 3));
    } catch (error) {
      console.error('Error fetching featured jobs:', error);
      setJobsError('Failed to load featured jobs');
    } finally {
      setLoadingJobs(false);
    }
  };

  fetchFeaturedJobs();
}, []);


  const formatSalary = (minSalary, maxSalary) => {
    if (minSalary && maxSalary) {
      return `₹${minSalary.toLocaleString()} - ₹${maxSalary.toLocaleString()} per annum`;
    } else if (minSalary) {
      return `₹${minSalary.toLocaleString()}+ per annum`;
    } else if (maxSalary) {
      return `Up to ₹${maxSalary.toLocaleString()} per annum`;
    } else {
      return 'Salary not disclosed';
    }
  };

  // ✅ Fix: use company_name directly from API
  const getCompanyName = (job) => {
    return job.company_name || 'Company Name Not Available';
  };

  const getLocation = (job) => {
    if (job.location_city && job.location_state) {
      return `${job.location_city}, ${job.location_state}`;
    } else if (job.location_city) {
      return job.location_city;
    } else if (job.location_state) {
      return job.location_state;
    } else {
      return 'Location not specified';
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={6} className="mb-4 mb-md-0">
              <h1 className="display-4 fw-bold">Find Your Dream Job</h1>
              <p className="lead mb-4">
                Connect with top employers and discover opportunities that match your skills and career goals.
              </p>
              {user ? (
                <Link 
                  to={user.role === 'job_seeker' ? '/browse-jobs' : '/employer/dashboard'} 
                  className="btn btn-light btn-lg"
                >
                  {user.role === 'job_seeker' ? 'Browse Jobs' : 'Go to Dashboard'}
                </Link>
              ) : (
                <div>
                  <Link to="/register" className="btn btn-light btn-lg me-3">
                    Sign Up
                  </Link>
                  <Link to="/login" className="btn btn-outline-light btn-lg">
                    Login
                  </Link>
                </div>
              )}
            </Col>
            <Col md={6}>
              {/* Hero image or illustration can go here */}
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5">
        <h2 className="text-center mb-5">Why Jobify?</h2>
        <Row>
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-search text-primary" style={{ fontSize: '2.5rem' }}></i>
                </div>
                <Card.Title>Find Relevant Jobs</Card.Title>
                <Card.Text>
                  Our advanced search algorithm helps you discover jobs that match your skills, experience, and preferences.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-building text-primary" style={{ fontSize: '2.5rem' }}></i>
                </div>
                <Card.Title>Connect with Top Employers</Card.Title>
                <Card.Text>
                  Get access to opportunities from leading companies across various industries and locations.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-graph-up text-primary" style={{ fontSize: '2.5rem' }}></i>
                </div>
                <Card.Title>Grow Your Career</Card.Title>
                <Card.Text>
                  Access resources, tips, and tools to help you advance in your professional journey.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Featured Jobs Section */}
      <div className="bg-light py-5">
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Featured Jobs</h2>
            <Link to="/browse-jobs" className="btn btn-outline-primary">
              View All Jobs
            </Link>
          </div>
          
          {loadingJobs ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading featured jobs...</p>
            </div>
          ) : jobsError ? (
            <Alert variant="warning" className="text-center">
              {jobsError}
            </Alert>
          ) : featuredJobs.length === 0 ? (
            <Alert variant="info" className="text-center">
              No featured jobs available at the moment.
            </Alert>
          ) : (
            <Row>
              {featuredJobs.map(job => (
                <Col md={4} className="mb-4" key={job.id}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <h5 className="card-title">{job.title}</h5>
                      <h6 className="text-muted mb-3">{getCompanyName(job)}</h6>
                      <p className="mb-2">
                        <i className="bi bi-geo-alt me-2"></i>
                        {getLocation(job)}
                      </p>
                      <p className="mb-2">
                        <i className="bi bi-briefcase me-2"></i>
                        {job.job_type}
                      </p>
                      <p className="mb-3">
                        <i className="bi bi-currency-rupee me-2"></i>
                        {formatSalary(job.salary_min, job.salary_max)}
                      </p>
                      {job.skills_required && (
                        <div className="mb-3">
                          <small className="text-muted">Skills: {job.skills_required}</small>
                        </div>
                      )}
                    </Card.Body>
                    <Card.Footer className="bg-white">
                      <Link to={`/job/${job.id}`} className="btn btn-outline-primary w-100">
                        View Details
                      </Link>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </div>

      {/* Call to Action */}
      <Container className="py-5 text-center">
        <h2 className="mb-4">Ready to Take the Next Step in Your Career?</h2>
        <p className="lead mb-4">
          Join thousands of job seekers who have found their dream jobs through our platform.
        </p>
        {!user && (
          <Button as={Link} to="/register" size="lg" variant="primary">
            Create Your Account
          </Button>
        )}
      </Container>
    </div>
  );
};

export default Home;
