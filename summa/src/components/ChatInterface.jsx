import React, { useState, useEffect } from 'react';
import {  X, Send, User } from 'lucide-react';
// Chat Component
const ChatInterface = ({ isOpen, onClose, product }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! How can I help you with this product?",
      sender: "seller",
      timestamp: new Date(Date.now() - 300000)
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now(),
      text: newMessage,
      sender: "user",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Simulate seller typing response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const response = {
        id: Date.now() + 1,
        text: "Thank you for your message! I'll get back to you shortly.",
        sender: "seller",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-96 flex flex-col animate-in fade-in zoom-in duration-300">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">{product?.sellerName}</h3>
              <p className="text-xs opacity-90">{product?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChatInterface;