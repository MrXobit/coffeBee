import React, { useEffect, useState, useRef } from 'react';
import './Roaster.css';
import bluePlus from '../../../assets/blue-plus.png';
import { Link, useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';
import axios from 'axios';
import Loader from '../../loader/Loader';
import { db, storage } from '../../../firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { deleteObject, listAll, ref } from 'firebase/storage';
import { countrysArray } from '../cafes/country';
import defoultImg from '../../../assets/noImage.jpeg'


const STORAGE_KEY = 'roasterState';

const Roaster = () => {
  const navigate = useNavigate();
  const firstRoasters = useRef([]);
  const mountedRef = useRef(false);
  const controllerRef = useRef(null);
  const controllerCityRef = useRef(null);

  // --- useSessionState як у Cafes
  function useSessionState(key, defaultValue) {
    const [state, setState] = useState(() => {
      const saved = sessionStorage.getItem(key);
      if (saved !== null) {
        try { return JSON.parse(saved); } 
        catch { return saved; }
      }
      return defaultValue;
    });

    useEffect(() => {
      sessionStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);

    return [state, setState];
  }

  const [roasters, setRoasters] = useSessionState('roasters', []);
  const [loading, setLoading] = useSessionState('loading', false);
  const [success, setSuccess] = useSessionState('success', false);
  const [count, setCount] = useSessionState('count', 10);
  const [currentPage, setCurrentPage] = useSessionState('currentPage', 1);
  const [totalPages, setTotalPages] = useSessionState('totalPages', 1);
  const [searchActive, setSearchActive] = useSessionState('searchActive', false);
  const [activeFilter, setActiveFilter] = useSessionState('activeFilter', { active: false, country: '' });
  const [activeFilterCity, setActiveFilterCity] = useSessionState('activeFilterCity', { active: false, city: '' });
  const [potentialInputValue, setPotentialInputValue] = useSessionState('potentialInputValue', []);
  const [inputState, setInputState] = useSessionState('inputState', '');

  // --- Логування
  const logRoasters = (context, data) => console.log(`[${context}] roasters updated:`, data);

  // --- loadData повністю як у Cafes
  const loadData = async (num) => {
    setSearchActive(false);

    if (num === 2) {
      const cachedRoasters = sessionStorage.getItem('roasters');
      const cachedTotalPages = sessionStorage.getItem('totalPages');

      if (cachedRoasters && cachedTotalPages && cachedRoasters !== "[]" && Number(cachedTotalPages) > 0) {
        setRoasters(JSON.parse(cachedRoasters));
        setTotalPages(Number(cachedTotalPages));
        setLoading(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token is not available');

      const response = await axios.post(
        `https://us-central1-coffee-bee.cloudfunctions.net/getAllRoasters?count=${count}&offset=${(currentPage - 1) * count}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      firstRoasters.current = response.data.roasters;
      setRoasters(response.data.roasters);
      setTotalPages(Math.ceil(response.data.totalCount / count));

      sessionStorage.setItem('roasters', JSON.stringify(response.data.roasters));
      sessionStorage.setItem('totalPages', Math.ceil(response.data.totalCount / count));
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  // --- Pagination
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setLoading(true);
    loadData();
  };

  // --- Debounce search
const handleSearch = debounce(async (e) => {
  setLoading(true)
  const value = e.target.value.trim();
  setInputState(value);
  setSuccess(false);
  setRoasters([]);
  setSearchActive(true);

  // Якщо активний фільтр по країні і value порожнє, нічого не робимо
  if (activeFilter.active && activeFilter.country.trim() !== '' && value === '') return;

  // Повернення до початкових ростерів
  if (!value) {
    if (firstRoasters.current.length > 0) {
      setRoasters(firstRoasters.current);
      logRoasters('handleSearch - restored initial roasters', firstRoasters.current);
      setLoading(false);
      sessionStorage.setItem('roasters', JSON.stringify(firstRoasters.current));
      sessionStorage.setItem('totalPages', '1');
    } else {
      setLoading(true);
      await loadData();
    }
    return;
  }

  // Скасування попереднього запиту
  if (controllerRef.current) controllerRef.current.abort();
  const controller = new AbortController();
  controllerRef.current = controller;

  setLoading(true);

  try {
    let response;

    if (activeFilter.country && activeFilter.country.trim() !== '') {
      // Пошук по країні
      response = await axios.post(
        'https://us-central1-coffee-bee.cloudfunctions.net/searchRoasteries',
        { roasteryName: value, country: activeFilter.country || '' },
        { signal: controller.signal }
      );
    } else {
      // Пошук по всіх ростеріях
      response = await axios.post(
        'https://us-central1-coffee-bee.cloudfunctions.net/getRoasterByInput',
        { roasterName: value, country: '' },
        { signal: controller.signal }
      );
    }

    if (Array.isArray(response.data) && response.data.length === 0) {
      setSuccess(true);
      setRoasters([]);
      sessionStorage.setItem('roasters', JSON.stringify([]));
      sessionStorage.setItem('totalPages', '1');
      logRoasters('handleSearch - no results found', []);
    } else {
      setRoasters(response.data);
      setSuccess(false);
      sessionStorage.setItem('roasters', JSON.stringify(response.data));
      sessionStorage.setItem('totalPages', '1');
      logRoasters('handleSearch - search results', response.data);
    }

  } catch (err) {
    if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
      console.log('🚫 Запит було скасовано');
    } else {
      console.error('🔥 handleSearch error:', err.message);
    }
  } finally {
    setLoading(false);
  }
}, 500);


  // --- Initial load effect, як у Cafes
  useEffect(() => {
    setLoading(true);
    loadData(2);
  }, []);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages]);



  // --- Pagination

const loadRoastersByCountry = async (country) => {
  setLoading(true);
  setRoasters([]);
  logRoasters('loadRoastersByCountry - cleared before fetch', []);
  setLoading(true);
  setSearchActive(false);

  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Token is not available');

    const response = await axios.post(
      'https://us-central1-coffee-bee.cloudfunctions.net/searchRoasteries',
      { roasteryName: '', country },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setRoasters(response.data);
    logRoasters('loadRoastersByCountry - fetched by country', response.data);
    setSuccess(response.data.length === 0);

    // Зберігаємо в sessionStorage для кешу
    sessionStorage.setItem(`roasters_${country}`, JSON.stringify(response.data));
    sessionStorage.setItem(`totalPages_${country}`, '1');
  } catch (err) {
    console.error('Помилка завантаження ростерів по країні:', err);
  } finally {
    setLoading(false);
  }
};

// --- Search main (для input)
const handleSearchMain = async (e) => {
 
  const value = e.target.value.trim();
  setInputState(value);
  setSuccess(false);
  setSearchActive(true);

  if (activeFilter.active && activeFilter.country.trim() !== '') {
    if (!value) {
      setRoasters([]);
      
      await loadRoastersByCountry(activeFilter.country);
      setLoading(false);
      return;
    }
  }

  if (activeFilter.active && activeFilter.country.trim() === '') {
    const maxSuggestions = 5;
    const countrys = [];

    if (!value) {
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

  handleSearch(e);
};

// --- Кнопка зміни state фільтра по країні
const btnChangeState = () => {
  setInputState('');
  if (activeFilter.active) {
    setActiveFilter({ active: false, country: '' });
    if (firstRoasters.current.length > 0) {
      setRoasters(firstRoasters.current);
      logRoasters('btnChangeState - restored initial roasters', firstRoasters.current);
      setLoading(false);
    } else {
      setLoading(true);
      loadData(1);
    }
  } else {
    setActiveFilter({ active: true, country: '' });
  }
};

// --- Вибір країни із підказок
const handleChoiceCountry = (country) => {
  setPotentialInputValue([]);
  setActiveFilter({ active: true, country });
  setInputState('');
  loadRoastersByCountry(country);
};

// --- Edit roaster
const handleEdit = (roaster) => {
  navigate('/edit-roaster', { state: { roasterData: roaster } });
};

// --- Delete roaster
const handleDelete = async (roasterId) => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      'https://us-central1-coffee-bee.cloudfunctions.net/validAccesAdmin',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.access) {
      try {
        const roasterRef = doc(db, 'roasters', roasterId);
        await deleteDoc(roasterRef);

        const logoRef = ref(storage, `roasters/${roasterId}/`);
        const fileList = await listAll(logoRef);
        const logoFiles = fileList.items.filter(item => item.name.startsWith('logo'));
        if (logoFiles.length > 0) await deleteObject(logoFiles[0]);
      } catch (err) {
        console.error('Помилка при видаленні обжарщика та логотипа:', err);
      }
    } else {
      console.error('Немає доступу до цієї операції');
    }

    setRoasters(prev => {
      const updated = prev.filter(r => r.id !== roasterId);
      logRoasters('handleDelete', updated);
      return updated;
    });
  } catch (e) {
    console.log(e);
  } finally {
    setLoading(false);
  }
};

// --- Render pagination buttons
const renderPaginationButtons = () => {
  if (searchActive || (activeFilter.active && activeFilter.country)) return null;

  const pages = [];
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);

  if (totalPages > 5) {
    if (currentPage <= 3) endPage = 5;
    else if (currentPage >= totalPages - 2) startPage = totalPages - 4;
  }

  for (let i = startPage; i <= endPage; i++) pages.push(i);

  return (
    <div className="beansMain-pagination-container">
      <ul className="beansMain-pagination-list">
        <li className="beansMain-pagination-item">
          <button
            className="beansMain-pagination-link"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>
        </li>
        {pages.map(page => (
          <li key={page} className={`beansMain-pagination-item ${currentPage === page ? 'beansMain-pagination-item-active' : ''}`}>
            <button
              className="beansMain-pagination-link"
              onClick={() => handlePageChange(page)}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          </li>
        ))}
        <li className="beansMain-pagination-item">
          <button
            className="beansMain-pagination-link"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </li>
      </ul>
    </div>
  );
};

const roastersContainerRef = useRef(null);

useEffect(() => {
  const interval = setInterval(() => {
    if (!roasters || roasters.length === 0) return;

    // рахуємо кількість ростерів без логотипу або з дефолтним
    const defaultLogoCount = roasters.filter(r => !r.logo || r.logo === defoultImg).length;

    if (defaultLogoCount >= 10) {
      setLoading(true);
      loadData();
      clearInterval(interval); // зупиняємо інтервал після першого виклику
    }
  }, 100);

  return () => clearInterval(interval); // чистимо інтервал при демонтажі
}, [roasters]);



  return (
    <div className="MainAdmin-roaster-page-con">
    
      <h1 className="MainAdmin-roaster-page-mainTitle">Roaster page</h1>

      <Link to="/add-new-roaster" className="roasterMainAdmin-add-new-cafe-pass-con">
        <div className="block-for-cafe-pass-img-pluss">
          <img src={bluePlus} alt="plus-icon" />
        </div>
        <p className="roasterMainAdmin-p-just-text">Add New Roaster</p>
      </Link>

      <h1 className="mainAdmin-roasters-main-title">
        Find Coffee Roastery {activeFilter.country && <span>in {activeFilter.country}</span>}
      </h1>

      <div className="mainAdmin-roasters-input-btn-con">
        <input
          value={inputState}
          type="text"
          className="main-adminroasters-main-input-search"
          onChange={handleSearchMain}
          placeholder={
            activeFilter.active
              ? activeFilter.country
                ? `Find a roastery in ${activeFilter.country}`
                : 'Set a country to filter'
              : 'Find roasteries in all countries'
          }
        />
        <button
          onClick={btnChangeState}
          className={`mainAdmin-roasters-setFilter ${activeFilter.active ? 'mainAdmin-roasters-setFilterGreen' : ''}`}
        >
          Country
        </button>
      </div>

      {potentialInputValue.length > 0 && (
        <div className="superAdmin-cafes-posibleVarients">
          {potentialInputValue.map((country, index) => (
            <div
              key={index}
              className="SuperAdmin-cafes-potentions-options"
              onClick={() => handleChoiceCountry(country)}
            >
              {country}
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
     <div className="activeRoasters-maincard-for-cards" ref={roastersContainerRef}>
  {roasters.map((roaster) => (
    <div key={roaster.id} className="activeRoasters-card-con">
      <Link to={`/roaster-info/${roaster.id}`}>
        <img 
          src={roaster.logo || defoultImg} 
          alt="Roaster Logo" 
          className="activeRoasters-card-img" 
        />
      </Link>
      <div className="activeRoasters-card-name">{roaster.name}</div>
      <div className="activeRoasters-card-description">{roaster.description}</div>
      <div className="activeRoastersAdmin-roaster-actions">
        <button onClick={() => handleEdit(roaster)} className="activeRoastersAdmin-btn-edit-roaster">Edit</button>
        <button onClick={() => handleDelete(roaster.id)} className="activeRoastersAdmin-btn-delete-roaster">Delete</button>
      </div>
    </div>
  ))}
</div>

          {!searchActive && !loading && renderPaginationButtons()}
        </>
      )}
    </div>
  );
};

export default Roaster;
