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
import { useLocation } from 'react-router-dom';
const Cafes = () => {
  const location = useLocation();
console.log(location.state?.someValue); 
  function useSessionState(key, defaultValue) {
    const [state, setState] = useState(() => {
      const saved = sessionStorage.getItem(key);
      if (saved !== null) {
        try {
          return JSON.parse(saved);
        } catch {
          return saved;
        }
      }
      return defaultValue;
    });

    useEffect(() => {
      sessionStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);

    return [state, setState];
  }
const mountedRef = useRef(false);
  const [roasters, setRoasters] = useSessionState("roasters", []);
  const [loading, setLoading] = useSessionState("loading", false);
  const [success, setSuccess] = useSessionState("success", false);
  const [count, setCount] = useSessionState("count", 10);
  const [currentPage, setCurrentPage] = useSessionState("currentPage", 1);
  const [totalPages, setTotalPages] = useSessionState("totalPages", 1);
  const [searchActiva, setSearchActive] = useSessionState("searchActiva", false);
  const [activeFilter, setActiveFilter] = useSessionState("activeFilter", { active: false, country: '' });
  const [activeFilterCity, setActiveFilterCity] = useSessionState("activeFilterCity", { active: false, city: '' });
  const [potentialInputValue, setPotentialInputValue] = useSessionState("potentialInputValue", []);
  const [inputState, setInputState] = useSessionState("inputState", '');

  const navigate = useNavigate();
  const controllerRef = useRef(null);
  const firstCafes = useRef([]);
  const skipPaginationEffect = useRef(true);

const MAX_CAFES = 10;

const loadData = async (num) => {
  setSearchActive(false);

  if (num === 2) {
    const cachedRoasters = sessionStorage.getItem('roasters');
    const cachedTotalPages = sessionStorage.getItem('totalPages');

    if (cachedRoasters && cachedTotalPages && cachedRoasters !== "[]" && Number(cachedTotalPages) > 0) {
      const parsed = JSON.parse(cachedRoasters).slice(0, MAX_CAFES);
      setRoasters(parsed);
      setTotalPages(Math.min(Number(cachedTotalPages), 1));
      setLoading(false);
      return;
    }
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Token is not available');

    const response = await axios.post(
      `https://us-central1-coffee-bee.cloudfunctions.net/getAllCoffe?count=${count}&offset=${(currentPage - 1) * count}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const limitedRoasters = response.data.roasters.slice(0, MAX_CAFES); // обмежуємо до 10
    firstCafes.current = limitedRoasters;
    setRoasters(limitedRoasters);
    setTotalPages(Math.ceil(response.data.totalCount / count));

    sessionStorage.setItem('roasters', JSON.stringify(limitedRoasters));
    sessionStorage.setItem('totalPages', Math.ceil(response.data.totalCount / count));
  } catch (e) {
    console.log(e);
  } finally {
    setLoading(false);
  }
};


  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setLoading(true);
    loadData();
  };

const handleSearch = async (e) => {
  setLoading(true)
  const query = e.target.value.trim();
  setInputState(query);
  setSuccess(false);
  setSearchActive(true);

  // не робимо запитів, якщо менше 3 символів


  // якщо інпут порожній — завантажуємо дефолтні дані
  if (query === '') {
    setLoading(true);
    setTimeout(() => {
      loadData();
    }, 500); // трохи швидше, ніж 1с
    return;
  }

  // скасовуємо попередній запит
  if (controllerRef.current) {
    controllerRef.current.abort();
  }
  const controller = new AbortController();
  controllerRef.current = controller;

  setLoading(true);

  try {
    // зберігаємо локально, щоб перевірити після запиту
    const currentQuery = query;

    const res = await axios.post(
      'https://us-central1-coffee-bee.cloudfunctions.net/searchCafes',
      { coffeName: currentQuery, country: activeFilter.country },
      { signal: controller.signal }
    );

    // перевіряємо: користувач міг стерти або змінити інпут
    if (currentQuery !== e.target.value.trim()) return;

    if (Array.isArray(res.data) && res.data.length === 0) {
      setSuccess(true);
      setRoasters([]);
      sessionStorage.setItem('roasters', JSON.stringify([]));
      sessionStorage.setItem('totalPages', '1');
    } else {
      setRoasters(res.data);
      setSuccess(false);
      sessionStorage.setItem('roasters', JSON.stringify(res.data));
      sessionStorage.setItem('totalPages', '1');
    }
  } catch (err) {
    if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
      console.log('🚫 Запит скасовано');
    } else {
      console.error('🔥 ПОМИЛКА:', err.message);
    }
  } finally {
    setLoading(false);
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
        sessionStorage.setItem('roasters', JSON.stringify([]));
        sessionStorage.setItem('totalPages', '1');
      } else {
        setRoasters(response.data);
        setSuccess(false);
        sessionStorage.setItem('roasters', JSON.stringify(response.data));
        sessionStorage.setItem('totalPages', '1');
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
    const value = e.target.value;
    setInputState(value);

    if (value.trim() === '') {
      setLoading(true);
      loadData();
    }

    if (activeFilterCity.active) {
      return searchCafeByCity(e);
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
  }, []);

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

    const cachedRoasters = sessionStorage.getItem(`roasters_${country}`);
    const cachedTotalPages = sessionStorage.getItem(`totalPages_${country}`);

    if (cachedRoasters && cachedTotalPages && cachedRoasters !== "[]" && Number(cachedTotalPages) > 0) {
      setRoasters(JSON.parse(cachedRoasters));
      setTotalPages(Number(cachedTotalPages));
      setLoading(false);
      return;
    }

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
    setInputState('');
    setActiveFilterCity({ active: false, city: '' });
    if (activeFilter.active) {
      setActiveFilter({ active: false, country: '' });
      setLoading(true);
      loadData(1);
    } else {
      setActiveFilter({ active: true, country: '' });
    }
  };

  const btnChangeStateCity = () => {
    setInputState('');
    setActiveFilter({ active: false, country: '' });

    if (activeFilterCity.active) {
      setActiveFilterCity({ active: false, city: '' });
      if (firstCafes.current.length > 1) {
        setRoasters(firstCafes.current);
      } else {
        setLoading(true);
        loadData(1);
      }
    } else {
      setActiveFilterCity({ active: true, city: '' });
    }
  };

const cafesContainerRef = useRef(null);

useEffect(() => {
  const interval = setInterval(() => {
    if (!cafesContainerRef.current) return;

    // беремо всі "кафешки" з контейнера
    const cafeElements = Array.from(cafesContainerRef.current.querySelectorAll('img'));

    // рахуємо, скільки з них без фото (src === noImage)
    const noPhotoCount = cafeElements.filter(img => img.src.includes(noImage)).length;

    if (noPhotoCount >= 10) {
      setLoading(true);
      loadData();
      clearInterval(interval); // зупиняємо інтервал після першого виклику
    }
  }, 100);

  return () => clearInterval(interval);
}, []);



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
          <div className="activeRoasters-maincard-for-cards" ref={cafesContainerRef}>
            {roasters.map((roaster) => (
              <Link to={`/cafe-info/${roaster.id}`} key={roaster?.placeid}>
                <div className="activeRoasters-card-con" onClick={() => console.log(roaster.id)}>
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
