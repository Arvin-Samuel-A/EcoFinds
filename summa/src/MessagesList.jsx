import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MessageCircle, 
  ArrowLeft, 
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  User,
  Package
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const MessagesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/chats/conversations`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || []);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchConversations();
    }
  }, [user]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.otherUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || 
                         (activeFilter === 'unread' && conv.unreadCount > 0) ||
                         (activeFilter === 'archived' && conv.archived);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <div className="bg-white border-bottom sticky-top">
        <div className="container-fluid px-4 py-3">
          <div className="row align-items-center">
            <div className="col-auto">
              <button 
                onClick={() => navigate('/dashboard')}
                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{ width: '40px', height: '40px' }}
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            <div className="col">
              <h1 className="h4 fw-bold mb-0">Messages</h1>
              <p className="text-muted small mb-0">{conversations.length} conversations</p>
            </div>
            <div className="col-auto">
              <button className="btn btn-outline-secondary">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-bottom">
        <div className="container-fluid px-4 py-3">
          {/* Search */}
          <div className="row mb-3">
            <div className="col">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <Search size={18} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 bg-light"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="row">
            <div className="col">
              <div className="btn-group w-100" role="group">
                {[
                  { key: 'all', label: 'All', count: conversations.length },
                  { key: 'unread', label: 'Unread', count: conversations.filter(c => c.unreadCount > 0).length },
                  { key: 'archived', label: 'Archived', count: conversations.filter(c => c.archived).length }
                ].map(filter => (
                  <button
                    key={filter.key}
                    type="button"
                    className={`btn ${activeFilter === filter.key ? 'btn-primary' : 'btn-outline-secondary'} flex-fill`}
                    onClick={() => setActiveFilter(filter.key)}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="container-fluid px-4 py-3">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-5">
            <MessageCircle size={64} className="text-muted mb-3" />
            <h3 className="h5 fw-bold text-dark mb-2">
              {searchTerm ? 'No messages found' : 'No conversations yet'}
            </h3>
            <p className="text-muted mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Start chatting with sellers to see your conversations here'
              }
            </p>
            {!searchTerm && (
              <Link 
                to="/marketplace" 
                className="btn btn-primary"
              >
                Browse Products
              </Link>
            )}
          </div>
        ) : (
          <div className="row">
            {filteredConversations.map((conversation) => (
              <div key={conversation._id} className="col-12 mb-2">
                <Link
                  to={`/chat/${conversation.otherUser._id}${conversation.product ? `/${conversation.product._id}` : ''}`}
                  className="text-decoration-none"
                >
                  <div className={`card border-0 shadow-sm conversation-card ${conversation.unreadCount > 0 ? 'unread' : ''}`}>
                    <div className="card-body p-3">
                      <div className="row align-items-center">
                        {/* User Avatar */}
                        <div className="col-auto">
                          <div className="position-relative">
                            {conversation.otherUser.images?.url ? (
                              <img 
                                src={conversation.otherUser.images.url} 
                                alt={conversation.otherUser.name}
                                className="rounded-circle"
                                style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div 
                                className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                                style={{ width: '56px', height: '56px' }}
                              >
                                <User size={28} />
                              </div>
                            )}
                            {conversation.isOnline && (
                              <div 
                                className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white"
                                style={{ width: '16px', height: '16px' }}
                              />
                            )}
                          </div>
                        </div>

                        {/* Conversation Info */}
                        <div className="col">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <h6 className="mb-0 fw-semibold text-dark">
                              {conversation.otherUser.name}
                            </h6>
                            <small className="text-muted">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </small>
                          </div>
                          
                          {/* Product Info */}
                          {conversation.product && (
                            <div className="d-flex align-items-center mb-1">
                              <Package size={12} className="text-muted me-1" />
                              <small className="text-muted">{conversation.product.name}</small>
                            </div>
                          )}
                          
                          {/* Last Message */}
                          <div className="d-flex justify-content-between align-items-center">
                            <p className={`mb-0 small ${conversation.unreadCount > 0 ? 'fw-medium text-dark' : 'text-muted'}`}>
                              {conversation.lastMessage.sender === user._id && (
                                <span className="me-1">
                                  {conversation.lastMessage.read ? 
                                    <CheckCheck size={14} className="text-success" /> :
                                    <Check size={14} className="text-muted" />
                                  }
                                </span>
                              )}
                              {conversation.lastMessage.content.length > 50 
                                ? `${conversation.lastMessage.content.substring(0, 50)}...`
                                : conversation.lastMessage.content
                              }
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span className="badge bg-primary rounded-pill">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .conversation-card {
          transition: all 0.2s ease;
          border-left: 4px solid transparent;
        }
        
        .conversation-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        
        .conversation-card.unread {
          border-left-color: #0d6efd;
          background-color: #f8f9ff;
        }
        
        @media (max-width: 768px) {
          .container-fluid {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MessagesList;