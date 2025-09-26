import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { MessageProvider } from './contexts/MessageContext';

// Placeholder reducer for now
const store = configureStore({ reducer: {} });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <MessageProvider>
            <App />
          </MessageProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </Provider>
);
