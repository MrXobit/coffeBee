import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bluePlus from '../../assets/blue-plus.png';
import './CafePass.css';
import axios from 'axios';
import Loader from '../loader/Loader';
import { db } from '../../firebase'; 
import { doc, getDoc } from 'firebase/firestore';

const CafePass = ({ cafeId }) => {
  const navigate = useNavigate()
  const [subData, setSunData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState(null);
  const LoadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://us-central1-coffee-bee.cloudfunctions.net/getSubscriptions', {
        params: {
          cafeId: cafeId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSunData(response.data.data); 
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSelectedCafe = () => {
      const cafe = JSON.parse(localStorage.getItem('selectedCafe'));
      setSelectedCafe(cafe);
    };

 
    loadSelectedCafe();

 
    const handleStorageChange = (event) => {
      if (event.key === 'selectedCafe') {
        loadSelectedCafe();  
      }
    };

  
    window.addEventListener('storage', handleStorageChange);

 
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);  

 
  useEffect(() => {
    if (selectedCafe) {
      LoadData();
    }
  }, [selectedCafe]);


  const handleDeleteSub = async(subId) => {
    setLoading(true);
     try {
      console.log('cafeId' + cafeId)
      console.log('subId' + subId)
      const token = localStorage.getItem('token');
      console.log(token)
      const response = await axios.post(
        `https://us-central1-coffee-bee.cloudfunctions.net/deleterSubscriptions`, 
        { 
            cafeId,
            DeleterSubscriptionId: subId 
        },
        {
            headers: { 
                Authorization: `Bearer ${token}` 
            }
        }
    );
    const cafeRef = doc(db, 'cafe', cafeId);
    const cafeSnap = await getDoc(cafeRef);

    if (cafeSnap.exists()) {
      const updatedCafeData = { id: cafeId, ...cafeSnap.data() };

      localStorage.setItem('selectedCafe', JSON.stringify(updatedCafeData));

      setSelectedCafe(updatedCafeData);
    }
     } catch(e) {
      console.log(e)
     } finally {
      setLoading(false);
     }
  }


  const isArray = Array.isArray(subData);

  const handleEditPage = (sub) => {
    navigate("/editSubscription", { 
      state: { 
        subData: sub, 
        cafeId
      } 
    });
  }

  return (
    <div className='coffe-pass-main-con-block'>
      <h1 className='cofe-pass-main-title-main'>Coffee passes</h1>
      <Link to="/addSubscription" className="cafePass-add-new-cafe-pass-con">
  <div className="block-for-cafe-pass-img-pluss">
    <img src={bluePlus} alt="plus-icon" />
  </div>
  <p className='cafe-pass-p-just-text'>Create a New Coffee Pass</p>
</Link>


<p className='cafe-pass-p-just-text-second-teg'>
  {subData && subData.length > 0 ? 'Your Active Coffee Passes' : 'You have no active coffee passes.'}
</p>

      <div className="coffee-pass-block-main-container">
      {loading ? (
          <div className="loader-container">
          <Loader />
        </div>
      ) : (
        // Перевірка чи subData є масивом перед викликом .map()
        isArray && subData.map((sub, index) => (
            <div key={index}  className="subscription-card-item">
              <div className="subscription-title-text">{sub.title}</div>
              <div className="subscription-price-value">
                Price: {sub.price} {sub.currency}
              </div>
              <div className="subscription-duration-period">Duration: {sub.duration}</div>
              <div className="subscription-cups-count">Cups: {sub.cups}</div>
              <div className="subscription-creation-date">Created At: {sub.createdAt}</div>
              <div className="subscription-coffee-types-section">
                <div className="coffee-types-title">Coffee Types:</div>
                <div className="coffee-types-list-container">
                  {sub.coffeeTypes && sub.coffeeTypes.map((coffeeType, coffeeIndex) => (
                    <div key={coffeeIndex} className="coffee-type-item">{coffeeType}</div>
                  ))}
                </div>
              </div>
              <div className="subscription-actions">
            
                <button onClick={() => handleEditPage(sub)} className="btn-edit-cafe-pass">Edit</button>
          
                <button onClick={() => handleDeleteSub(sub.id)} className="btn-delete-cafe-pass">Delete</button>
              </div>
            </div>
         
        ))
      )}
      </div>
    </div>
  );
};

export default CafePass;




