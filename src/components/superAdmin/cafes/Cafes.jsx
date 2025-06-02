import React, { useEffect, useState } from 'react';
import './Cafes.css'
import bluePlus from '../../../assets/blue-plus.png';
import { Link, useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce'; 
import axios from 'axios';
import Loader from '../../loader/Loader';
import { db, storage } from '../../../firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { deleteObject, listAll, ref } from 'firebase/storage';
// стилі взяв з roasters.css

const Cafes = () => {
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
          `https://us-central1-coffee-bee.cloudfunctions.net/getAllCoffe?count=${count}&offset=${(currentPage - 1) * count}`,
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
  
  
  
    const handleSearch = debounce(async (e) => {
  
      setSuccess(false);
      setRoasters([])
      setSearchActive(true)
      if (!e.target.value.trim()) {
  
        loadData();
        return;
      }
      try {
      
  
        const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/getCoffeByInput', {
            coffeName: e.target.value,
        });
        
        if (Array.isArray(response.data) && response.data.length === 0) {
          setSuccess(true);
          setRoasters([]);
        } else {
          setRoasters(response.data);
          setSuccess(false);
        }
      } catch (error) {
        console.log(error.response.data)
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
  
        <h1 className="mainAdmin-roasters-main-title">Find Cafe</h1>
  
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
   <Link to={`/cafe-info/${roaster.id}`}>
   <div key={roaster?.placeid} className="activeRoasters-card-con">
     <img
      src={Object.values(roaster.adminData.photos)[0]}
       alt="Roaster Logo"
       className="activeRoasters-card-img"
     />
     <div className="activeRoasters-card-name">{roaster.name}</div>
     <div className="activeRoasters-card-description">
       {roaster.vicinity}
     </div>
     <div className="activeRoastersAdmin-roaster-actions">
    
     </div>
   </div>
 </Link>
 
       
      ))}
    </div>
   {!searchActiva && !loading && renderPaginationButtons()}
  
    </>
  
  
  )}
  
  
      </div>
    );
  }
  
  export default Cafes;

