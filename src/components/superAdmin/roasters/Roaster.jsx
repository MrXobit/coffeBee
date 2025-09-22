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


const STORAGE_KEY = 'roasterPageState';

const Roaster = () => {
  const navigate = useNavigate();
  const firstRoasters = useRef([]);
  const mountedRef = useRef(false); // <-- флаг першого mount

  // Ініціалізація станів з sessionStorage
  const [roasters, setRoasters] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).roasters : [];
  });
  const [inputState, setInputState] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).inputState : '';
  });
  const [activeFilter, setActiveFilter] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).activeFilter : { active: false, country: '' };
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).currentPage : 1;
  });
  const [count, setCount] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).count : 10;
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [potentialInputValue, setPotentialInputValue] = useState([]);

  const [totalPages, setTotalPages] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).totalPages || 1 : 1;
  });

  // Логування
  const logRoasters = (context, data) => {
    console.log(`[${context}] roasters updated:`, data);
  };

  // Збереження стану в sessionStorage при будь-якій зміні
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      roasters,
      inputState,
      activeFilter,
      currentPage,
      count,
      totalPages
    }));
  }, [roasters, inputState, activeFilter, currentPage, count, totalPages]);

  // Завантаження ростерів
  const loadData = async () => {
    setSearchActive(false);
    setLoading(true);
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
      logRoasters('loadData', response.data.roasters);
      setTotalPages(Math.max(1, Math.ceil(response.data.totalCount / count)));
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  // ---- ОНОВЛЕНИЙ useEffect: лише на mount перевіряємо sessionStorage і ВСЕ,
  // але при подальших змінах currentPage/count завжди викликаємо loadData()
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);

    // Перший mount: відновлюємо стан із sessionStorage якщо там є дані для тієї ж сторінки
    if (!mountedRef.current) {
      mountedRef.current = true;

      if (saved) {
        try {
          const parsed = JSON.parse(saved);

          // Якщо у сховищі є ростери і вони відповідають потрібній сторінці — відновлюємо і не фетчимо
          if (Array.isArray(parsed.roasters) && parsed.roasters.length > 0 && parsed.currentPage === currentPage) {
            firstRoasters.current = parsed.roasters;
            setRoasters(parsed.roasters);
            setInputState(parsed.inputState || '');
            setActiveFilter(parsed.activeFilter || { active: false, country: '' });
            setCount(parsed.count || 10);
            setTotalPages(parsed.totalPages || 1);
            setSearchActive(false);
            setSuccess(false);
            setLoading(false);
            return; // skip initial load
          }
        } catch (err) {
          console.warn('Failed to parse saved state', err);
        }
      }
    }

    // Якщо не mount або якщо дані в сховищі не підходять — вантажимо
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, count]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages]);

  // Pagination
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    // Якщо натиснули ту ж саму сторінку — нічого не робимо
    if (page === currentPage) return;
    setCurrentPage(page);
    // Після setCurrentPage наш ефект вище викличе loadData()
  };

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
          {pages.map((page) => (
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

  // Delete
  const handleDelete = async (roasterId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/validAccesAdmin', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.access) {
        try {
          const roasterRef = doc(db, 'roasters', roasterId);
          await deleteDoc(roasterRef);

          const logoRef = ref(storage, `roasters/${roasterId}/`);
          const fileList = await listAll(logoRef);
          const logoFiles = fileList.items.filter(item => item.name.startsWith('logo'));

          if (logoFiles.length > 0) await deleteObject(logoFiles[0]);
        } catch (error) {
          console.error('Помилка при видаленні обжарщика та логотипа:', error);
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

  // Edit
  const handleEdit = (roaster) => {
    navigate('/edit-roaster', { state: { roasterData: roaster } });
  };

  // Search
  const handleSearch = debounce(async (e) => {
    const value = e.target.value.trim();
    if (activeFilter.active && activeFilter.country.trim() !== '' && value === '') return;

    setSuccess(false);
    setRoasters([]);
    logRoasters('handleSearch - cleared before search', []);
    setSearchActive(true);

    if (!value) {
      if (firstRoasters.current.length > 0) {
        setRoasters(firstRoasters.current);
        logRoasters('handleSearch - restored initial roasters', firstRoasters.current);
        setLoading(false);
      } else {
        loadData();
      }
      return;
    }

    setLoading(true);

    try {
      let response;
      if (activeFilter.country && activeFilter.country.trim() !== '') {
        response = await axios.post(
          'https://us-central1-coffee-bee.cloudfunctions.net/searchRoasteries',
          { roasteryName: value, country: activeFilter.country }
        );
      } else {
        response = await axios.post(
          'https://us-central1-coffee-bee.cloudfunctions.net/getRoasterByInput',
          { roasterName: value, country: '' }
        );
      }

      if (Array.isArray(response.data) && response.data.length === 0) {
        setSuccess(true);
        setRoasters([]);
        logRoasters('handleSearch - no results found', []);
      } else {
        setRoasters(response.data);
        logRoasters('handleSearch - search results', response.data);
        setSuccess(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, 500);

  const loadRoastersByCountry = async (country) => {
    setRoasters([]);
    logRoasters('loadRoastersByCountry - cleared before fetch', []);
    setLoading(true);
    setSearchActive(false);

    try {
      const response = await axios.post(
        'https://us-central1-coffee-bee.cloudfunctions.net/searchRoasteries',
        { roasteryName: '', country }
      );

      setRoasters(response.data);
      logRoasters('loadRoastersByCountry - fetched by country', response.data);
      setSuccess(response.data.length === 0);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchMain = async (e) => {
    const value = e.target.value;
    setInputState(value);

    if (activeFilter.active && activeFilter.country.trim() !== '') {
      if (value.trim() === '') {
        setRoasters([]);
        logRoasters('handleSearchMain - cleared before country fetch', []);
        setLoading(true);
        await loadRoastersByCountry(activeFilter.country);
        setLoading(false);
        return;
      }
    } else if (activeFilter.active && activeFilter.country.trim() === '') {
      const maxSuggestions = 5;
      const countrys = [];

      if (value.trim() === '') {
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

  const handleChoiceCountry = (country) => {
    setPotentialInputValue([]);
    setActiveFilter({ active: true, country });
    setInputState('');
    loadRoastersByCountry(country);
  };

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
        loadData();
      }
    } else {
      setActiveFilter({ active: true, country: '' });
    }
  };

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
          <div className="activeRoasters-maincard-for-cards">
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
