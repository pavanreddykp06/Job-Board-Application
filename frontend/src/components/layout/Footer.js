import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark text-white mt-auto py-3">
      <Container className="text-center">
        <small>&copy; {currentYear} Job Board. All rights reserved.</small>
      </Container>
    </footer>
  );
};

export default Footer;