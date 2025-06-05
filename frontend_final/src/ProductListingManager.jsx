import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package, CheckCircle, AlertCircle, X, Clock, Gavel } from 'lucide-react';
import axios from 'axios';

const ProductListingManager = () => {
  const [listings, setListings] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Load user's listings (both products and auctions)
  const loadListings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/products/my-listings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListings(response.data.listings || []);
    } catch (error) {
      showMessage('error', 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleDelete = async (listing) => {
    const itemType = listing.type === 'auction' ? 'auction' : 'product';
    if (window.confirm(`Are you sure you want to delete this ${itemType}? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('token');
        const endpoint = listing.type === 'auction' 
          ? `/api/auctions/${listing.listingId}` 
          : `/api/products/${listing.listingId}`;
        
        await axios.delete(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setListings(prev => prev.filter(l => l.listingId !== listing.listingId));
        showMessage('success', `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted successfully!`);
      } catch (error) {
        showMessage('error', `Failed to delete ${itemType}`);
      }
    }
  };

  const formatTimeRemaining = (timeRemaining) => {
    if (timeRemaining <= 0) return 'Ended';
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const filteredListings = listings.filter(listing => {
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'products' && listing.type === 'product') ||
      (activeTab === 'auctions' && listing.type === 'auction') ||
      (activeTab === 'active' && ['active', 'live', 'upcoming'].includes(listing.status));
    
    const matchesSearch = listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (listing.description && listing.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
            </div>
            <button
              onClick={() => window.location.href = '/add-product'}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Listing
            </button>
          </div>
        </div>
      </header>

      {/* Message Banner */}
      {message.text && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
          message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-80"
              />
            </div>

            <div className="flex space-x-2">
              {{
                key: 'all',
                label: 'All Listings'
              },
              {
                key: 'products',
                label: 'Products'
              },
              {
                key: 'auctions',
                label: 'Auctions'
              },
              {
                key: 'active',
                label: 'Active'
              }
            .map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
              <p className="text-gray-500">
                {listings.length === 0 
                  ? "Get started by creating your first listing."
                  : "Try adjusting your search or filters."
                }
              </p>
            </div>
          ) : (
            filteredListings.map((listing, index) => (
              <div
                key={listing.listingId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transform transition-all duration-300 hover:-translate-y-1"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{listing.name}</h3>
                        {listing.type === 'auction' && (
                          <Gavel className="h-4 w-4 text-purple-500" />
                        )}
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {listing.description}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      listing.status === 'active' || listing.status === 'live'
                        ? 'bg-green-100 text-green-800'
                        : listing.status === 'upcoming'
                        ? 'bg-blue-100 text-blue-800'
                        : listing.status === 'ended'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {listing.status}
                    </span>
                  </div>

                  {/* Auction-specific info */}
                  {listing.type === 'auction' && (
                    <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-700">Current Bid:</span>
                        <span className="text-lg font-bold text-purple-900">₹{listing.highestBid}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-purple-600">Bids:</span>
                        <span className="text-sm font-medium">{listing.bidCount}</span>
                      </div>
                      {listing.status === 'live' && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-purple-600">Time left:</span>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-purple-500" />
                            <span className="text-sm font-medium text-purple-700">
                              {formatTimeRemaining(listing.timeRemaining)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500">
                      {listing.type === 'auction' ? 'Auction' : listing.categories?.[0]?.name || 'Product'}
                    </span>
                    {listing.type === 'product' && (
                      <span className="text-xl font-bold text-indigo-600">₹{listing.price}</span>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.location.href = `/edit-${listing.type}/${listing.listingId}`}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(listing)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListingManager;