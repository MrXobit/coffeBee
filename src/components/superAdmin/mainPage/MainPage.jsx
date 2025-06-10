import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../../store/userSlice';
import ChooseSection from '../../ChooseSection/ChooseSection';
import { useNavigate } from 'react-router-dom';
import BurgerMenu from '../../burgerMenu/BurgerMenu';
import admin from '../../../assets/admin.png';
import Roaster from '../roasters/Roaster';
import AddCafePage from '../addCafePage/AddCafePage';
import Cafes from '../cafes/Cafes';
import Networks from '../networks/Networks';
import ModerationCafe from '../moderationCafe/ModerationCafe';
import ModerationBeans from '../moderationBeans/ModerationBeans';


const MainPage = () => {
    const dispatch = useDispatch();
const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Cafe Info');
  const [burger, setBurger] = useState(false)

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        localStorage.setItem('activeTab', tab); 
        if (window.innerWidth < 950) {
          setBurger(prev => !prev); 
          console.log("BURGER" + burger)
        }
      };
    
      const handleBurger = () => {
        setBurger(prev => !prev); 
      };

      useEffect(() => {
        const savedTab = localStorage.getItem('activeTab');
        if (savedTab) {
          setActiveTab(savedTab);
        } else {
          setActiveTab('');
        }
      }, [])


  return (
<div className={`main-container-admin ${burger ? 'show' : ''}`}>
  <div className="left-part-admin">
    <div className="cafe-mainInfo-admin">
      <img src={admin} alt="cafe-logo-admin" className="cafe-logo-admin" />
      <p>Admin</p>
      <div onClick={handleBurger} className='burger-menu-admin'>
        <BurgerMenu isChecked={burger} />
      </div>      
    </div>
    <div className={`main-left-part-admin ${burger ? 'show' : ''}`}>
      <div className={`navbar-main-admin ${activeTab === 'roaster' ? 'active' : ''}`} onClick={() => handleTabChange('roaster')}>Roasters</div>
      <div className={`navbar-main-admin ${activeTab === 'add-cafe' ? 'active' : ''}`} onClick={() => handleTabChange('add-cafe')}>Add cafe</div>
      <div className={`navbar-main-admin ${activeTab === 'CAFES' ? 'active' : ''}`} onClick={() => handleTabChange('CAFES')}>cafe</div>
      <div className={`navbar-main-admin ${activeTab === 'Network' ? 'active' : ''}`} onClick={() => handleTabChange('Network')}>Networks</div>
      <div className={`navbar-main-admin ${activeTab === 'ModerationCafe' ? 'active' : ''}`} onClick={() => handleTabChange('ModerationCafe')}>Moderation Cafe</div>
       <div className={`navbar-main-admin ${activeTab === 'ModerationBeans' ? 'active' : ''}`} onClick={() => handleTabChange('ModerationBeans')}>Moderation Beans</div>
      <div className="navbar-main-admin logout-main-admin-btn" onClick={() => dispatch(logoutUser())}>Logout</div>
    </div>
  </div>
  <div className={`right-part-admin ${burger ? 'blur' : ''}`}>
    {activeTab === '' && (
      <ChooseSection />
    )}


       {activeTab === 'ModerationBeans' && (
      <ModerationBeans />
    )}

    

{activeTab === 'Network' && (
      <Networks />
    )}

{activeTab === 'ModerationCafe' && (
      <ModerationCafe />
    )}


{activeTab === 'CAFES' && (
      <Cafes />
    )}

{activeTab === 'add-cafe' && (
      <AddCafePage />
    )}

{activeTab === 'roaster' && (
      <Roaster />
    )}
  </div>
</div>



  )
}

export default MainPage
