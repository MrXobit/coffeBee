import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';

import Loader from '../loader/Loader';
import { logoutUser, setIsAuth, setPrivileges } from '../../store/userSlice';
import { getRoasterData } from '../../store/roasterSlice';

import './ChooseAccount.css';

const ChooseAccount = () => {
  const { email } = useSelector((state) => state.user);
  const [cafes, setCafes] = useState([]);
  const [roasters, setRoasters] = useState([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) return;

    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const accessRef = doc(db, 'accessAdmin', email);
        const accessSnap = await getDoc(accessRef);

        if (!accessSnap.exists()) return;

        const accessData = accessSnap.data();
        const allowedCafeIds = accessData.allowedCafeIds || [];
        const allowedRoastersIds = accessData.allowedRoastersIds || [];

        if (Array.isArray(allowedCafeIds) && allowedCafeIds.length > 0) {
          const cafePromises = allowedCafeIds.map(async (cafeId) => {
            const cafeRef = doc(db, 'cafe', cafeId);
            const cafeSnap = await getDoc(cafeRef);
            return cafeSnap.exists() ? { id: cafeId, ...cafeSnap.data() } : null;
          });
          const cafesData = (await Promise.all(cafePromises)).filter(Boolean);
          setCafes(cafesData);
        }

        if (Array.isArray(allowedRoastersIds) && allowedRoastersIds.length > 0) {
          const roasterPromises = allowedRoastersIds.map(async (roasterId) => {
            const roasterRef = doc(db, 'roasters', roasterId);
            const roasterSnap = await getDoc(roasterRef);
            return roasterSnap.exists() ? { id: roasterId, ...roasterSnap.data() } : null;
          });
          const roastersData = (await Promise.all(roasterPromises)).filter(Boolean);
          setRoasters(roastersData);
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [email]);

  const handleCafeClick = async (cafe) => {
    localStorage.setItem('selectedCafe', JSON.stringify(cafe));
    if (localStorage.getItem('activeTab')) {
      localStorage.removeItem('activeTab');
    }
    console.log(cafe)
    dispatch(setPrivileges('ro')); 
    localStorage.setItem('interfaceType', 'cafe');
    navigate('/admin');
  };

  const handleRoasterClick = async (roaster) => {
    localStorage.setItem('selectedRoasterId', roaster.id);
    if (localStorage.getItem('activeTab')) {
      localStorage.removeItem('activeTab');
    }
    localStorage.setItem('interfaceType', 'roaster');
    dispatch(setPrivileges('roaster')); // оновить privileges
    await dispatch(getRoasterData());
    navigate('/roaster-dashboard');
  };

  return (
    <div className='main-container-chooseAcc'>
      <h2 className="choose-account-title">Choose an Account</h2>
      {loading ? (
        <Loader />
      ) : cafes.length === 0 && roasters.length === 0 ? (
        <div className='noAccses-acount'>
          <p className='noAccses-acount-main-text'>You do not have access to any cafes or roasteries. To gain access, please contact us at: </p>
          <p className='noAccses-acount-main-number'>Phone: +1 (555) 123-4567</p>
          <p className='noAccses-acount-main-tg'>Telegram: @fakeusername</p>
          <button className="logout-button" onClick={() => dispatch(logoutUser())}>Logout</button>
        </div>
      ) : (
        <>
          {roasters.length > 0 && (
            <>
              <h3 className="choose-subtitle">Roasteries</h3>
              <div className="acc-main-choose-con">
                {roasters.map((roaster) => (
                  <div key={roaster.place_id || roaster.id} onClick={() => handleRoasterClick(roaster)} className="account-card">
                    <img src={roaster.logo} alt="logo" className="account-logo" />
                    <p className="account-text">{roaster.name}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          {cafes.length > 0 && (
            <>
              <h3 className="choose-subtitle">Cafes</h3>
              <div className="acc-main-choose-con">
                {cafes.map((cafe) => (
                  <div key={cafe.place_id || cafe.id} onClick={() => handleCafeClick(cafe)} className="account-card">
                    <img src={Object.values(cafe.adminData?.photos || {})[0]} alt="logo" className="account-logo" />
                    <p className="account-text">{cafe.name}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ChooseAccount;
