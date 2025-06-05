import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Send, AlertCircle, CheckCircle, Clock, X, User, Filter, Search, UserCheck } from 'lucide-react';

const DisputeResolutionAdmin = () => {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'detail'
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Admin response states
  const [adminResponse, setAdminResponse] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [assignedAdmin, setAssignedAdmin] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(null);

  // Mock admin list
  const adminList = ['Admin 1', 'Admin 2', 'Admin 3', 'Support Manager'];

  useEffect(() => {
    // Load all tickets for admin view
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
        user: { name: 'John Doe', email: 'john.doe@email.com' },
        assignedAdmin: 'Admin 1',
        messages: [
          { id: 1, content: 'Thank you for reporting this issue.', sender: 'admin', timestamp: '2024-12-01T11:00:00Z' },
          { id: 2, content: 'I have photos of the damage if needed.', sender: 'user', timestamp: '2024-12-01T12:00:00Z' }
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
        user: { name: 'Jane Smith', email: 'jane.smith@email.com' },
        messages: []
      },
      {
        id: 3,
        type: 'complaint',
        subject: 'Delivery Delay',
        description: 'My order was supposed to arrive 3 days ago but I still haven\'t received it.',
        status: 'resolved',
        relatedOrderId: 'ORD-456',
        createdAt: '2024-11-30T09:15:00Z',
        user: { name: 'Bob Johnson', email: 'bob.johnson@email.com' },
        assignedAdmin: 'Admin 2',
        messages: [
          { id: 3, content: 'We apologize for the delay. Your package was held up in transit. It should arrive tomorrow.', sender: 'admin', timestamp: '2024-11-30T10:00:00Z' },
          { id: 4, content: 'Thank you for the update!', sender: 'user', timestamp: '2024-11-30T10:30:00Z' }
        ]
      },
      {
        id: 4,
        type: 'dispute',
        subject: 'Wrong Item Delivered',
        description: 'I ordered a blue shirt size M but received a red shirt size L.',
        status: 'closed',
        relatedOrderId: 'ORD-321',
        relatedProductId: 'PROD-789',
        createdAt: '2024-11-28T16:45:00Z',
        user: { name: 'Alice Brown', email: 'alice.brown@email.com' },
        assignedAdmin: 'Support Manager',
        messages: [
          { id: 5, content: 'We apologize for the error. A replacement has been shipped and should arrive within 2 business days.', sender: 'admin', timestamp: '2024-11-28T17:00:00Z' },
          { id: 6, content: 'Perfect, thank you for the quick resolution!', sender: 'user', timestamp: '2024-11-28T17:15:00Z' }
        ]
      },
      {
        id: 5,
        type: 'complaint',
        subject: 'Website Technical Issue',
        description: 'I cannot complete my purchase due to a payment processing error.',
        status: 'open',
        createdAt: '2024-12-03T11:20:00Z',
        user: { name: 'Charlie Wilson', email: 'charlie.wilson@email.com' },
        messages: []
      }
    ];
    setTickets(mockTickets);
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = tickets;

    if (filters.type !== 'all') {
      filtered = filtered.filter(ticket => ticket.type === filters.type);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.subject.toLowerCase().includes(searchLower) ||
        ticket.user.name.toLowerCase().includes(searchLower) ||
        ticket.user.email.toLowerCase().includes(searchLower) ||
        ticket.id.toString().includes(searchLower)
      );
    }

    setFilteredTickets(filtered);
    setCurrentPage(1);
  }, [tickets, filters]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateTicket = async () => {
    if (!adminResponse.trim() && !statusUpdate && !assignedAdmin) {
      showNotification('Please provide a response, status update, or admin assignment.', 'error');
      return;
    }

    try {
      const updateData = {};
      if (adminResponse.trim()) updateData.message = adminResponse;
      if (statusUpdate) updateData.status = statusUpdate;
      if (assignedAdmin) updateData.assignedAdmin = assignedAdmin;

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      setAdminResponse('');
      setStatusUpdate('');
      setAssignedAdmin('');
      showNotification('Ticket updated successfully!');
    } catch (error) {
      showNotification('Failed to update ticket. Please try again.', 'error');
    }
  };

  const handleStatusOnlyUpdate = async (newStatus) => {
    setShowConfirmation({
      action: 'status',
      status: newStatus,
      message: `Are you sure you want to change the status to "${newStatus.replace('_', ' ')}"?`
    });
  };

  const confirmAction = async () => {
    if (showConfirmation.action === 'status') {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        showNotification('Status updated successfully!');
      } catch (error) {
        showNotification('Failed to update status. Please try again.', 'error');
      }
    }
    setShowConfirmation(null);
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

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTickets = filteredTickets.slice(startIndex, endIndex);

  if (currentView === 'detail' && selectedTicket) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{selectedTicket.subject}</h1>
                    <div className="flex items-center gap-4 mt-1 text-gray-600">
                      <span>Ticket #{selectedTicket.id}</span>
                      <span>•</span>
                      <span>{selectedTicket.user.name} ({selectedTicket.user.email})</span>
                    </div>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              {/* Ticket Details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
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
                  {selectedTicket.assignedAdmin && (
                    <div>
                      <p className="text-sm text-gray-600">Assigned Admin</p>
                      <p className="font-medium">{selectedTicket.assignedAdmin}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Original Description</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedTicket.description}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Message Thread</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                      selectedTicket.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 rounded-lg ${
                            message.sender === 'admin' 
                              ? 'bg-blue-50 border-l-4 border-blue-500 ml-8' 
                              : 'bg-gray-50 border-l-4 border-gray-500 mr-8'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm text-gray-600">
                              {message.sender === 'admin' ? 'Admin' : selectedTicket.user.name}
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
              </div>

              {/* Admin Actions Panel */}
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Admin Actions
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Response
                      </label>
                      <textarea
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type your response to the user..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Update Status
                      </label>
                      <select
                        value={statusUpdate}
                        onChange={(e) => setStatusUpdate(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">No change</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign to Admin
                      </label>
                      <select
                        value={assignedAdmin}
                        onChange={(e) => setAssignedAdmin(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select admin...</option>
                        {adminList.map(admin => (
                          <option key={admin} value={admin}>{admin}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleUpdateTicket}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {loading ? 'Updating...' : 'Update Ticket'}
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Quick Status Change</h3>
                  <div className="space-y-2">
                    {['open', 'in_progress', 'resolved', 'closed'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusOnlyUpdate(status)}
                        disabled={selectedTicket.status === status}
                        className={`w-full px-3 py-2 text-sm rounded-lg border ${
                          selectedTicket.status === status
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {status.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
              <p className="text-gray-600 mb-6">{showConfirmation.message}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmation(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {notification && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white z-40`}>
            {notification.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b p-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard - Ticket Management</h1>
            <p className="text-gray-600 mt-1">Manage and respond to user complaints and disputes</p>
          </div>

          {/* Filters */}
          <div className="border-b p-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="complaint">Complaints</option>
                <option value="dispute">Disputes</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search tickets, users..."
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-64"
                />
              </div>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">#{ticket.id}</span>
                        </div>
                        <div className="text-sm text-gray-900 font-medium">{ticket.subject}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{ticket.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{ticket.user.name}</div>
                          <div className="text-sm text-gray-500">{ticket.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full capitalize">
                        {ticket.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setCurrentView('detail');
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredTickets.length)} of {filteredTickets.length} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 border rounded-lg ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {filteredTickets.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-600">Try adjusting your filters or search criteria.</p>
            </div>
          )}
        </div>
      </div>

      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white z-40`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default DisputeResolutionAdmin;