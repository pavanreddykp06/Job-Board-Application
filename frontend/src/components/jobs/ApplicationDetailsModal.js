import React from 'react';
import { Modal, Button, Row, Col, Card } from 'react-bootstrap';

const ApplicationDetailsModal = ({ application, show, onHide }) => {
  if (!application) {
    return null;
  }

  // Helper function to get applicant name (same as in parent component)
  const getApplicantName = (application) => {
    return application.applicant_name || 
           application.user_full_name || 
           application.user_name || 
           application.user?.full_name ||
           application.user?.username ||
           `User ${application.user_id || application.user}`;
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Application Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Card>
          <Card.Body>
            <Row>
              <Col md={6}>
                <h5>Applicant Information</h5>
                <p><strong>Name:</strong> {getApplicantName(application)}</p>
                <p><strong>Applied On:</strong> {new Date(application.created_at).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span className={`badge bg-${
                  application.status === 'shortlisted' ? 'success' : 
                  application.status === 'rejected' ? 'danger' : 
                  'secondary'
                }`}>{application.status}</span></p>
              </Col>
              <Col md={6}>
                <h5>Job Information</h5>
                <p><strong>Position:</strong> {application.job_title}</p>
                <p><strong>Company:</strong> {application.company_name}</p>
                <p><strong>Application ID:</strong> {application.id}</p>
              </Col>
            </Row>
            <hr />
            <h5>Cover Letter</h5>
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              maxHeight: '300px', 
              overflowY: 'auto',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px',
              border: '1px solid #dee2e6'
            }}>
              {application.cover_letter || 'No cover letter provided'}
            </div>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ApplicationDetailsModal;