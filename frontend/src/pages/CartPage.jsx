import React, { useState } from 'react';
import '../styles/AuthPage.css'; // Reusing existing styles
import '../styles/CartPage.css'; // Add specific styles for CartPage

const CartPage = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Eco-Friendly Water Bottle',
      price: 15.99,
      category: 'Sustainable Living',
      seller: 'GreenStore',
      image: '/images/water-bottle.jpg',
    },
    {
      id: 2,
      name: 'Reusable Grocery Bags',
      price: 12.49,
      category: 'Sustainable Living',
      seller: 'EcoMart',
      image: '/images/grocery-bags.jpg',
    },
    {
      id: 3,
      name: 'Solar-Powered Charger',
      price: 29.99,
      category: 'Electronics',
      seller: 'SolarTech',
      image: '/images/solar-charger.jpg',
    },
    {
      id: 4,
      name: 'Bamboo Toothbrush',
      price: 3.99,
      category: 'Personal Care',
      seller: 'EcoMart',
      image: '/images/bamboo-toothbrush.jpg',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [groupBy, setGroupBy] = useState('');

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSort = (e) => {
    setSortOption(e.target.value);
  };

  const handleFilter = (e) => {
    setFilterCategory(e.target.value);
  };

  const handleGroupBy = (e) => {
    setGroupBy(e.target.value);
  };

  const filteredItems = cartItems
    .filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((item) =>
      filterCategory ? item.category === filterCategory : true
    )
    .sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'price-desc') return b.price - a.price;
      return 0;
    });

  const groupedItems = groupBy
    ? filteredItems.reduce((groups, item) => {
        const key = item[groupBy];
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return groups;
      }, {})
    : { All: filteredItems };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="branding">
          <div className="logo">
            <div className="logo-text">EcoFinds</div>
            <div className="logo-accent"></div>
          </div>
          <h1 className="tagline">Your Cart</h1>
        </div>

        <div className="cart-controls">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
          <select value={sortOption} onChange={handleSort} className="sort-select">
            <option value="">Sort by</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
          <select value={filterCategory} onChange={handleFilter} className="filter-select">
            <option value="">Filter by Category</option>
            <option value="Sustainable Living">Sustainable Living</option>
            <option value="Electronics">Electronics</option>
            <option value="Personal Care">Personal Care</option>
          </select>
          <select value={groupBy} onChange={handleGroupBy} className="group-select">
            <option value="">Group by</option>
            <option value="category">Category</option>
            <option value="seller">Seller</option>
          </select>
        </div>

        <div className="cart-items">
          {Object.keys(groupedItems).map((group) => (
            <div key={group} className="group">
              {group !== 'All' && <h2 className="group-title">{group}</h2>}
              <div className="group-items">
                {groupedItems[group].map((item) => (
                  <div key={item.id} className="cart-item-card">
                    <img src={item.image} alt={item.name} className="product-image" />
                    <h3>{item.name}</h3>
                    <p>Price: ${item.price.toFixed(2)}</p>
                    <p>Category: {item.category}</p>
                    <p>Seller: {item.seller}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CartPage;