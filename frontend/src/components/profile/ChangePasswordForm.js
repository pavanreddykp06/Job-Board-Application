import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { userService } from '../../services/api';

const ChangePasswordForm = () => {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.new_password !== formData.new_password_confirm) {
      setError('New passwords do not match.');
      return;
    }

    try {
      await userService.changePassword(formData);
      setSuccess('Password updated successfully!');
      setFormData({ old_password: '', new_password: '', new_password_confirm: '' });
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <Form.Group className="mb-3">
        <Form.Label>Old Password</Form.Label>
        <Form.Control
          type="password"
          name="old_password"
          value={formData.old_password}
          onChange={handleChange}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>New Password</Form.Label>
        <Form.Control
          type="password"
          name="new_password"
          value={formData.new_password}
          onChange={handleChange}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Confirm New Password</Form.Label>
        <Form.Control
          type="password"
          name="new_password_confirm"
          value={formData.new_password_confirm}
          onChange={handleChange}
          required
        />
      </Form.Group>
      <Button variant="primary" type="submit">Change Password</Button>
    </Form>
  );
};

export default ChangePasswordForm;
