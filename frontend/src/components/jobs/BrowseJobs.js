import React, { useState, useEffect, useCallback } from 'react';
import { jobService } from '../../services/api';
import { Container, Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Add this import
import MessageButton from '../../components/MessageButton'; // Add this import

const BrowseJobs = () => {
  const { user } = useAuth(); // Add this line
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    job_type: '',
    salary: ''
  });

  // Fetch jobs using your existing API service
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // Check if any filters are applied
      const hasFilters = filters.keyword || filters.location || filters.job_type || filters.salary;
      
      if (hasFilters) {
        // Use jobService for filtered searches
        const searchFilters = {
          keyword: filters.keyword,
          location: filters.location,
          jobType: filters.job_type,
          salary: filters.salary
        };
        
        const data = await jobService.searchJobs(searchFilters);
        setJobs(Array.isArray(data) ? data : data.results || []);
      } else {
        // Get all jobs when no filters are applied
        const data = await jobService.getAllJobs();
        setJobs(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchJobs();
  }, []); // Remove filters dependency to prevent infinite re-renders

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const clearFilters = () => {
    setFilters({
      keyword: '',
      location: '',
      job_type: '',
      salary: ''
    });
    // Trigger new search with cleared filters
    setTimeout(() => fetchJobs(), 0);
  };

  return (
    <Container className="mt-5">
      <h2 className="mb-4">Browse Jobs</h2>

      {/* Filters */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="g-3">
              <Col md={6} lg={3}>
                <Form.Control
                  type="text"
                  name="keyword"
                  value={filters.keyword}
                  onChange={handleFilterChange}
                  placeholder="Keyword (title, description, skills)"
                />
              </Col>
              <Col md={6} lg={3}>
                <Form.Control
                  type="text"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  placeholder="Location (city or state)"
                />
              </Col>
              <Col md={6} lg={3}>
                <Form.Select
                  name="job_type"
                  value={filters.job_type}
                  onChange={handleFilterChange}
                >
                  <option value="">All Job Types</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </Form.Select>
              </Col>
              <Col md={6} lg={3}>
                <Form.Select
                  name="salary"
                  value={filters.salary}
                  onChange={handleFilterChange}
                >
                  <option value="">Any Salary</option>
                  <option value="0-500000">Up to ₹5 LPA</option>
                  <option value="500000-1000000">₹5 - ₹10 LPA</option>
                  <option value="1000000-2000000">₹10 - ₹20 LPA</option>
                  <option value="2000000+">Above ₹20 LPA</option>
                </Form.Select>
              </Col>
            </Row>
            <div className="mt-3 d-flex justify-content-between">
              <Button variant="secondary" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button type="submit" variant="primary">
                Search Jobs
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Job Listings */}
      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading jobs...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
          <Button 
            variant="link" 
            className="p-0 ms-2" 
            onClick={fetchJobs}
          >
            Retry
          </Button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center my-5">
          <h4>No Jobs Found</h4>
          <p>Try adjusting your filters or clearing them to see all jobs.</p>
          <Button variant="outline-primary" onClick={clearFilters}>
            Show All Jobs
          </Button>
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-muted">{jobs.length} job(s) found</p>
          <Row>
            {jobs.map(job => {
              const today = new Date().toISOString().split('T')[0];
              const isExpired = job.application_deadline < today;

              return (
                <Col md={6} lg={4} className="mb-4" key={job.id}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5>
                          <Link to={`/job/${job.id}`} className="text-decoration-none">
                            {job.title}
                          </Link>
                        </h5>
                        <Badge bg={isExpired ? 'danger' : 'success'}>
                          {isExpired ? 'Expired' : 'Active'}
                        </Badge>
                      </div>
                      <h6 className="text-muted mb-3">
                        {job.employer_profile?.company_name || job.company_name || 'N/A'}
                      </h6>
                      <p><strong>Location:</strong> {job.location_city}, {job.location_state}</p>
                      <p><strong>Job Type:</strong> {job.job_type}</p>
                      <p><strong>Salary:</strong> {
                        job.salary_min && job.salary_max 
                          ? `₹${job.salary_min.toLocaleString()} - ₹${job.salary_max.toLocaleString()}` 
                          : 'Not Disclosed'
                      }</p>
                      <p><strong>Posted:</strong> {new Date(job.created_at).toLocaleDateString()}</p>
                    </Card.Body>
                    <Card.Footer className="bg-white">
                      <div className="d-flex gap-2">
                        <Link 
                          to={`/job/${job.id}`} 
                          className="btn btn-outline-primary flex-grow-1"
                        >
                          View Details
                        </Link>
                        
                        {/* Add MessageButton for job seekers */}
                        {user && user.role === 'job_seeker' && job.employer && !isExpired && (
                          <MessageButton
                            recipientId={job.employer}
                            recipientName={job.employer_profile?.company_name || job.company_name || 'Employer'}
                            jobId={job.id}
                            jobTitle={job.title}
                            buttonText="Message"
                            variant="outline-success"
                            size="sm"
                          />
                        )}
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      )}
    </Container>
  );
};

export default BrowseJobs;