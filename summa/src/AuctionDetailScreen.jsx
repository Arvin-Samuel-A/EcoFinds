
import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Eye, User, AlertCircle, CheckCircle, X, Heart, DollarSign } from 'lucide-react';

const AuctionDetailScreen = ({ auctionId = "1", currentUserId = "user123" }) => {
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [placingBid, setPlacingBid] = useState(false);
  const [watching, setWatching] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [socket, setSocket] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [notification, setNotification] = useState(null);

  // Mock data for demonstration
  const mockAuctionData = {
    id: "1",
    title: "Vintage Rolex Submariner 1970",
    description: "A rare vintage Rolex Submariner from 1970 in excellent condition. This timepiece features the iconic black dial and bezel, automatic movement, and has been professionally serviced. Comes with original box and papers. A true collector's piece that has been well-maintained throughout its history.",
    images: [
      "https://images.unsplash.com/photo-1523170335258-f5c6c6bd6eaf?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=600&h=400&fit=crop"
    ],
    currentBid: 15750,
    startPrice: 10000,
    bidCount: 23,
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    seller: {
      id: "seller456",
      name: "Premium Watches Co",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      rating: 4.8,
      totalSales: 156
    },
    status: "live",
    category: "Watches",
    condition: "Excellent",
    shipping: "Free worldwide shipping"
  };

  const mockBidHistory = [
    { id: 1, amount: 15750, bidder: "john_doe", time: new Date(Date.now() - 5 * 60 * 1000), avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" },
    { id: 2, amount: 15500, bidder: "watch_collector", time: new Date(Date.now() - 12 * 60 * 1000), avatar: "https://images.unsplash.com/photo-1494790108755-2616b332c5ca?w=40&h=40&fit=crop&crop=face" },
    { id: 3, amount: 15250, bidder: "vintage_lover", time: new Date(Date.now() - 18 * 60 * 1000), avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=40&h=40&fit=crop&crop=face" }
  ];

  // Calculate time remaining
  const calculateTimeRemaining = useCallback(() => {
    if (!auction?.endTime) return '';
    
    const now = new Date().getTime();
    const endTime = new Date(auction.endTime).getTime();
    const difference = endTime - now;
    
    if (difference <= 0) {
      return 'Auction Ended';
    }
    
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }, [auction?.endTime]);

  // Fetch auction details
  const fetchAuctionDetails = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAuction(mockAuctionData);
      setBidHistory(mockBidHistory);
      setError(null);
    } catch (err) {
      setError('Failed to load auction details');
    } finally {
      setLoading(false);
    }
  };

  // Place bid
  const placeBid = async (e) => {
    e.preventDefault();
    
    if (!bidAmount || parseFloat(bidAmount) <= auction.currentBid) {
      showNotification('Bid must be higher than current bid', 'error');
      return;
    }

    try {
      setPlacingBid(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newBid = {
        id: Date.now(),
        amount: parseFloat(bidAmount),
        bidder: "current_user",
        time: new Date(),
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face"
      };
      
      // Update auction state
      setAuction(prev => ({
        ...prev,
        currentBid: parseFloat(bidAmount),
        bidCount: prev.bidCount + 1
      }));
      
      // Add to bid history
      setBidHistory(prev => [newBid, ...prev]);
      
      setBidAmount('');
      showNotification('Bid placed successfully!', 'success');
      
    } catch (err) {
      showNotification('Failed to place bid', 'error');
    } finally {
      setPlacingBid(false);
    }
  };

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // WebSocket simulation
  useEffect(() => {
    // Simulate WebSocket connection
    const ws = {
      send: (data) => console.log('Sending:', data),
      close: () => console.log('WebSocket closed')
    };
    setSocket(ws);

    // Simulate real-time bid updates
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance of new bid
        const randomBid = auction?.currentBid + Math.floor(Math.random() * 500) + 50;
        const randomBidder = ['alice_smith', 'bob_jones', 'charlie_brown'][Math.floor(Math.random() * 3)];
        
        setAuction(prev => prev ? {
          ...prev,
          currentBid: randomBid,
          bidCount: prev.bidCount + 1
        } : null);
        
        setBidHistory(prev => [{
          id: Date.now(),
          amount: randomBid,
          bidder: randomBidder,
          time: new Date(),
          avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?w=40&h=40&fit=crop&crop=face`
        }, ...prev.slice(0, 9)]);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, [auction?.currentBid]);

  // Update time remaining
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeRemaining]);

  // Initial load
  useEffect(() => {
    fetchAuctionDetails();
  }, [auctionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading auction details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Auction</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchAuctionDetails}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!auction) return null;

  const isAuctionEnded = timeRemaining === 'Auction Ended';
  const isOwner = auction.seller.id === currentUserId;
  const minBidAmount = auction.currentBid + 50;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white flex items-center space-x-2`}>
          {notification.type === 'success' ? 
            <CheckCircle className="h-5 w-5" /> : 
            <X className="h-5 w-5" />
          }
          <span>{notification.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-w-16 aspect-h-10">
                <img 
                  src={auction.images[0]} 
                  alt={auction.title}
                  className="w-full h-96 object-cover"
                />
              </div>
              {auction.images.length > 1 && (
                <div className="p-4 flex space-x-3 overflow-x-auto">
                  {auction.images.map((img, idx) => (
                    <img 
                      key={idx}
                      src={img} 
                      alt={`${auction.title} ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{auction.title}</h1>
              <div className="flex flex-wrap gap-4 mb-6">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {auction.category}
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {auction.condition}
                </span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  {auction.shipping}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">{auction.description}</p>
            </div>

            {/* Seller Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
              <div className="flex items-center space-x-4">
                <img 
                  src={auction.seller.avatar} 
                  alt={auction.seller.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{auction.seller.name}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>★ {auction.seller.rating}</span>
                    <span>•</span>
                    <span>{auction.seller.totalSales} sales</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bid History */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bid History</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {bidHistory.map((bid) => (
                  <div key={bid.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={bid.avatar} 
                        alt={bid.bidder}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{bid.bidder}</p>
                        <p className="text-xs text-gray-500">
                          {bid.time.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${bid.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Bidding Panel */}
          <div className="space-y-6">
            {/* Auction Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  auction.status === 'live' ? 'bg-green-100 text-green-800' : 
                  auction.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {auction.status.toUpperCase()}
                </span>
                <button
                  onClick={() => setWatching(!watching)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    watching ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${watching ? 'fill-current' : ''}`} />
                  <span>{watching ? 'Watching' : 'Watch'}</span>
                </button>
              </div>

              <div className="text-center mb-6">
                <p className="text-sm text-gray-600 mb-1">Current Bid</p>
                <p className="text-3xl font-bold text-gray-900">${auction.currentBid.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{auction.bidCount} bids</p>
              </div>

              <div className="flex items-center justify-center space-x-2 mb-6">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className={`font-medium ${isAuctionEnded ? 'text-red-600' : 'text-gray-900'}`}>
                  {timeRemaining}
                </span>
              </div>

              {/* Bidding Form */}
              {!isAuctionEnded && !isOwner && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Bid (minimum ${minBidAmount.toLocaleString()})
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={minBidAmount.toString()}
                        min={minBidAmount}
                        step="50"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={placingBid}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            placeBid(e);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={placeBid}
                    disabled={placingBid || !bidAmount}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {placingBid ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Placing Bid...</span>
                      </>
                    ) : (
                      <span>Place Bid</span>
                    )}
                  </button>
                </div>
              )}

              {isAuctionEnded && (
                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <p className="text-gray-700 font-medium">Auction has ended</p>
                </div>
              )}

              {isOwner && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-700 font-medium">This is your auction</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Auction Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Starting Price</span>
                  <span className="font-medium">${auction.startPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bids</span>
                  <span className="font-medium">{auction.bidCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Watchers</span>
                  <span className="font-medium flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{Math.floor(Math.random() * 50) + 10}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailScreen;