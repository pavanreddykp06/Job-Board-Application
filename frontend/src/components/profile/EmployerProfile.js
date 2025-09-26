import React, { useState } from 'react';
import { Container, Tabs, Tab, Card } from 'react-bootstrap';
import CompanyProfile from './CompanyProfile';
import ChangePasswordForm from './ChangePasswordForm';
import UserInformationForm from './UserInformationForm';

const EmployerProfile = () => {
  const [key, setKey] = useState('company');

  return (
    <Container className="py-5">
      <h2 className="mb-4">My Profile</h2>
      <Tabs id="employer-profile-tabs" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
        <Tab eventKey="company" title="Company Profile">
          <CompanyProfile />
        </Tab>
        <Tab eventKey="user" title="My Information">
          <Card>
            <Card.Body>
              <UserInformationForm />
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="password" title="Change Password">
          <Card>
            <Card.Body>
              <ChangePasswordForm />
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default EmployerProfile;
