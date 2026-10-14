import React, { useState, useEffect } from 'react';
import { getProducts, getWishlist } from '../services/api';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import { ShoppingBag, RefreshCw, AlertCircle, PackageX } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('');

  const fetchWishlistIds = async () => {
    try {
      const data = await getWishlist();
      if (data && data.wishlist) {
        setWishlistIds(data.wishlist.map((item) => item._id));
      }
    } catch (err) {
      console.error('Error fetching wishlist status:', err);
    }
  };

  const fetchProductsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts({
        search: searchQuery,
        category: selectedCategory,
        sort: selectedSort
      });
      if (data.success) {
        setProducts(data.products || []);
      } else {
        setError('Something went wrong while loading products.');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Something went wrong while loading products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlistIds();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductsList();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedSort]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSort('');
  };

  return (
    <div className="products-container">
      {/* Header Banner */}
      <div className="products-header">
        <div className="header-title-wrap">
          <ShoppingBag size={28} className="header-icon" />
          <div>
            <h1>Product Catalog</h1>
            <p>Explore high-quality products curated just for you</p>
          </div>
        </div>
      </div>

      {/* Search and Category Filtering UI */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSort={selectedSort}
        setSelectedSort={setSelectedSort}
        onReset={handleResetFilters}
      />

      {/* Main Content Area Handling Loading, Error, and Empty States */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner spinner-lg"></div>
          <p>Loading products...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <AlertCircle size={44} className="error-icon" />
          <h3>Unable to load catalog</h3>
          <p>{error}</p>
          <button onClick={fetchProductsList} className="btn-retry">
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <PackageX size={48} className="empty-icon" />
          <h3>No products found.</h3>
          <p>We couldn't find any products matching your current search or category filters.</p>
          {(searchQuery || (selectedCategory && selectedCategory !== 'all')) && (
            <button onClick={handleResetFilters} className="btn-primary" style={{ maxWidth: '200px', marginTop: '1rem' }}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="products-results-count">
            Showing <span>{products.length}</span> {products.length === 1 ? 'product' : 'products'}
          </div>
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isWishlistedInitial={wishlistIds.includes(product._id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Products;
