import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Networks.css';
import bluePlus from '../../../assets/blue-plus.png';
import Loader from '../../loader/Loader';
import axios from 'axios';
import debounce from 'lodash.debounce';

const Networks = () => {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [count, setCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchActive, setSearchActive] = useState(false);

  const loadData = async () => {
    setSearchActive(false);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token is not available');

      const response = await axios.post(
        `https://us-central1-coffee-bee.cloudfunctions.net/getAllNetworks?count=${count}&offset=${(currentPage - 1) * count}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNetworks(response.data.roasters || []);
      setTotalPages(Math.ceil(response.data.totalCount / count));
    } catch (e) {
      console.log(e.response.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = debounce(async (e) => {
    setSuccess(false);
    setNetworks([]);
    setSearchActive(true);
    if (!e.target.value.trim()) {
      loadData();
      return;
    }
    try {
      const response = await axios.post(
        'https://us-central1-coffee-bee.cloudfunctions.net/getNetworkByInput',
        { networkName: e.target.value }
      );

      if (Array.isArray(response.data) && response.data.length === 0) {
        setSuccess(true);
        setNetworks([]);
      } else {
        setNetworks(response.data);
        setSuccess(false);
      }
    } catch (error) {
      console.log(error.response?.data);
    } finally {
      setLoading(false);
    }
  }, 500);

  const handleSearchMain = (e) => {
    setLoading(true);
    handleSearch(e);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const renderPaginationButtons = () => {
    if(networks.length < 10) {
       return
    }
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (totalPages > 5) {
      if (currentPage <= 3) endPage = 5;
      else if (currentPage >= totalPages - 2) startPage = totalPages - 4;
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="beansMain-pagination-container">
        <ul className="beansMain-pagination-list">
          <li className="beansMain-pagination-item">
            <a
              href="#"
              className="beansMain-pagination-link"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </a>
          </li>

          {pages.map((page) => (
            <li
              key={page}
              className={`beansMain-pagination-item ${currentPage === page ? 'beansMain-pagination-item-active' : ''}`}
            >
              <a
                href="#"
                className="beansMain-pagination-link"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </a>
            </li>
          ))}

          <li className="beansMain-pagination-item">
            <a
              href="#"
              className="beansMain-pagination-link"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </a>
          </li>
        </ul>
      </div>
    );
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [currentPage, count]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages]);

  return (
    <div className="Networks-con">
      <h1 className="networks-mainTitle">Networks</h1>

      <Link to="/add-network" className="Networks-add-new-cafe-pass-con">
        <div className="Networks-block-for-cafe-pass-img-plus">
          <img src={bluePlus} alt="plus-icon" />
        </div>
        <p className="Networks-cafe-pass-p-just-text">Add New Network</p>
      </Link>

      <input
        className="Networks-iputSerach"
        onChange={handleSearchMain}
        placeholder="Find network"
      />

      {loading ? (
        <Loader />
      ) : networks.length === 0 ? (
        success ? (
          <div className="roasters-notFound-results">
            <p>No results. Please try another search</p>
          </div>
        ) : null
      ) : (
        <>
          {networks.map((network) => (
            <Link className='Networks-net-link' key={network.name} to={`/network-info/${network.name}`}>
              <div className="JoinCoffeNetwork-network-con">
                <h1>
                  Network name: <strong>{network.name}</strong>
                </h1>
                <p>
                members: {Math.max(0, Array.isArray(network.cafeIds) ? network.cafeIds.length - 1 : 0)}
                </p>
              </div>
            </Link>
          ))}
          {!searchActive && !loading && renderPaginationButtons()}
        </>
      )}
    </div>
  );
};

export default Networks;
