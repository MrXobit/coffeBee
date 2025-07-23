import React, { useEffect, useRef, useState } from 'react';
import './Cafes.css';
import bluePlus from '../../../assets/blue-plus.png';
import { Link, useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';
import axios from 'axios';
import Loader from '../../loader/Loader';
import { db, storage } from '../../../firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { deleteObject, listAll, ref } from 'firebase/storage';
import { countrysArray } from './country';
import noImage from '../../../assets/noImage.jpeg';

const Cafes = () => {
  const [roasters, setRoasters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [count, setCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchActiva, setSearchActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState({ active: false, country: '' });
  const [activeFilterCity, setActiveFilterCity] = useState({ active: false, city: '' });
  
  const [potentialInputValue, setPotentialInputValue] = useState([]);
  const [inputState, setInputState] = useState('');

  const navigate = useNavigate();
  const controllerRef = useRef(null);

  const firstCafes = useRef([]);


  const loadData = async (num) => {
    if (num !== 1) {
      if (activeFilter.active && activeFilter.country.trim() !== '') {
        return loadCafesByCountry(activeFilter.country);
      }
    }

    setSearchActive(false);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token is not available');
      const response = await axios.post(
        `https://us-central1-coffee-bee.cloudfunctions.net/getAllCoffe?count=${count}&offset=${(currentPage - 1) * count}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      
      firstCafes.current = response.data.roasters;
      setRoasters(response.data.roasters);
      setTotalPages(Math.ceil(response.data.totalCount / count));
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };



  

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleSearch = async (e) => {
    const query = e.target.value.trim();
    setInputState(query);
    setSuccess(false);
    setSearchActive(true);
    setRoasters([]);

    if (!query) {


      if (firstCafes.current.length > 0) {
        setRoasters(firstCafes.current);
        setLoading(false);
      } else {
        loadData();
        return;
      }
    }

    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await axios.post(
        'https://us-central1-coffee-bee.cloudfunctions.net/searchCafes',
        { coffeName: query, country: activeFilter.country },
        { signal: controller.signal }
      );

      if (Array.isArray(res.data) && res.data.length === 0) {
        setSuccess(true);
        setRoasters([]);
      } else {
        setRoasters(res.data);
        setSuccess(false);
      }

      setLoading(false);
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        console.log('🚫 Запит було скасовано');
      } else {
        console.error('🔥 ПОМИЛКА:', err.message);
        setLoading(false);
      }
    }
  };



  const controllerCityRef = useRef(null);

  const searchCafeByCity = async (e) => {
    const cityQuery = e.target.value.trim();
    setSuccess(false);
    setSearchActive(true);
    setRoasters([]);
  
    if (!cityQuery) {
      loadData();
      return;
    }
  
    if (controllerCityRef.current) {
      controllerCityRef.current.abort();
    }
  
    const controller = new AbortController();
    controllerCityRef.current = controller;
    setLoading(true);
  
    try {
      const response = await axios.post(
        'https://us-central1-coffee-bee.cloudfunctions.net/getCafeByCity',
        { city: cityQuery },
        { signal: controller.signal }
      );
  
      if (Array.isArray(response.data) && response.data.length === 0) {
        setSuccess(true);
        setRoasters([]);
      } else {
        setRoasters(response.data);
        setSuccess(false);
      }
    } catch (err) {
      if (
        axios.isCancel(err) ||
        err.name === 'CanceledError' ||
        err.code === 'ERR_CANCELED'
      ) {
        console.log('🚫 Запит було скасовано');
      } else {
        console.error('🔥 ПОМИЛКА:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };
  




  const handleSearchMain = (e) => {
    setInputState(e.target.value);


    if(activeFilterCity.active) {
      return searchCafeByCity(e)
    }


    if (activeFilter.active && activeFilter.country.trim() !== '') {
      setLoading(true);
      return handleSearch(e);
    }

    if (activeFilter.active && activeFilter.country.trim() === '') {
      const maxSuggestions = 5;
      const countrys = [];
      const value = e.target.value.trim();

      if (value === '') {
        setPotentialInputValue([]);
        return;
      }

      for (let i = 0; i < countrysArray.length; i++) {
        const country = countrysArray[i];
        if (country.toLowerCase().startsWith(value.toLowerCase())) {
          countrys.push(country);
          if (countrys.length === maxSuggestions) break;
        }
      }

      setPotentialInputValue(countrys);
      return;
    }

    setLoading(true);
    handleSearch(e);
  };

  useEffect(() => {
    setLoading(true);
    loadData(2);
  }, [currentPage, count]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages]);

  const handleChoiceCountry = (country) => {
    setPotentialInputValue([]);
    setActiveFilter({ active: true, country });
    setInputState('');
    loadCafesByCountry(country);
  };

  const loadCafesByCountry = async (country) => {
    setLoading(true);
    setSearchActive(false);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token is not available');

      const response = await axios.post(
        'https://us-central1-coffee-bee.cloudfunctions.net/getCafesByCountry',
        {
          country,
          limitCount: count,
          offset: (currentPage - 1) * count
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRoasters(response.data.cafes);
      setTotalPages(Math.ceil(response.data.totalCount / count));
    } catch (e) {
      console.log(e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  const btnChangeState = () => {
    setInputState('')
    setActiveFilterCity({ active: false, city: '' });
    if (activeFilter.active) {
      setActiveFilter({ active: false, country: '' });
  
      if (firstCafes.current.length > 0) {
        setRoasters(firstCafes.current);
        setLoading(false);
      } else {
        setLoading(true);
        loadData(1);
      }
    } else {
      setActiveFilter({ active: true, country: '' });
    }
  };
  

  const btnChangeStateCity = () => {
    setInputState('')
    setActiveFilter({ active: false, country: '' });
    const newState = !activeFilterCity.active;
    setActiveFilterCity({ active: newState, city: '' });
  
    if (!newState) {
      if (firstCafes.current.length > 1) {
        setRoasters(firstCafes.current);
      } else {
        setLoading(true);
        loadData(1);
      }
      
    }
  };
  

  const renderPaginationButtons = () => {
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
              <a href="#" className="beansMain-pagination-link" onClick={() => handlePageChange(page)}>
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

  return (
    <div className="MainAdmin-roaster-page-con">
      <h1 className="mainAdmin-roasters-main-title">
        Find Cafe {activeFilter.country && <span>on {activeFilter.country}</span>}
      </h1>

      <div className="mainAdmin-roasters-input-btn-con">
        <input
          value={inputState}
          type="text"
          className="main-adminroasters-main-input-search"
          onChange={handleSearchMain}
          placeholder={
            activeFilterCity.active
              ? 'Set a city to filter'
              : activeFilter.active
                ? activeFilter.country
                  ? `Find a cafe in ${activeFilter.country}`
                  : 'Set a country to filter'
                : 'Find cafes in all countries'
          }
        />

        <button
          onClick={btnChangeState}
          className={`mainAdmin-roasters-setFilter ${activeFilter.active ? 'mainAdmin-roasters-setFilterGreen' : ''}`}
        >
          Country
        </button>
        <button
           onClick={btnChangeStateCity}
          className={`mainAdmin-roasters-setFilter ${setActiveFilterCity.active ? 'mainAdmin-roasters-setFilterGreen' : ''}`}
        >
          City
        </button>
      </div>

      {potentialInputValue.length > 0 && (
        <div className="superAdmin-cafes-posibleVarients">
          {potentialInputValue.map((countryy, index) => (
            <div
              key={index}
              className="SuperAdmin-cafes-potentions-options"
              onClick={() => handleChoiceCountry(countryy)}
            >
              {countryy}
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="roaster-con-forLoading">
          <Loader />
        </div>
      ) : roasters.length === 0 ? (
        success && (
          <div className="roasters-notFound-results">
            <p>No results. Please try another search</p>
          </div>
        )
      ) : (
        <>
          <div className="activeRoasters-maincard-for-cards">
            {roasters.map((roaster) => (
              <Link to={`/cafe-info/${roaster.id}`} key={roaster?.placeid}>
                <div className="activeRoasters-card-con">
                  <img
                    src={
                      roaster?.adminData?.photos && Object.values(roaster.adminData.photos).length > 0
                        ? Object.values(roaster.adminData.photos)[0]
                        : noImage
                    }
                    alt="Roaster Logo"
                    className="activeRoasters-card-img"
                  />
                  <div className="activeRoasters-card-name">{roaster.name}</div>
                  <div className="activeRoasters-card-description">
                    {roaster.vicinity}, {roaster.city}, {roaster.country}
                  </div>
                  <div className="activeRoastersAdmin-roaster-actions"></div>
                </div>
              </Link>
            ))}
          </div>
          {!searchActiva && !loading && renderPaginationButtons()}
        </>
      )}
    </div>
  );
};

export default Cafes;
