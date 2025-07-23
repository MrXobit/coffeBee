import React, { useEffect, useState } from 'react';
import './CafeInfo.css';
import SubLoader from '../loader/SubLoader';
import axios from 'axios';
import { db } from '../../firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import WorkingHours from './updateWorkingHours/WorkingHours';
import Contact from './contact/Contact';
import MapBlock from './mapBlock/MapBlock';
import { useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const CafeInfo = () => {
  const [data, setData] = useState(null);
  const [editedDescription, setEditedDescription] = useState(''); 
  const [loadingDesc ,setLoadingDesc] = useState(false)


  const [loadingUpdateCafeInfo, setLoadingUpdateCafeInfo] = useState(false)


      const notifySuccess = (message) => toast.success(message);
      const notifyError = (message) => toast.error(message);
  

   const location = useLocation();
   const cafeData = location.state?.cafeData || null;

   const loadData = async () => {
    try {
      let cafeId = null;
  
      if (location.state?.cafeData?.id) {
        cafeId = location.state.cafeData.id;
      } else {
        const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
        if (selectedCafe?.id) {
          cafeId = selectedCafe.id;
        }
      }
  
      if (!cafeId) {
        console.error('No cafe ID found in state or localStorage');
        return;
      }
  
      const cafeRef = doc(db, 'cafe', cafeId);
      const cafeSnap = await getDoc(cafeRef);
  
      if (!cafeSnap.exists()) {
        console.error('Cafe not found');
        return;
      }
  
      const updatedCafeData = { id: cafeId, ...cafeSnap.data() };
  
      // оновлення станів
      setData(updatedCafeData);
      setEditedDescription(updatedCafeData?.adminData?.description || '');
  
      // збереження в localStorage
      localStorage.setItem('selectedCafe', JSON.stringify(updatedCafeData));
    } catch (e) {
      console.error('Error loading cafe data:', e);
    }
  };
  


  useEffect(() => {

  loadData()


  }, []);


  
  const handleUpdateDescription = async () => {
    setLoadingDesc(true);
    try {
      const token = localStorage.getItem('token');


      const response = await axios.post(
        'https://us-central1-coffee-bee.cloudfunctions.net/updateDescription',
        {
          description: editedDescription,
          cafeId: data.id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      notifySuccess('Description updated successfully');


      const cafeRef = doc(db, 'cafe', data.id); 
      const cafeSnap = await getDoc(cafeRef);    
  
      if (cafeSnap.exists()) {
        const updatedCafeData = { id: data.id, ...cafeSnap.data() }; 
  
        
        setData(updatedCafeData);
  
        localStorage.setItem('selectedCafe', JSON.stringify(updatedCafeData));
      }  

    } catch (e) {
      notifyError('Failed to update description');
    } finally {
      setLoadingDesc(false);
    }
  };


  const handleUpdateCafeInfoByGoogle = async () => {
    setLoadingUpdateCafeInfo(true);
    try {
      const token = localStorage.getItem('token');
  
      const response = await axios.post(
        'https://us-central1-coffee-bee.cloudfunctions.net/updateCafeInfoByGoogle',
        {
          placeId: data.id,
          adminData: data.adminData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
  
      notifySuccess('Cafe info updated');


      
      const cafeRef = doc(db, 'cafe', data.id); 
      const cafeSnap = await getDoc(cafeRef);    
  
      if (cafeSnap.exists()) {
        const updatedCafeData = { id: data.id, ...cafeSnap.data() }; 
  
        
        setData(updatedCafeData);
  
        localStorage.setItem('selectedCafe', JSON.stringify(updatedCafeData));
      }  



      console.log(response.data);
    } catch (e) {
      notifyError('Update failed');
      console.log(e);
    } finally {
      setLoadingUpdateCafeInfo(false);
    }
  };
  



console.log(cafeData)

  if (!data) {
    return <SubLoader />;
  }

  return (
    <div className="cafe-info-container">
      <h1 className="section-title">Cafe Settings</h1>

      <div className="info-section">

<div className="info-item center-content">
  <strong className="cafe-name-title">Description</strong>
  <div className="cofee-name-info-btn-con">
    <textarea
      className="cafe-description-input"
      value={editedDescription}
      onChange={(e) => setEditedDescription(e.target.value)}
      placeholder="Enter description here..."
    />
    <button
      className="update-btn"
      onClick={handleUpdateDescription}
      disabled={loadingDesc}
    >
      {loadingDesc ? 'Updating...' : 'Update Description'}
    </button>
  </div>
</div>

    
        <div className="info-item center-content">
          <Contact cafeData={data}/>
        </div>



        <h2>Basic Information</h2>


        <div className="google-map-data-block">
  <h3 className="cafe-name">Назва кафе: {data?.name || '—'}</h3>

  <h3 className="cafe-website">
    Вебсайт:{" "}
    {data?.website ? (
      <a href={data.website} target="_blank" rel="noopener noreferrer">
        {data.website}
      </a>
    ) : (
      '—'
    )}
  </h3>

  <h3 className="cafe-address">Адреса: {data?.formatted_address || '—'}</h3>

  <div className="working-hours-block">
    <h3 className="working-hours-title">Години роботи</h3>
    <ul className="working-hours-list">
      {data?.opening_hours?.weekday_text?.length > 0 ? (
        data.opening_hours.weekday_text.map((day, index) => (
          <li className="working-hours-item" key={index}>
            {day}
          </li>
        ))
      ) : (
        <li className="working-hours-empty">Інформація про години роботи недоступна</li>
      )}
    </ul>
  </div>

  <button disabled={loadingUpdateCafeInfo} onClick={handleUpdateCafeInfoByGoogle} className="update-google-data-btn">
  {loadingUpdateCafeInfo ? 'loading...' : 'Update data from Google Maps'}
  </button>
</div>

      </div>
   
    </div>
  );
};

export default CafeInfo;
