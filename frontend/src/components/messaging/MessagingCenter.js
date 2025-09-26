import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, Badge, Alert, Modal, InputGroup } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useMessages } from '../../contexts/MessageContext';

const MessagingCenter = () => {
  const { user } = useAuth();
  const { 
    conversations, 
    loading, 
    activeConversation, 
    setActiveConversation, 
    messages, 
    messagesLoading, 
    sendMessage, 
    startNewConversation,
    searchUsers,
    refreshConversations 
  } = useMessages();
  
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newConversationMessage, setNewConversationMessage] = useState('');

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const success = await sendMessage(activeConversation.user.id, newMessage);
      
      if (success) {
        setNewMessage('');
      } else {
        setError('Failed to send message. Please try again.');
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
    }
  };

  const handleSearchUsers = async (query) => {
    setUserSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(query);
      // Filter out users with same role (employers can't message employers, etc.)
      const filteredResults = results.filter(searchUser => searchUser.role !== user?.role);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const handleStartConversation = async (recipientId) => {
    if (!newConversationMessage.trim()) {
      setError('Please enter a message to start the conversation.');
      return;
    }

    try {
      const success = await startNewConversation(recipientId, newConversationMessage);
      if (success) {
        setShowNewConversation(false);
        setNewConversationMessage('');
        setUserSearchQuery('');
        setSearchResults([]);
      } else {
        setError('Failed to start conversation. Please try again.');
      }
    } catch (err) {
      setError('Failed to start conversation. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(conv => 
    (conv.with_user.full_name && conv.with_user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (conv.with_user.company_name && conv.with_user.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (conv.with_user.username && conv.with_user.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Messages</h2>
        <Button 
          variant="primary" 
          onClick={() => setShowNewConversation(true)}
        >
          New Message
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Row>
        <Col md={4} className="mb-4 mb-md-0">
          <Card className="shadow-sm">
            <Card.Header>
              <Form.Control
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-0"
              />
            </Card.Header>
            <ListGroup variant="flush" className="conversation-list" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {loading && !activeConversation ? (
                <ListGroup.Item className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </ListGroup.Item>
              ) : filteredConversations.length === 0 ? (
                <ListGroup.Item className="text-center py-3">
                  No conversations found.
                </ListGroup.Item>
              ) : (
                filteredConversations.map(conversation => (
                  <ListGroup.Item 
                    key={conversation.id} 
                    action 
                    active={activeConversation?.id === conversation.id}
                    onClick={() => setActiveConversation(conversation)}
                    className="d-flex justify-content-between align-items-start py-3"
                  >
                    <div className="ms-2 me-auto">
                      <div className="fw-bold d-flex align-items-center">
                        {user?.role === 'job_seeker' 
                          ? (conversation.with_user.company_name || conversation.with_user.full_name)
                          : conversation.with_user.full_name}
                        {conversation.unread_count > 0 && (
                          <Badge bg="primary" pill className="ms-2">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      {conversation.job && (
                        <div className="text-muted small">Re: {conversation.job.title}</div>
                      )}
                      <div className="text-truncate" style={{ maxWidth: '200px' }}>
                        {conversation.last_message}
                      </div>
                    </div>
                    <small className="text-muted">
                      {formatDate(conversation.updated_at).split(' ')[0]}
                    </small>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm message-container" style={{ height: '650px' }}>
            {!activeConversation ? (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-4">
                <i className="bi bi-chat-dots" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                <h5 className="mt-3">Select a conversation to start messaging</h5>
                <p className="text-muted">
                  {user?.role === 'employer' 
                    ? 'Communicate with job seekers about opportunities.'
                    : 'Communicate with employers about job opportunities.'}
                </p>
              </div>
            ) : (
              <>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">
                      {user?.role === 'job_seeker' 
                        ? (activeConversation.with_user.company_name || activeConversation.with_user.full_name)
                        : activeConversation.with_user.full_name}
                    </h5>
                    {activeConversation.job && (
                      <small className="text-muted">Re: {activeConversation.job.title}</small>
                    )}
                  </div>
                </Card.Header>

                <div className="message-list p-3" style={{ height: '500px', overflowY: 'auto' }}>
                  {messagesLoading ? (
                    <div className="text-center py-3">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-3 text-muted">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map(message => {
                      const isCurrentUser = message.sender_id === user?.id;
                      return (
                        <div 
                          key={message.id} 
                          className={`message mb-3 ${isCurrentUser ? 'text-end' : ''}`}
                        >
                          <div 
                            className={`message-bubble d-inline-block p-3 rounded ${
                              isCurrentUser ? 'bg-primary text-white' : 'bg-light'
                            }`}
                            style={{ maxWidth: '75%', textAlign: 'left' }}
                          >
                            {message.content}
                            <div className="message-time small mt-1">
                              <small className={isCurrentUser ? 'text-white-50' : 'text-muted'}>
                                {formatDate(message.timestamp)}
                              </small>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <Card.Footer className="p-3">
                  <Form onSubmit={handleSendMessage}>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        required
                      />
                      <Button variant="primary" type="submit">
                        Send
                      </Button>
                    </InputGroup>
                  </Form>
                </Card.Footer>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* New Conversation Modal */}
      <Modal show={showNewConversation} onHide={() => setShowNewConversation(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Start New Conversation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Search Users</Form.Label>
            <Form.Control
              type="text"
              placeholder={`Search for ${user?.role === 'employer' ? 'job seekers' : 'employers'}...`}
              value={userSearchQuery}
              onChange={(e) => handleSearchUsers(e.target.value)}
            />
          </Form.Group>

          {isSearching ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Searching...</span>
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="mb-3">
              <Form.Label>Select User:</Form.Label>
              <ListGroup style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {searchResults.map(searchUser => (
                  <ListGroup.Item 
                    key={searchUser.id} 
                    action 
                    onClick={() => {
                      setUserSearchQuery(searchUser.full_name || searchUser.username);
                      setSearchResults([searchUser]);
                    }}
                  >
                    <div className="d-flex align-items-center">
                      {searchUser.profile_picture && (
                        <img 
                          src={searchUser.profile_picture} 
                          alt="Profile" 
                          className="rounded-circle me-3"
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                        />
                      )}
                      <div>
                        <div className="fw-bold">{searchUser.full_name || searchUser.username}</div>
                        <small className="text-muted">{searchUser.role} • @{searchUser.username}</small>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          ) : userSearchQuery && !isSearching ? (
            <div className="text-muted text-center py-3">
              No users found matching "{userSearchQuery}"
            </div>
          ) : null}

          <Form.Group>
            <Form.Label>Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Type your message here..."
              value={newConversationMessage}
              onChange={(e) => setNewConversationMessage(e.target.value)}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewConversation(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              if (searchResults.length === 1) {
                handleStartConversation(searchResults[0].id);
              }
            }}
            disabled={searchResults.length !== 1 || !newConversationMessage.trim()}
          >
            Start Conversation
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MessagingCenter; 