import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { messagingService } from '../services/api';

const MessageContext = createContext();

export const useMessages = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setConversations([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.user.id);
    }
  }, [activeConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await messagingService.getConversations();
      
      // Transform the response to match your component's expected structure
      const transformedConversations = response.data.map(conversation => {
        const otherUser = conversation.user;
        const lastMessage = conversation.last_message;
        
        return {
          id: otherUser.id, // Use user ID as conversation ID
          user: otherUser,
          with_user: {
            id: otherUser.id,
            username: otherUser.username,
            full_name: otherUser.full_name || otherUser.username,
            role: otherUser.role,
            company_name: user?.role === 'job_seeker' && otherUser.role === 'employer' 
              ? (otherUser.company_name || 'Company') : null,
          },
          last_message: lastMessage ? lastMessage.content : 'No messages yet',
          unread_count: conversation.unread_count || 0,
          updated_at: lastMessage ? lastMessage.timestamp : new Date().toISOString(),
          job: null // You can add job context if needed
        };
      });

      setConversations(transformedConversations);
      
      // Calculate total unread count
      const totalUnread = transformedConversations.reduce(
        (total, conv) => total + conv.unread_count, 
        0
      );
      setUnreadCount(totalUnread);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      setMessagesLoading(true);
      const response = await messagingService.getMessages(userId);
      
      // Transform messages to match your component's expected structure
      const transformedMessages = response.data.map(message => ({
        id: message.id,
        sender_id: message.sender,
        recipient_id: message.recipient,
        content: message.content,
        timestamp: message.timestamp,
        is_read: message.is_read,
        sender_name: message.sender_name
      }));
      
      setMessages(transformedMessages);
      
      // Update conversation as read
      markConversationAsRead(userId);
      
      setMessagesLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessagesLoading(false);
    }
  };

  const markConversationAsRead = (userId) => {
    const updatedConversations = conversations.map(conv => 
      conv.user.id === userId 
        ? { ...conv, unread_count: 0 } 
        : conv
    );
    
    setConversations(updatedConversations);
    setUnreadCount(updatedConversations.reduce((total, conv) => total + conv.unread_count, 0));
  };

  const sendMessage = async (userId, content) => {
    try {
      const response = await messagingService.sendMessage(userId, content);
      
      // Transform the response message
      const newMessage = {
        id: response.data.id,
        sender_id: response.data.sender,
        recipient_id: response.data.recipient,
        content: response.data.content,
        timestamp: response.data.timestamp,
        is_read: false,
        sender_name: response.data.sender_name
      };
      
      // Add new message to the list
      setMessages(prev => [...prev, newMessage]);
      
      // Update last message in conversations list
      const updatedConversations = conversations.map(conv => 
        conv.user.id === userId 
          ? { 
              ...conv, 
              last_message: content,
              updated_at: new Date().toISOString()
            } 
          : conv
      );
      
      setConversations(updatedConversations);
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  const startNewConversation = async (recipientId, initialMessage, jobId = null) => {
    try {
      const response = await messagingService.startConversation(
        recipientId, 
        initialMessage, 
        jobId
      );
      
      // Transform the response to match conversation structure
      const newConversation = {
        id: response.data.user.id,
        user: response.data.user,
        with_user: {
          id: response.data.user.id,
          username: response.data.user.username,
          full_name: response.data.user.full_name || response.data.user.username,
          role: response.data.user.role,
          company_name: user?.role === 'job_seeker' && response.data.user.role === 'employer' 
            ? 'Company' : null,
        },
        last_message: initialMessage,
        unread_count: 0,
        updated_at: new Date().toISOString(),
        job: jobId ? { id: jobId, title: 'Job Title' } : null
      };
      
      // Add to conversations if not already there
      const existingConv = conversations.find(conv => conv.user.id === recipientId);
      if (!existingConv) {
        setConversations(prev => [newConversation, ...prev]);
      }
      
      setActiveConversation(newConversation);
      
      // Refresh messages for this conversation
      await fetchMessages(recipientId);
      
      return true;
    } catch (error) {
      console.error('Error starting new conversation:', error);
      return false;
    }
  };

  const searchUsers = async (query) => {
    try {
      const response = await messagingService.searchUsers(query);
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const value = {
    conversations,
    unreadCount,
    loading,
    activeConversation,
    setActiveConversation,
    messages,
    messagesLoading,
    sendMessage,
    startNewConversation,
    searchUsers,
    refreshConversations: fetchConversations
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};