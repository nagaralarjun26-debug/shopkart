import React from 'react';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';

const SearchBar = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedSort,
  setSelectedSort,
  onReset
}) => {
  const categories = ['All Categories', 'Electronics', 'Fashion', 'Books', 'Home'];

  return (
    <div className="search-filter-bar">
      {/* Search Input */}
      <div className="search-input-group">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setSearchQuery('')}
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="filter-controls">
        {/* Category Selector */}
        <div className="select-wrapper">
          <Filter size={16} className="select-icon" />
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat === 'All Categories' ? 'all' : cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="select-wrapper">
          <ArrowUpDown size={16} className="select-icon" />
          <select
            className="filter-select"
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
          >
            <option value="">Sort: Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* Reset Filters button if any active */}
        {(searchQuery || (selectedCategory && selectedCategory !== 'all') || selectedSort) && (
          <button className="btn-reset-filter" onClick={onReset} title="Reset all filters">
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
