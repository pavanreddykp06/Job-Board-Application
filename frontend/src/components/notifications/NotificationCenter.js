import React, { useState } from 'react';
import { Container, ListGroup, Badge, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationCenter = () => {
  const { user } = useAuth();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [error, setError] = useState(null);



  const handleMarkAsRead = async (notificationId) => {
    try {
      const success = await markAsRead(notificationId);
      if (!success) {
        setError('Failed to mark notification as read. Please try again.');
      }
    } catch (err) {
      setError('Failed to mark notification as read. Please try again.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await markAllAsRead();
      if (!success) {
        setError('Failed to mark all notifications as read. Please try again.');
      }
    } catch (err) {
      setError('Failed to mark all notifications as read. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };



  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Notifications</h2>
        {unreadCount > 0 && (
          <Button variant="outline-primary" onClick={handleMarkAllAsRead}>
            Mark All as Read
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <Alert variant="info">
          You have no notifications at this time.
        </Alert>
      ) : (
        <ListGroup className="shadow-sm">
          {notifications.map(notification => (
            <ListGroup.Item 
              key={notification.id} 
              className={`d-flex justify-content-between align-items-start py-3 ${!notification.is_read ? 'bg-light' : ''}`}
            >
              <div className="ms-2 me-auto">
                <div className="d-flex align-items-center">
                  {!notification.is_read && (
                    <Badge bg="primary" pill className="me-2">
                      New
                    </Badge>
                  )}
                  <div>
                    <div className={!notification.is_read ? 'fw-bold' : ''}>{notification.message}</div>
                    <small className="text-muted">{formatDate(notification.created_at)}</small>
                  </div>
                </div>
              </div>
              <div className="d-flex">
                <Button 
                  variant="link" 
                  href={notification.link} 
                  className="text-decoration-none me-2"
                >
                  View
                </Button>
                {!notification.is_read && (
                  <Button 
                    variant="link" 
                    className="text-decoration-none text-muted" 
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </Container>
  );
};

export default NotificationCenter;