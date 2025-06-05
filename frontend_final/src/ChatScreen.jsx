import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Image as ImageIcon,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Clock,
  User,
  Package,
  Star
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './ChatScreen.css';

const API_BASE_URL = 'http://localhost:5000/api';

const ChatScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { otherUserId, productId } = useParams();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // State management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // Fetch chat data
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true);
        
        // Fetch chat messages
        const token = localStorage.getItem('token');
        const messagesResponse = await fetch(`${API_BASE_URL}/chats/${otherUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          setMessages(messagesData.messages || []);
        }
        
        // Fetch other user info
        const userResponse = await fetch(`${API_BASE_URL}/users/${otherUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setOtherUser(userData);
        }
        
        // Fetch product info if productId exists
        if (productId) {
          const productResponse = await fetch(`${API_BASE_URL}/products/${productId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (productResponse.ok) {
            const productData = await productResponse.json();
            setProduct(productData);
          }
        }
        
      } catch (error) {
        console.error('Error fetching chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (otherUserId && user) {
      fetchChatData();
    }
  }, [otherUserId, productId, user]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chats/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toUserId: otherUserId,
          content: messageText,
          productId: productId || null
        })
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
      } else {
        // Re-add message to input if failed
        setNewMessage(messageText);
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error notification here
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = formatDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="chat-screen d-flex flex-column min-vh-100 bg-light">
      {/* Header */}
      <div className="chat-header bg-white border-bottom shadow-sm sticky-top">
        <div className="container-fluid px-3 py-3">
          <div className="row align-items-center">
            <div className="col-auto">
              <button 
                onClick={() => navigate(-1)}
                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{ width: '40px', height: '40px' }}
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            
            <div className="col">
              <div className="d-flex align-items-center">
                {/* User Avatar */}
                <div className="position-relative me-3">
                  {otherUser?.images?.url ? (
                    <img 
                      src={otherUser.images.url} 
                      alt={otherUser.name}
                      className="rounded-circle"
                      style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div 
                      className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                      style={{ width: '48px', height: '48px' }}
                    >
                      <User size={24} />
                    </div>
                  )}
                  {isOnline && (
                    <div 
                      className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-white"
                      style={{ width: '12px', height: '12px' }}
                    />
                  )}
                </div>
                
                {/* User Info */}
                <div className="flex-grow-1">
                  <h6 className="mb-0 fw-semibold">{otherUser?.name || 'Unknown User'}</h6>
                  <small className="text-muted">
                    {isTyping ? 'Typing...' : (isOnline ? 'Online' : 'Last seen recently')}
                  </small>
                </div>
              </div>
            </div>
            
            <div className="col-auto">
              <div className="d-flex gap-2">
                <button className="btn btn-outline-primary btn-sm rounded-circle">
                  <Phone size={16} />
                </button>
                <button className="btn btn-outline-primary btn-sm rounded-circle">
                  <Video size={16} />
                </button>
                <button className="btn btn-outline-secondary btn-sm rounded-circle">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Product Info */}
          {product && (
            <div className="row mt-3">
              <div className="col">
                <div className="card border-0 bg-light">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center">
                      <Package size={20} className="text-primary me-2" />
                      <div className="flex-grow-1">
                        <small className="text-muted">Discussing:</small>
                        <div className="fw-medium">{product.name}</div>
                        <small className="text-success fw-semibold">₹{product.price}</small>
                      </div>
                      <Link 
                        to={`/product/${product._id}`}
                        className="btn btn-outline-primary btn-sm"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages flex-grow-1 p-3 overflow-auto">
        <div className="container-fluid">
          {Object.entries(messageGroups).map(([date, dayMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="text-center my-3">
                <span className="badge bg-secondary px-3 py-2">{date}</span>
              </div>
              
              {/* Messages */}
              {dayMessages.map((message) => {
                const isOwn = message.sender === user._id;
                return (
                  <div 
                    key={message._id || message.id}
                    className={`d-flex mb-3 ${isOwn ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    <div 
                      className={`message-bubble ${isOwn ? 'own' : 'other'}`}
                      style={{ maxWidth: '70%' }}
                    >
                      <div 
                        className={`p-3 rounded-3 ${
                          isOwn 
                            ? 'bg-primary text-white' 
                            : 'bg-white border'
                        }`}
                      >
                        <div className="message-content">
                          {message.content}
                        </div>
                        <div 
                          className={`d-flex align-items-center justify-content-end mt-1 ${
                            isOwn ? 'text-white-50' : 'text-muted'
                          }`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          <span className="me-1">{formatTime(message.timestamp)}</span>
                          {isOwn && (
                            message.read ? 
                              <CheckCheck size={14} className="text-success" /> :
                              <Check size={14} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="d-flex justify-content-start mb-3">
              <div className="bg-white border rounded-3 p-3" style={{ maxWidth: '70%' }}>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="chat-input bg-white border-top p-3">
        <div className="container-fluid">
          <div className="row align-items-end">
            <div className="col">
              <div className="input-group">
                <button className="btn btn-outline-secondary">
                  <Paperclip size={18} />
                </button>
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="form-control border-0"
                  rows="1"
                  style={{ 
                    resize: 'none',
                    maxHeight: '120px'
                  }}
                />
                <button className="btn btn-outline-secondary">
                  <ImageIcon size={18} />
                </button>
                <button className="btn btn-outline-secondary">
                  <Smile size={18} />
                </button>
              </div>
            </div>
            <div className="col-auto ms-2">
              <button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px' }}
              >
                {sending ? (
                  <div className="spinner-border spinner-border-sm text-white" role="status" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;