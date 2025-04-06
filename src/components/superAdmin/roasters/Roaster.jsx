import React, { useState } from 'react'
import './Roaster.css';
import bluePlus from '../../../assets/blue-plus.png';
import { Link } from 'react-router-dom';
import debounce from 'lodash.debounce'; 
import axios from 'axios';
import { useSelector } from 'react-redux';
import Loader from '../../loader/Loader';


const Roaster = () => {
  const { uid } = useSelector((state) => state.user);
  const [roasters, setRoasters] = useState([])
const [laoding, setLoading] = useState(false)
const [success, setSuccess] = useState(false)

  const handleSearch = debounce(async(e) => {
    try {
      if (!e.target.value.trim()) {
        setRoasters([]);
        setSuccess(false)
        setLoading(false)
        return; 
      }
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
    }finally {
      setLoading(false)
    }
},500)

const handleSearchMain = (e) => {
  setLoading(true)
  handleSearch(e)
}


return (
  <div className='MainAdmin-roaster-page-con'>
    <h1 className="MainAdmin-roaster-page-mainTitle">
      Roaster page
    </h1>

    <Link to="/add-coffee-bean" className="roasterMainAdmin-add-new-cafe-pass-con">
      <div className="block-for-cafe-pass-img-pluss">
        <img src={bluePlus} alt="plus-icon" />
      </div>
      <p className="roasterMainAdmin-p-just-text">Add New Coffee Bean</p>
    </Link>

    <h1 className="mainAdmin-roasters-main-title">
      Find Coffee Roastery
    </h1>

    <input 
      type="text" 
      className="main-adminroasters-main-input-search" 
      onChange={handleSearchMain} 
      placeholder='Search for roasters' 
    />
{laoding ? (

  <div className='roaster-con-forLoading'>
          <Loader />
        </div>
) : roasters.length === 0 ? (
  success ? (
    <div className="roasters-notFound-results">
      <p>No results. Please try another search</p>
    </div>
  ) : (
    <div className="roaster-ifArrayEmpty">
      <p>Enter a roastery name, and we'll find the best options for you!</p>
    </div>
  )
) : (
  <div className="activeRoasters-maincard-for-cards">
    {roasters.map((roaster) => (
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
      </div>
    ))}
  </div>
)}

  </div>
);
}

export default Roaster




