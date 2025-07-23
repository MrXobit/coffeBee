import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../../store/userSlice';
import ChooseSection from '../../ChooseSection/ChooseSection';
import { useNavigate } from 'react-router-dom';
import BurgerMenu from '../../burgerMenu/BurgerMenu';
import admin from '../../../assets/admin.png';
// import Roaster from '../roasters/Roaster';
// import AddCafePage from '../addCafePage/AddCafePage';
// import Cafes from '../cafes/Cafes';
// import Networks from '../networks/Networks';
// import ModerationCafe from '../moderationCafe/ModerationCafe';
// import ModerationBeans from '../moderationBeans/ModerationBeans';
import { useSelector } from 'react-redux';
import { getRoasterData } from '../../../store/roasterSlice';
import Loader from '../../loader/Loader';
import SubLoader from '../../loader/SubLoader';
import MainInfo from './MainInfo/MainInfo';
import BeansRo from '../beans/BeansRo';
import Products from '../Products/Products';

const MainPage = () => {
  const dispatch = useDispatch();
  const { roasterData, isLoading } = useSelector(state => state.roaster);

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


        const roasterId = localStorage.getItem('selectedRoasterId');
        if (!roasterId) {
          navigate('/chooseAccount');
          return null; 
        }

  
      }, [])

      if (isLoading) return <SubLoader />;
  return (
<div className={`main-container-admin ${burger ? 'show' : ''}`}>
  <div className="left-part-admin">
    <div className="cafe-mainInfo-admin1">
      <img onClick={() => navigate('/chooseAccount')} src={roasterData.logo} alt="cafe-logo-admin" className="cafe-logo-admin1" />
      <p onClick={() => navigate('/chooseAccount')}> {roasterData.name}</p>
      <div onClick={handleBurger} className='burger-menu-admin'>
        <BurgerMenu isChecked={burger} />
      </div>      
    </div>
    <div className={`main-left-part-admin ${burger ? 'show' : ''}`}>
      <div className={`navbar-main-admin ${activeTab === 'Main-Info' ? 'active' : ''}`} onClick={() => handleTabChange('Main-Info')}>Main Info </div>
      <div className={`navbar-main-admin ${activeTab === 'BeansRo' ? 'active' : ''}`} onClick={() => handleTabChange('BeansRo')}>Beans</div>
      <div className={`navbar-main-admin ${activeTab === 'Products' ? 'active' : ''}`} onClick={() => handleTabChange('Products')}>Products</div>
    </div>
  </div>
  <div className={`right-part-admin ${burger ? 'blur' : ''}`}>
  
  {isLoading && <SubLoader />}
  
  
  {activeTab === '' && (
  <ChooseSection />
)}

{activeTab === 'Main-Info' && (
  <MainInfo />
)}

{activeTab === 'BeansRo' && (
  <BeansRo />
)}

{activeTab === 'Products' && (
  <Products />
)}











   

  </div>
</div>



  )
}

export default MainPage
