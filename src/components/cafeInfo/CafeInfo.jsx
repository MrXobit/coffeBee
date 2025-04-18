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



const CafeInfo = () => {
  const [data, setData] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState(''); 
  const [loadingName, setLoadingName] = useState(false);
  const [loadingDesc ,setLoadingDesc] = useState(false)
  const [loadingAdress, setLoadingAdress] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
 

   const location = useLocation();
   const cafeData = location.state?.cafeData || null;

  const loadData = async () => {
    try {

      if(cafeData) {
        setData(cafeData);
        setEditedName(cafeData.adminData?.name || cafeData.name || '');
        setEditedDescription(cafeData?.adminData?.description || '');
      } else {
        const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
      
        if (!selectedCafe || !selectedCafe.id) {
          console.error("No selected cafe or ID found in localStorage");
          return;
        }
  
        const cafeRef = doc(db, 'cafe', selectedCafe.id);
        const cafeSnap = await getDoc(cafeRef);
  
        if (!cafeSnap.exists()) {
          console.log('Cafe not found in the database');
          return;
        }
  
        const updatedCafeData = { id: selectedCafe.id, ...cafeSnap.data() };
        setData(updatedCafeData);
        setEditedName(updatedCafeData.adminData?.name || updatedCafeData.name || '');
        setEditedDescription(updatedCafeData?.adminData?.description || '');
      }
    } catch (e) {
      console.error('Error loading data:', e);
    }
  };





  useEffect(() => {

  loadData()


  }, []);

  const handleUpdateName = async () => {
    setLoadingName(true);
    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(
        'https://us-central1-coffee-bee.cloudfunctions.net/updateName',
        {
          name: editedName,
          cafeId: data.id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const cafeRef = doc(db, 'cafe', data.id); 
      const cafeSnap = await getDoc(cafeRef);    
  
      if (cafeSnap.exists()) {
        const updatedCafeData = { id: data.id, ...cafeSnap.data() }; 
  
        
        setData(updatedCafeData);

        localStorage.setItem('selectedCafe', JSON.stringify(updatedCafeData));
      }  
    } catch (e) {
      if (e.response) {
        console.error('Error response:', e.response.data);
      } else if (e.request) {
        console.error('Error request:', e.request);
      } else {
        console.error('General error:', e.message);
      }
    } finally {
      setLoadingName(false);
    }
  };

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

      const cafeRef = doc(db, 'cafe', data.id); 
      const cafeSnap = await getDoc(cafeRef);    
  
      if (cafeSnap.exists()) {
        const updatedCafeData = { id: data.id, ...cafeSnap.data() }; 
  
        
        setData(updatedCafeData);
  
        localStorage.setItem('selectedCafe', JSON.stringify(updatedCafeData));
      }  

    } catch (e) {
   console.log(e)
    } finally {
      setLoadingDesc(false);
    }
  };

//   const handleAdress = async() => {
//     setLoadingAdress(true)
//     try {
//       const token = localStorage.getItem('token');

//       const response = await axios.post(
//         "https://us-central1-coffee-bee.cloudfunctions.net/updateAddress",
//         {
//           address: { lat: selectedPosition[0], lng: selectedPosition[1] },
//           cafeId: data.id, 
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`, 
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       const cafeRef = doc(db, 'cafe', data.id); 
//       const cafeSnap = await getDoc(cafeRef);    
  
//       if (cafeSnap.exists()) {
//         const updatedCafeData = { id: data.id, ...cafeSnap.data() }; 
  
        
//         setData(updatedCafeData);
//         setSelectedPosition([updatedCafeData.adminData.address.lat, updatedCafeData.adminData.address.lng]);
//         localStorage.setItem('selectedCafe', JSON.stringify(updatedCafeData));
//       }  
//     } catch(e) {
// console.log(e)
//     } finally{
//       setLoadingAdress(false)
//     }
//   }





  if (!data) {
    return <SubLoader />;
  }

  return (
    <div className="cafe-info-container">
      <h1 className="section-title">Cafe Settings</h1>

      <div className="info-section">
        <h2>Basic Information</h2>

        <div className="info-item center-content">
          <strong className="cafe-name-title">Coffee Name</strong>
          <div className="cofee-name-info-btn-con">
            <input
              type="text"
              className="cafe-name-input"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
            />
            <button
              className="update-btn"
              onClick={handleUpdateName}
              disabled={loadingName}
            >
              {loadingName ? 'Updating...' : 'Update Name'}
            </button>
          </div>
        </div>

        <div className="info-item center-content">
          <strong className="cafe-name-title">Description</strong>
          <div className="cofee-name-info-btn-con">
            <textarea
              className="cafe-description-input"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
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
          {/* <strong className="cafe-name-title">Adress</strong> */}
          {/* <div className="cofee-name-info-btn-con">
              <MapBlock
               onPositionChange={setSelectedPosition} 
               />

            <button
              className="update-btn update-btn-adress"
              disabled={loadingAdress}
              onClick={handleAdress}
            >
              {loadingAdress ? 'Updating...' : 'Update Address'}
            </button>
          </div> */}
          <WorkingHours cafeData={data}/>
        </div>
        <div className="info-item center-content">
          <Contact cafeData={data}/>
        </div>
      </div>
    </div>
  );
};

export default CafeInfo;
