import React, { useEffect, useState } from 'react';
import './Roaster.css';
import bluePlus from '../../../assets/blue-plus.png';
import { Link, useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce'; 
import axios from 'axios';
import Loader from '../../loader/Loader';
import { db, storage } from '../../../firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { deleteObject, listAll, ref } from 'firebase/storage';

const Roaster = () => {
  const [roasters, setRoasters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [count, setCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1); 
  const [totalPages, setTotalPages] = useState(1); 
  const [searchActiva, setSearchActive] = useState(false)
  const navigate = useNavigate()
  const loadData = async () => {
  
    setSearchActive(false)
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token is not available');
      }
       const response = await axios.post(
        `https://us-central1-coffee-bee.cloudfunctions.net/getAllRoasters?count=${count}&offset=${(currentPage - 1) * count}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      

      setRoasters(response.data.roasters); 
      setTotalPages(Math.ceil(response.data.totalCount / count)); 
    } catch (e) {
      console.log(e)
    } finally {
        setLoading(false);
    }
  };

  
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return; 
    setCurrentPage(page);
  };


  const handleDelete = async (roasterId) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/validAccesAdmin', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      if (response.data.access) {
        try {
          const roasterRef = doc(db, 'roasters', roasterId);
          await deleteDoc(roasterRef);
  
          const logoRef = ref(storage, `roasters/${roasterId}/`);
          const fileList = await listAll(logoRef);
          const logoFiles = fileList.items.filter(item => item.name.startsWith('logo'));
  
          if (logoFiles.length > 0) {
            const firstLogoFile = logoFiles[0];
            await deleteObject(firstLogoFile);
          }
        } catch (error) {
          console.error('Помилка під час видалення обжарщика та картинки:', error);
        }
      } else {
        console.error('Немає доступу до цієї операції');
      }
      setRoasters(prev => prev.filter(roaster => roaster.id !== roasterId));
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false)
    }
  }
  
 
  
const handleEdit = (roaster) => {
  navigate("/edit-roaster", { 
    state: { 
      roasterData: roaster, 
    } 
  });
}

  const handleSearch = debounce(async (e) => {

    setSuccess(false);
    setRoasters([])
    setSearchActive(true)
    if (!e.target.value.trim()) {

      loadData();
      return;
    }
    try {
    

      const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/getRoasterByInput', {
        roasterName: e.target.value,
      });
      
      if (Array.isArray(response.data) && response.data.length === 0) {
        setSuccess(true);
        setRoasters([]);
      } else {
        setRoasters(response.data);
        setSuccess(false);
        renderPaginationButtons(response.data.length)
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, 500);

  const handleSearchMain = (e) => {
    setLoading(true);
    handleSearch(e);
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

  const renderPaginationButtons = (searchleangth) => {
    if(searchleangth) {
      
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

  return (
    <div className='MainAdmin-roaster-page-con'>
      <h1 className="MainAdmin-roaster-page-mainTitle">Roaster page</h1>

      <Link to="/add-new-roaster" className="roasterMainAdmin-add-new-cafe-pass-con">
        <div className="block-for-cafe-pass-img-pluss">
          <img src={bluePlus} alt="plus-icon" />
        </div>
        <p className="roasterMainAdmin-p-just-text">Add New Roaster</p>
      </Link>

      <h1 className="mainAdmin-roasters-main-title">Find Coffee Roastery</h1>

      <input
        type="text"
        className="main-adminroasters-main-input-search"
        onChange={handleSearchMain}
        placeholder='Search for roasters'
      />

{loading ? (
  <div className='roaster-con-forLoading'>
    <Loader />
  </div>
) : roasters.length === 0 ? (
  success ? (
    <div className="roasters-notFound-results">
      <p>No results. Please try another search</p>
    </div>
  ) : null
) : (
  <>
    <div className="activeRoasters-maincard-for-cards">
    {roasters.map((roaster, index) => (
      <div key={roaster.id} className="activeRoasters-card-con">
        <img
          src={roaster.logo}
          alt="Roaster Logo"
          className="activeRoasters-card-img"
        />
        <div className="activeRoasters-card-name">{roaster.name}</div>
        <div className="activeRoasters-card-description">
          {roaster.description}
        </div>
        <div className="activeRoastersAdmin-roaster-actions">
            
<button onClick={() => handleEdit(roaster)} className="activeRoastersAdmin-btn-edit-roaster">Edit</button>

<button onClick={() => handleDelete(roaster.id)} className="activeRoastersAdmin-btn-delete-roaster">Delete</button>
</div>

      </div>
    ))}
  </div>
 {!searchActiva && !loading && renderPaginationButtons()}

  </>


)}


    </div>
  );
}

export default Roaster;


