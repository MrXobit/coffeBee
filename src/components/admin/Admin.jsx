import React, { useEffect, useState } from 'react';
import './Admin.css';
import { useNavigate } from 'react-router-dom';
import CafeInfo from '../cafeInfo/CafeInfo';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/userSlice';
import ChooseSection from '../ChooseSection/ChooseSection';
import CafePass from '../cafePass/CafePass';
import BurgerMenu from '../burgerMenu/BurgerMenu';
import Paymant from '../paymant/Paymant';
import BeansMain from '../beansMain/BeansMain';
import Roasters from '../roasters/Roasters';
import CoffeeNetwork from '../CoffeeNetwork/CoffeeNetwork';

const Admin = () => {
  const dispatch = useDispatch();
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Cafe Info');
  const [burger, setBurger] = useState(false)
  useEffect(() => {
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
      setActiveTab(savedTab);
    } else {
      setActiveTab('');
    }
    const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));

    if (selectedCafe) {
      setData(selectedCafe);
    } else {
      setData(null);
    }
  }, []);

  if (!data) {
    navigate('/chooseAccount')
    return null; 
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('activeTab', tab); 
    if (window.innerWidth < 950) {
      setBurger(prev => !prev); 
    }
  };

  const handleBurger = () => {
    setBurger(prev => !prev); 
  };


  return (
    <div  className={`main-container-admin ${burger ? 'show' : ''}`}>
      <div className="left-part-admin">
        <div className="cafe-mainInfo-admin">
          <img onClick={() => navigate('/chooseAccount')} src={Object.values(data.adminData.photos)[0]} alt="cafe-logo-admin" className="cafe-logo-admin" />
          <p onClick={() => navigate('/chooseAccount')}>{data.name}</p>
          <div onClick={handleBurger} className='burger-menu-admin'>
            <BurgerMenu isChecked={burger}/>
          </div>      
        </div>
        <div  className={`main-left-part-admin ${burger ? 'show' : ''}`}>
        <div  className={`navbar-main-admin ${activeTab === 'Cafe Info' ? 'active' : ''}`}  onClick={() => handleTabChange('Cafe Info')}>Cafe Info</div>
          <div className={`navbar-main-admin ${activeTab === 'Coffee Passes' ? 'active' : ''}`} onClick={() => handleTabChange('Coffee Passes')}>Coffee Passes</div>
          <div className={`navbar-main-admin ${activeTab === 'Payment Details' ? 'active' : ''}`} onClick={() => handleTabChange('Payment Details')}>Payment Details</div>
          <div className={`navbar-main-admin ${activeTab === 'Beans' ? 'active' : ''}`} onClick={() => handleTabChange('Beans')}>Coffee Beans</div>
          <div className={`navbar-main-admin ${activeTab === 'Roasters' ? 'active' : ''}`} onClick={() => handleTabChange('Roasters')}>Roasters</div>
          <div className={`navbar-main-admin ${activeTab === 'Coffee Network' ? 'active' : ''}`} onClick={() => handleTabChange('Coffee Network')}>Coffee Network</div>
          <div className="navbar-main-admin logout-main-admin-btn" onClick={() => dispatch(logoutUser())}>Logout</div>
        </div>
      </div>
      <div className={`right-part-admin ${burger ? 'blur' : ''}`}>
      {activeTab === 'Cafe Info' && (
    <CafeInfo/>
  )}

{activeTab === '' && (
    <ChooseSection/>
  )}

{activeTab === 'Coffee Network' && (
    <CoffeeNetwork/>
  )}

{activeTab === 'Beans' && (
    <BeansMain/>
  )}

{activeTab === 'Roasters' && (
    <Roasters/>
  )}

    {activeTab === 'Payment Details' && (
      <Paymant data={data}/>
    )}
  

{activeTab === 'Coffee Passes' && (
    <CafePass cafeId={data.id}/>
  )}  
      </div>
    </div>
  );
};

export default Admin;
