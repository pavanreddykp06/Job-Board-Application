import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { jobService, applicationService } from '../../services/api';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

const JobDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); 
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [application, setApplication] = useState(null); // store user's application object  

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch job details
        const jobData = await jobService.getJob(id);
        setJob(jobData);

        // Fetch user's application for this job
        if (user?.role === 'job_seeker') {
          const myApplications = await applicationService.getMyApplications();
          const myApp = myApplications.find(app => app.job === jobData.id);
          setApplication(myApp || null);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, user]);

  const today = new Date().toISOString().split('T')[0];
  const isExpired = job?.application_deadline < today;

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <p>Loading job details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <div className="alert alert-danger">{error}</div>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning">Job not found</div>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <h3 className="card-title mb-3">{job?.title}</h3>

              <div className="mb-2">
                <Badge bg="primary" className="me-2">{job?.job_type}</Badge>
                {isExpired ? <Badge bg="danger">Expired</Badge> : <Badge bg="success">Active</Badge>}
              </div>

              {/* Company info */}
              {job?.company_profile && (
                <div className="mb-3">
                  <h6 className="text-muted">{job.company_profile.company_name}</h6>
                </div>
              )}
              
              <hr />
              <p><strong>Description:</strong></p>
              <p>{job?.description}</p>
              <p><strong>Skills Required:</strong> {job?.skills_required}</p>
              <p><strong>Salary:</strong> {job?.salary_min && job?.salary_max ? `₹${job.salary_min.toLocaleString()} - ₹${job.salary_max.toLocaleString()}` : 'Not Disclosed'}</p>
              <p><strong>Location:</strong> {job?.location_city}, {job?.location_state}</p>
              {job?.application_deadline && (
                <p><strong>Deadline:</strong> {new Date(job.application_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              )}
              <p><strong>Posted On:</strong> {new Date(job?.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>

              {/* Employer application count */}
              {user?.role === 'employer' && job?.employer === user.id && (
                <p><strong>Applications Received:</strong> {job?.application_count || 0}</p>
              )}

              <div className="mt-4 d-flex justify-content-between">
                <Button variant="secondary" onClick={() => navigate(-1)}>
                  ← Back
                </Button>

                <div>
                  {/* Job Seeker Actions */}
                  {user?.role === 'job_seeker' && (
                    <>
                      {application ? (
                        <Button variant="secondary" disabled>
                          Status{application.status ? ` - ${application.status.charAt(0).toUpperCase() + application.status.slice(1)}` : ''}
                        </Button>
                      ) : isExpired ? (
                        <Button variant="secondary" disabled>
                          Application Deadline Passed
                        </Button>
                      ) : (
                        <Link to={`/job/${job?.id}/apply`} className="btn btn-primary">
                          Apply Now
                        </Link>
                      )}
                    </>
                  )}

                  {/* Employer Actions */}
                  {user?.role === 'employer' && job?.employer === user.id && (
                    <Link to={`/employer/jobs/${job?.id}/applications`} className="btn btn-primary">
                      View Applications ({job?.application_count || 0})
                    </Link>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default JobDetail;
