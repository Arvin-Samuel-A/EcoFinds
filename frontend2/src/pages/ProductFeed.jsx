import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import CategoryFilter from '../components/CategoryFilter.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { useAuth } from '../hooks/useAuth';

export default function ProductFeed() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('All');
  const [query, setQuery] = useState('');

  // Fetch products from the API
  const fetchProducts = async () => {
    try {
      let url = new URL(`${import.meta.env.REACT_APP_API_URL}/api/products`);
      const params = {};
      if (query) params.search = query;
      if (selectedCat && selectedCat !== 'All') params.category = selectedCat;
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

      const res = await fetch(url, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {}
      });
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data);
      // derive categories from product list
      const cats = Array.from(new Set(data.map(p => p.category).filter(Boolean)));
      setCategories(['All', ...cats]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [query, selectedCat]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      <SearchBar onSearch={q => setQuery(q)} />

      <CategoryFilter
        categories={categories}
        selected={selectedCat}
        onSelect={setSelectedCat}
      />

      {products.length === 0 ? (
        <p className="text-center text-gray-400">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
