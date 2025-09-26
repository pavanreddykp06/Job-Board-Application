import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { jobService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ManageJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  // Form state (frontend-friendly fields)
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
    status: 'active'
  });

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await jobService.getEmployerJobs();
        setJobs(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch jobs');
      }
      setLoading(false);
    };
    fetchJobs();
  }, []);

  // Edit job: populate form
  const handleEditJob = (job) => {
    setCurrentJob(job);
    setFormData({
      title: job.title || '',
      description: job.description || '',
      job_type: job.job_type || 'Full-Time',
      skills_required: job.skills_required || '',
      salary_min: job.salary_min || '',
      salary_max: job.salary_max || '',
      location_city: job.location_city || '',
      location_state: job.location_state || '',
      application_deadline: job.application_deadline || '',
      status: job.status || 'active'
    });
    setShowEditModal(true);
  };

  // Delete job
  const handleDeleteJob = (job) => {
    setJobToDelete(job);
    setShowDeleteModal(true);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;
    try {
      await jobService.deleteJob(jobToDelete.id);
      setJobs(jobs.filter(job => job.id !== jobToDelete.id));
      setShowDeleteModal(false);
      setJobToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to delete job');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit update: map formData to backend fields
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentJob) return;

    const updateData = {
      title: formData.title,
      description: formData.description,
      job_type: formData.job_type,
      skills_required: formData.skills_required,
      salary_min: formData.salary_min,
      salary_max: formData.salary_max,
      location_city: formData.location_city,
      location_state: formData.location_state,
      application_deadline: formData.application_deadline,
      status: formData.status
    };

    try {
      const updatedJob = await jobService.updateJob(currentJob.id, updateData);
      setJobs(jobs.map(job => (job.id === currentJob.id ? updatedJob : job)));
      setShowEditModal(false);
      setCurrentJob(null);
    } catch (err) {
      setError(err.message || 'Failed to update job');
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

  if (error) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Jobs</h2>
        <Link to="/employer/post-job" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i> Post New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-5">
          <h4>No Jobs Found</h4>
          <p>You have not posted any jobs yet. Get started by posting a job.</p>
          <Link to="/employer/post-job" className="btn btn-primary mt-3">
            Post a New Job
          </Link>
        </div>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Location</th>
                <th>Applications</th>
                <th>Status</th>
                <th>Posted Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id}>
                  <td>
                    <Link to={`/job/${job.id}`} className="text-decoration-none">
                      {job.title}
                    </Link>
                  </td>
                  <td>{job.job_type}</td>
                  <td>{`${job.location_city}, ${job.location_state}`}</td>
                  <td>
                    <Link to={`/employer/jobs/${job.id}/applications`} className="btn btn-sm btn-info me-2">
                      View ({job.application_count || 0})
                    </Link>
                  </td>
                  <td>
                    <Badge bg={job.status === 'active' ? 'success' : 'secondary'}>
                      {job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'No Status'}
                    </Badge>
                  </td>
                  <td>{new Date(job.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button variant="outline-primary" size="sm" onClick={() => handleEditJob(job)}>
                        <i className="bi bi-pencil me-1"></i> Update
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteJob(job)}>
                        <i className="bi bi-trash me-1"></i> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Edit Job Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Job</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Job Title</Form.Label>
                  <Form.Control type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Job Type</Form.Label>
                  <Form.Select name="job_type" value={formData.job_type} onChange={handleInputChange}>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Remote">Remote</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleInputChange} required />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control type="text" name="location_city" value={formData.location_city} onChange={handleInputChange} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control type="text" name="location_state" value={formData.location_state} onChange={handleInputChange} required />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Required Skills</Form.Label>
              <Form.Control type="text" name="skills_required" value={formData.skills_required} onChange={handleInputChange} required />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Salary</Form.Label>
                  <Form.Control type="number" name="salary_min" value={formData.salary_min} onChange={handleInputChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Salary</Form.Label>
                  <Form.Control type="number" name="salary_max" value={formData.salary_max} onChange={handleInputChange} />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Application Deadline</Form.Label>
              <Form.Control type="date" name="application_deadline" value={formData.application_deadline} onChange={handleInputChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select name="status" value={formData.status} onChange={handleInputChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Save Changes</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the job: <strong>{jobToDelete?.title}</strong>?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDeleteJob}>Delete Job</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageJobs;
