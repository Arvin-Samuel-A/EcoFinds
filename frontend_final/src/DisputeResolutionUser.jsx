import React, { useState, useEffect } from 'react';
import { ChevronLeft, Send, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';

const DisputeResolutionUser = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'detail'
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form state for ticket creation
  const [formData, setFormData] = useState({
    type: 'complaint',
    subject: '',
    description: '',
    relatedOrderId: '',
    relatedProductId: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Message input state
  const [newMessage, setNewMessage] = useState('');

  // Simulate API calls (replace with actual API calls)
  const apiCall = async (url, options = {}) => {
    setLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    
    // Mock responses
    if (url === '/api/tickets' && options.method === 'POST') {
      const newTicket = {
        id: Date.now(),
        ...JSON.parse(options.body),
        status: 'open',
        createdAt: new Date().toISOString(),
        messages: []
      };
      setTickets(prev => [newTicket, ...prev]);
      return { success: true, data: newTicket };
    }
    
    if (url.includes('/api/tickets/my/') && options.method === 'POST') {
      const ticketId = parseInt(url.split('/')[4]);
      const message = {
        id: Date.now(),
        content: JSON.parse(options.body).message,
        sender: 'user',
        timestamp: new Date().toISOString()
      };
      
      setSelectedTicket(prev => ({
        ...prev,
        messages: [...(prev.messages || []), message]
      }));
      
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, messages: [...(ticket.messages || []), message] }
          : ticket
      ));
      
      return { success: true };
    }
    
    return { success: true };
  };

  useEffect(() => {
    // Load user's tickets on mount
    const mockTickets = [
      {
        id: 1,
        type: 'complaint',
        subject: 'Product Quality Issue',
        description: 'The product I received was damaged upon arrival.',
        status: 'in_progress',
        relatedOrderId: 'ORD-123',
        relatedProductId: 'PROD-456',
        createdAt: '2024-12-01T10:00:00Z',
        messages: [
          { id: 1, content: 'Thank you for reporting this issue. We are investigating.', sender: 'admin', timestamp: '2024-12-01T11:00:00Z' }
        ]
      },
      {
        id: 2,
        type: 'dispute',
        subject: 'Billing Discrepancy',
        description: 'I was charged twice for the same order.',
        status: 'open',
        relatedOrderId: 'ORD-789',
        createdAt: '2024-12-02T14:30:00Z',
        messages: []
      }
    ];
    setTickets(mockTickets);
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.subject.trim()) errors.subject = 'Subject is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (formData.type === 'dispute' && !formData.relatedOrderId.trim()) {
      errors.relatedOrderId = 'Order ID is required for disputes';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const response = await apiCall('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.success) {
        showNotification('Ticket created successfully!');
        setFormData({
          type: 'complaint',
          subject: '',
          description: '',
          relatedOrderId: '',
          relatedProductId: ''
        });
        setCurrentView('list');
      }
    } catch (error) {
      showNotification('Failed to create ticket. Please try again.', 'error');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await apiCall(`/api/tickets/my/${selectedTicket.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      });

      setNewMessage('');
      showNotification('Message sent successfully!');
    } catch (error) {
      showNotification('Failed to send message. Please try again.', 'error');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <X className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setCurrentView('list')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Create New Ticket</h1>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="complaint">Complaint</option>
                  <option value="dispute">Dispute</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.subject ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Brief description of the issue"
                />
                {formErrors.subject && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.subject}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Provide detailed information about your issue"
                />
                {formErrors.description && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                )}
              </div>

              {formData.type === 'dispute' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Related Order ID *
                  </label>
                  <input
                    type="text"
                    value={formData.relatedOrderId}
                    onChange={(e) => setFormData({ ...formData, relatedOrderId: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.relatedOrderId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter the order ID related to this dispute"
                  />
                  {formErrors.relatedOrderId && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.relatedOrderId}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Product ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.relatedProductId}
                  onChange={(e) => setFormData({ ...formData, relatedProductId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product ID if applicable"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentView('list')}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {notification && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            {notification.message}
          </div>
        )}
      </div>
    );
  }

  if (currentView === 'detail' && selectedTicket) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => setCurrentView('list')}
                    className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{selectedTicket.subject}</h1>
                    <p className="text-gray-600 mt-1">Ticket #{selectedTicket.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedTicket.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium capitalize">{selectedTicket.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">{formatDate(selectedTicket.createdAt)}</p>
                </div>
                {selectedTicket.relatedOrderId && (
                  <div>
                    <p className="text-sm text-gray-600">Order ID</p>
                    <p className="font-medium">{selectedTicket.relatedOrderId}</p>
                  </div>
                )}
                {selectedTicket.relatedProductId && (
                  <div>
                    <p className="text-sm text-gray-600">Product ID</p>
                    <p className="font-medium">{selectedTicket.relatedProductId}</p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedTicket.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Messages</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    selectedTicket.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg ${
                          message.sender === 'user' 
                            ? 'bg-blue-50 border-l-4 border-blue-500 ml-8' 
                            : 'bg-gray-50 border-l-4 border-gray-500 mr-8'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm text-gray-600">
                            {message.sender === 'user' ? 'You' : 'Support'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-800">{message.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No messages yet</p>
                  )}
                </div>
              </div>

              {selectedTicket.status !== 'closed' && (
                <div className="border-t pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add a message
                  </label>
                  <div className="flex gap-4">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Type your message here..."
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={loading || !newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {notification && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            {notification.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
              <button
                onClick={() => setCurrentView('create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create New Ticket
              </button>
            </div>
          </div>

          <div className="p-6">
            {tickets.length > 0 ? (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setCurrentView('detail');
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            #{ticket.id}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="capitalize">{ticket.type}</span>
                          <span>{formatDate(ticket.createdAt)}</span>
                          {ticket.relatedOrderId && (
                            <span>Order: {ticket.relatedOrderId}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets yet</h3>
                <p className="text-gray-600 mb-4">Create your first ticket to get started</p>
                <button
                  onClick={() => setCurrentView('create')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create New Ticket
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default DisputeResolutionUser;