import React, { useState } from 'react';
import '../styles/CartPage.css';

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
    {
      id: 5,
      name: 'Organic Cotton T-Shirt',
      price: 19.99,
      category: 'Clothing',
      seller: 'GreenWear',
      image: '/images/organic-cotton-tshirt.jpg',
    },
    {
      id: 6,
      name: 'Compostable Phone Case',
      price: 24.99,
      category: 'Electronics',
      seller: 'EcoTech',
      image: '/images/compostable-phone-case.jpg',
    },
    {
      id: 7,
      name: 'Recycled Paper Notebook',
      price: 7.49,
      category: 'Stationery',
      seller: 'PaperGoods',
      image: '/images/recycled-notebook.jpg',
    },
    {
      id: 8,
      name: 'Solar Garden Lights',
      price: 34.99,
      category: 'Home & Garden',
      seller: 'SolarTech',
      image: '/images/solar-garden-lights.jpg',
    },
    {
      id: 9,
      name: 'Reusable Coffee Cup',
      price: 14.99,
      category: 'Sustainable Living',
      seller: 'GreenStore',
      image: '/images/reusable-coffee-cup.jpg',
    },
    {
      id: 10,
      name: 'Bamboo Cutlery Set',
      price: 9.99,
      category: 'Kitchen',
      seller: 'EcoMart',
      image: '/images/bamboo-cutlery.jpg',
    },
    {
      id: 11,
      name: 'Natural Deodorant',
      price: 8.99,
      category: 'Personal Care',
      seller: 'GreenCare',
      image: '/images/natural-deodorant.jpg',
    },
    {
      id: 12,
      name: 'Eco-Friendly Yoga Mat',
      price: 39.99,
      category: 'Fitness',
      seller: 'GreenWear',
      image: '/images/eco-yoga-mat.jpg',
    },
    {
      id: 13,
      name: 'Recycled Plastic Backpack',
      price: 49.99,
      category: 'Clothing',
      seller: 'EcoMart',
      image: '/images/recycled-backpack.jpg',
    },
    {
      id: 14,
      name: 'Plant-Based Laundry Detergent',
      price: 12.99,
      category: 'Household',
      seller: 'GreenCare',
      image: '/images/plant-laundry-detergent.jpg',
    },
    {
      id: 15,
      name: 'Solar-Powered Bluetooth Speaker',
      price: 59.99,
      category: 'Electronics',
      seller: 'SolarTech',
      image: '/images/solar-speaker.jpg',
    },
    {
      id: 16,
      name: 'Reusable Silicone Food Bags',
      price: 11.99,
      category: 'Kitchen',
      seller: 'EcoMart',
      image: '/images/silicone-food-bags.jpg',
    },
    {
      id: 17,
      name: 'Organic Beeswax Wraps',
      price: 13.99,
      category: 'Kitchen',
      seller: 'GreenStore',
      image: '/images/beeswax-wraps.jpg',
    },
    {
      id: 18,
      name: 'Bamboo Hairbrush',
      price: 6.99,
      category: 'Personal Care',
      seller: 'EcoMart',
      image: '/images/bamboo-hairbrush.jpg',
    },
    {
      id: 19,
      name: 'Recycled Glass Water Bottle',
      price: 18.99,
      category: 'Sustainable Living',
      seller: 'GreenStore',
      image: '/images/recycled-glass-bottle.jpg',
    },
    {
      id: 20,
      name: 'Solar-Powered Garden Fountain',
      price: 79.99,
      category: 'Home & Garden',
      seller: 'SolarTech',
      image: '/images/solar-garden-fountain.jpg',
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
    <div className="cart-container">
      <div className="cart-header">
        <div className="logo">
          <div className="logo-text">EcoFinds</div>
          <div className="logo-accent"></div>
        </div>
        <h1 className="cart-title">Your Cart</h1>
      </div>

      <div className="cart-controls">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={handleSearch}
          className="search-input"
          aria-label="Search products"
        />
        <select value={sortOption} onChange={handleSort} className="sort-select" aria-label="Sort products">
          <option value="">Sort by</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
        <select value={filterCategory} onChange={handleFilter} className="filter-select" aria-label="Filter by category">
          <option value="">Filter by Category</option>
          <option value="Sustainable Living">Sustainable Living</option>
          <option value="Electronics">Electronics</option>
          <option value="Personal Care">Personal Care</option>
        </select>
        <select value={groupBy} onChange={handleGroupBy} className="group-select" aria-label="Group products">
          <option value="">Group by</option>
          <option value="category">Category</option>
          <option value="seller">Seller</option>
        </select>
      </div>

      <div className="cart-items">
        {Object.keys(groupedItems).length === 0 && (
          <p className="empty-message">No products found in your cart.</p>
        )}
        {Object.keys(groupedItems).map((group) => (
          <div key={group} className="group">
            {group !== 'All' && <h2 className="group-title">{group}</h2>}
            <div className="group-items">
              {groupedItems[group].map((item) => (
                <div key={item.id} className="cart-item-card">
                  <img src={item.image} alt={item.name} className="product-image" />
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p><strong>Price:</strong> ${item.price.toFixed(2)}</p>
                    <p><strong>Category:</strong> {item.category}</p>
                    <p><strong>Seller:</strong> {item.seller}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CartPage;
