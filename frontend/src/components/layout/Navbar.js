import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Container, Nav, Badge } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useMessages } from '../../contexts/MessageContext';

const MainNavbar = () => {
  const { user, logout } = useAuth();
  const { unreadCount: unreadNotifications } = useNotifications();
  const { unreadCount: unreadMessages } = useMessages();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img 
            src={require('../../pics/Jobify_logo.png')} 
            alt="Jobify Logo" 
            style={{
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              marginRight: '10px',
              objectFit: 'cover'
            }}
          />
          Jobify
        </Navbar.Brand>

        {/* Hamburger menu button for mobile */}
        <Navbar.Toggle aria-controls="navbarNav" />

        {/* Collapsible navbar content */}
        <Navbar.Collapse id="navbarNav">
          <Nav className="ms-auto">
            {user ? (
              <>
                {user.role === 'employer' && (
                  <>
                    <Nav.Link as={Link} to="/employer/dashboard">Dashboard</Nav.Link>
                    <Nav.Link as={Link} to="/employer/profile">My Profile</Nav.Link>

                    <Nav.Link as={Link} to="/employer/notifications">
                      Notifications
                      {unreadNotifications > 0 && (
                        <Badge bg="danger" pill className="ms-1">{unreadNotifications}</Badge>
                      )}
                    </Nav.Link>
                  </>
                )}
                {user.role === 'job_seeker' && (
                  <>
                    <Nav.Link as={Link} to="/job-seeker/dashboard">Dashboard</Nav.Link>
                    <Nav.Link as={Link} to="/job-seeker/profile">My Profile</Nav.Link>

                    <Nav.Link as={Link} to="/job-seeker/notifications">
                      Notifications
                      {unreadNotifications > 0 && (
                        <Badge bg="danger" pill className="ms-1">{unreadNotifications}</Badge>
                      )}
                    </Nav.Link>
                  </>
                )}
                <Nav.Link as={Link} to="/messages">
                  Messages
                  {unreadMessages > 0 && (
                    <Badge bg="danger" pill className="ms-1">{unreadMessages}</Badge>
                  )}
                </Nav.Link>
                <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MainNavbar;