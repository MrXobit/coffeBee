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
const navigate = useNavigate()
  const handleSearch = debounce(async(e) => {
      try {
        if (!e.target.value.trim()) {
          setRoasters([]);
          setSuccess(false)
          setLoading(false)
          return; 
        }
        const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
        const token = localStorage.getItem('token');
         const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/findRoaster', {
            roasterName: e.target.value,
            cafeId: selectedCafe.id
         }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
         })
         if(Array.isArray(response.data) && response.data.length === 0) {
          setSuccess(true)
          setRoasters([]);
         } else {
          setRoasters(response.data)
          setSuccess(false)
         }
      } catch (error) {
         console.log(error)
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
     <div className='roasters-notFound-results'>
        <p>No results. Please try another search</p>
     </div>
    ) : (
      <div className="roaster-ifArrayEmpty">
      <p>Enter a roastery name , and we'll find the best options for you!</p>
    </div>
    )

  ) : (
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
  
    </div>
  )
}

export default Roasters
