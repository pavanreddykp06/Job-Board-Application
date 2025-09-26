import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, ListGroup, Spinner, Alert, Form, Button, InputGroup } from 'react-bootstrap';
import { messagingService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const MessagingPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await messagingService.getConversations();
        setConversations(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load conversations.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Cleanup polling when component unmounts
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Poll for new messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      // Clear existing interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      // Poll every 2 seconds for new messages
      pollIntervalRef.current = setInterval(async () => {
        try {
          const response = await messagingService.getMessages(selectedConversation.user.id);
          setMessages(response.data);
        } catch (err) {
          console.error('Failed to poll messages:', err);
        }
      }, 2000);
    } else {
      // Clear interval if no conversation selected
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedConversation]);

  const handleConversationSelect = async (convo) => {
    setSelectedConversation(convo);
    setSearchQuery('');
    setIsSearching(false);

    try {
      setMessagesLoading(true);
      const response = await messagingService.getMessages(convo.user.id);
      setMessages(response.data);
      setMessagesError(null);
    } catch (err) {
      setMessagesError('Failed to load messages.');
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    console.log('Attempting to send message:', newMessage);
    
    if (!newMessage.trim()) {
      console.log('Message is empty');
      return;
    }
    
    if (!selectedConversation) {
      console.log('No conversation selected');
      return;
    }

    setSending(true);
    
    try {
      // Send message via HTTP API instead of WebSocket
      const response = await messagingService.sendMessage(
        selectedConversation.user.id, 
        newMessage.trim()
      );
      
      console.log('Message sent successfully via API');
      
      // Add the sent message to the messages list immediately
      const newMessageObj = {
        id: response.data.id,
        sender: user.id,
        recipient: selectedConversation.user.id,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        sender_name: user.full_name || user.username,
        is_read: false
      };
      
      setMessages(prevMessages => [...prevMessages, newMessageObj]);
      setNewMessage('');

      // Update conversations list if this is a new conversation
      const isNewConversation = !conversations.some(c => c.user.id === selectedConversation.user.id);
      if (isNewConversation) {
        setConversations(prev => [selectedConversation, ...prev]);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessagesError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await messagingService.searchUsers(query);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col md={4}>
          <Card>
            <Card.Header>
              <InputGroup>
                <Form.Control
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </InputGroup>
            </Card.Header>
            <ListGroup variant="flush" style={{ height: '550px', overflowY: 'auto' }}>
              {isSearching ? (
                searchResults.length > 0 ? (
                  searchResults.map(userResult => (
                    <ListGroup.Item key={userResult.id} action onClick={() => handleConversationSelect({ user: userResult })}>
                      {userResult.full_name || userResult.username}
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item>No users found.</ListGroup.Item>
                )
              ) : (
                <>
                  {loading && <Spinner animation="border" className="m-3" />}
                  {error && <Alert variant="danger">{error}</Alert>}
                  {!loading && !error && conversations.length === 0 && (
                    <ListGroup.Item>No conversations yet.</ListGroup.Item>
                  )}
                  {!loading && !error && conversations.map(convo => (
                    <ListGroup.Item
                      key={convo.user.id}
                      action
                      active={selectedConversation?.user.id === convo.user.id}
                      onClick={() => handleConversationSelect(convo)}
                    >
                      {convo.user.full_name || convo.user.username}
                    </ListGroup.Item>
                  ))}
                </>
              )}
            </ListGroup>
          </Card>
        </Col>
        <Col md={8}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>
                {selectedConversation ? `Chat with ${selectedConversation.user.full_name || selectedConversation.user.username}` : 'Select a conversation'}
              </span>
              {selectedConversation && (
                <small className="text-muted">
                  Messages update every 2 seconds
                </small>
              )}
            </Card.Header>
            <Card.Body style={{ height: '500px', overflowY: 'auto' }}>
              {messagesLoading ? (
                <div className="d-flex justify-content-center">
                  <Spinner animation="border" />
                </div>
              ) : messagesError ? (
                <Alert variant="danger">{messagesError}</Alert>
              ) : selectedConversation ? (
                messages.length > 0 ? (
                  messages.map(msg => (
                    <div key={msg.id} className={`mb-2 d-flex ${msg.sender === user.id ? 'justify-content-end' : ''}`}>
                      <div className={`p-2 rounded ${msg.sender === user.id ? 'bg-primary text-white' : 'bg-light'}`} style={{ maxWidth: '70%' }}>
                        <div className="small mb-1">
                          <strong>{msg.sender_name}</strong>
                        </div>
                        <div>{msg.content}</div>
                        <div className="small mt-1 opacity-75">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )
              ) : (
                <div className="text-center text-muted">
                  <p>Select a conversation to start chatting.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </Card.Body>
            <Card.Footer>
              <Form onSubmit={handleSendMessage}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={!selectedConversation || messagesLoading || sending}
                  />
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={!selectedConversation || !newMessage.trim() || sending}
                  >
                    {sending ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-1"
                        />
                        Sending...
                      </>
                    ) : (
                      'Send'
                    )}
                  </Button>
                </InputGroup>
              </Form>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MessagingPage;