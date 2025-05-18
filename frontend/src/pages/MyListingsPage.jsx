import React, { useState } from 'react';
import '../styles/AuthPage.css'; // Reusing existing styles
import '../styles/MyListingsPage.css'; // Add specific styles for MyListingsPage
import { useNavigate } from 'react-router-dom';

const MyListingsPage = () => {
  const navigate = useNavigate();

  const [listings, setListings] = useState([
    {
      id: 1,
      name: 'Eco-Friendly Water Bottle',
      price: 15.99,
      category: 'Sustainable Living',
      status: 'Available',
      seller: 'GreenStore',
      image: '/images/water-bottle.jpg',
    },
    {
      id: 2,
      name: 'Reusable Grocery Bags',
      price: 12.49,
      category: 'Sustainable Living',
      status: 'Out of Stock',
      seller: 'EcoMart',
      image: '/images/grocery-bags.jpg',
    },
    {
      id: 3,
      name: 'Solar-Powered Charger',
      price: 29.99,
      category: 'Electronics',
      status: 'Available',
      seller: 'SolarTech',
      image: '/images/solar-charger.jpg',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [groupBy, setGroupBy] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    status: '',
    seller: '',
    image: '',
  });

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

  const handleAddNew = () => {
    navigate('/addproduct');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveNewProduct = () => {
    const newProductWithId = {
      ...newProduct,
      id: listings.length + 1,
      price: parseFloat(newProduct.price),
    };
    setListings((prev) => [...prev, newProductWithId]);
    setShowAddModal(false);
    setNewProduct({
      name: '',
      price: '',
      category: '',
      status: '',
      seller: '',
      image: '',
    });
  };

  const filteredListings = listings
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

  const groupedListings = groupBy
    ? filteredListings.reduce((groups, item) => {
        const key = item[groupBy];
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return groups;
      }, {})
    : { All: filteredListings };

  const handleProductClick = (id) => {
    navigate(`/product/${id}`);
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="listings-controls">
          <button className="add-product-btn" onClick={handleAddNew}>
            + Add New
          </button>
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
          </select>
          <select value={groupBy} onChange={handleGroupBy} className="group-select">
            <option value="">Group by</option>
            <option value="category">Category</option>
            <option value="status">Status</option>
          </select>
        </div>

        <div className="listings-items">
          {Object.keys(groupedListings).map((group) => (
            <div key={group} className="group">
              {group !== 'All' && <h2 className="group-title">{group}</h2>}
              <div className="group-items">
                {groupedListings[group].map((item) => (
                  <div
                    key={item.id}
                    className="listing-item-card"
                    onClick={() => handleProductClick(item.id)}
                  >
                    <img src={item.image} alt={item.name} className="product-image" />
                    <h3>{item.name}</h3>
                    <p>Price: ${item.price.toFixed(2)}</p>
                    <p>Category: {item.category}</p>
                    <p>Status: {item.status}</p>
                    <p>Seller: {item.seller}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {showAddModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>Add New Product</h2>
              <input
                type="text"
                name="name"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={handleInputChange}
              />
              <input
                type="number"
                name="price"
                placeholder="Price"
                value={newProduct.price}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="category"
                placeholder="Category"
                value={newProduct.category}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="status"
                placeholder="Status"
                value={newProduct.status}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="seller"
                placeholder="Seller"
                value={newProduct.seller}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="image"
                placeholder="Image URL"
                value={newProduct.image}
                onChange={handleInputChange}
              />
              <button onClick={handleSaveNewProduct}>Save</button>
              <button onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyListingsPage;