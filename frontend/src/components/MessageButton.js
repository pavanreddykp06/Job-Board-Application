import React, { useState } from 'react';
import { Button, Modal, Form, Alert } from 'react-bootstrap';
import { useMessages } from '../contexts/MessageContext';
import { useAuth } from '../contexts/AuthContext';

const MessageButton = ({
  recipientId,
  recipientName,
  jobId = null,
  jobTitle = null,
  buttonText = "Message",
  variant = "outline-primary",
  size = "sm",
  className = ""
}) => {
  const { user } = useAuth();
  const { startNewConversation } = useMessages();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Don't show button if user is not logged in or trying to message themselves
  if (!user || !recipientId || user.id === recipientId) {
    return null;
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await startNewConversation(
        recipientId, 
        message.trim(), 
        jobId
      );

      if (success) {
        setSuccess(true);
        setMessage('');
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowModal(false);
          setSuccess(false);
        }, 2000);
      } else {
        setError('Failed to send message');
      }
      
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setMessage('');
    setError('');
    setSuccess(false);
  };

  // Generate default message content based on context
  const getDefaultMessage = () => {
    if (jobTitle && user.role === 'job_seeker') {
      return `Hi, I'm interested in the ${jobTitle} position. I would like to know more about this opportunity.`;
    } else if (jobTitle && user.role === 'employer') {
      return `Hi, I reviewed your application for the ${jobTitle} position and would like to discuss further.`;
    }
    return '';
  };

  const handleShow = () => {
    setShowModal(true);
    if (!message) {
      setMessage(getDefaultMessage());
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleShow}
        title={`Send message to ${recipientName}`}
      >
        {buttonText}
      </Button>

      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Send Message to {recipientName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {jobTitle && (
            <div className="mb-3">
              <small className="text-muted">
                <strong>Regarding:</strong> {jobTitle}
              </small>
            </div>
          )}

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">Message sent successfully!</Alert>}

          <Form onSubmit={handleSendMessage}>
            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                disabled={loading || success}
                maxLength={1000}
              />
              <Form.Text className="text-muted">
                {message.length}/1000 characters
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={loading || !message.trim() || success}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Sending...
              </>
            ) : success ? (
              'Sent!'
            ) : (
              'Send Message'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MessageButton;