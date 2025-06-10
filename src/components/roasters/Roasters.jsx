import React, { useEffect, useState } from 'react'
import bluePlus from '../../assets/blue-plus.png';
import './Roasters.css';
import Loader from '../loader/Loader';
import axios from 'axios';
import debounce from 'lodash.debounce'; 
import { useNavigate } from 'react-router-dom';
import ToggleSwitch from '../toggleSwitch/ToggleSwitch';
import ActiveRoasteries from './activeRoasteries/ActiveRoasteries';


const Roasters = () => {
const [roasters, setRoasters] = useState([])
const [laoding, setLoading] = useState(false)
const [success, setSuccess] = useState(false)
const [toggleValue, setToggleValue] = useState(true)
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

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [currentPage, count]);


  const handleSearch = debounce(async(e) => {
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
         })
         if(Array.isArray(response.data) && response.data.length === 0) {
          setSuccess(true)
          setRoasters([]);
         } else {
          setRoasters(response.data)
          setSuccess(false)
         }
      } catch (error) {
         console.log(error.response.data)
      }finally {
        setLoading(false)
      }
  },500)

  const handleSearchMain = (e) => {
    setLoading(true)
    handleSearch(e)
  }

  const handleDetails = (roaster) => {
     navigate(`/roaster/${roaster.id}`, { 
      state: { 
        roaster: roaster, 
      } 
    })
  }

  useEffect(() => {
    const storedValue = JSON.parse(localStorage.getItem('roasterPage'));
    if(storedValue !== null) {
      setToggleValue(storedValue)
    }
  })

  const handleToggle = (isAllBeans) => {
    setToggleValue(isAllBeans);
    localStorage.setItem('roasterPage', JSON.stringify(isAllBeans))
  };





  
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
    <div className='roster-main-con-class-supermain'>
             <div className='beans-main-togl-btn'>
    <ToggleSwitch toggleValue={toggleValue} onToggle={handleToggle} words={['Roasteries', 'Active']} />
</div>

      {toggleValue ? (
<div>
<h1 className="roasters-main-title">
        Find Coffee Roastery
        </h1>
      <input type="text" className="roasters-main-input-search" onChange={handleSearchMain} placeholder='Search for roasters'/>

      {laoding ? (
        <div className='roaster-con-forLoading'>
          <Loader />
        </div>
) : (
  roasters.length === 0 ? (
    success ? (
      <div className="roasters-notFound-results">
        <p>No results. Please try another search</p>
      </div>
    ) : null
  ) 
 : (
<div className="activeRoasters-maincard-for-cards">
  {roasters.map((roaster) => 
    <div key={roaster.id} className="activeRoasters-card-con" onClick={() => handleDetails(roaster)}>
      <img src={roaster.logo} alt="Roaster Logo" className="activeRoasters-card-img" />
      <div className="activeRoasters-card-name">{roaster.name}</div>
      <div className="activeRoasters-card-description">
        {roaster.description}
      </div>
    </div>
  )}
</div>

  )
)}

</div>
      ) : (
        <ActiveRoasteries/>
      )}
   {!searchActiva && !laoding && renderPaginationButtons()}

    </div>
  )
}

export default Roasters
