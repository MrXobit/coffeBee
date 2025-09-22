import React, { useEffect, useState } from 'react';
import './CafeInfo.css';
import SubLoader from '../loader/SubLoader';
import axios from 'axios';
import { db, storage } from '../../firebase'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import WorkingHours from './updateWorkingHours/WorkingHours';
import Contact from './contact/Contact';
import MapBlock from './mapBlock/MapBlock';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AnimatePresence, motion } from "framer-motion";
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import backImg from '../../assets/back.png'


const CafeInfo = () => {
  const [data, setData] = useState(null);
  const [editedDescription, setEditedDescription] = useState(''); 
  const [loadingDesc ,setLoadingDesc] = useState(false)
const navigate = useNavigate()

const [btnLogo, setBtnLogo] = useState(false)
    const [imageFile, setImageFile] = useState(null);
    const [imageFileObject, setImageFileObject] = useState(null);
    const [error, setError] = useState(null);
    const supportedExtensions = ['jpg', 'jpeg', 'png'];


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
  setImageFile(Object.values(updatedCafeData.adminData.photos)[0])
      // збереження в localStorage
      localStorage.setItem('selectedCafe', JSON.stringify(updatedCafeData));
    } catch (e) {
      console.error('Error loading cafe data:', e);
    }
  };
  


  useEffect(() => {

  loadData()



      const preventFileOpen = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragover', preventFileOpen);
    window.addEventListener('drop', preventFileOpen);

    return () => {
      window.removeEventListener('dragover', preventFileOpen);
      window.removeEventListener('drop', preventFileOpen);
    };



  }, []);




  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fileExtension = droppedFile.name.toLowerCase().split('.').pop();
      if (supportedExtensions.includes(fileExtension)) {
        setImageFile(URL.createObjectURL(droppedFile));
        setImageFileObject(droppedFile);
        setError(null);
      } else {
        setError('Extension not supported');
        setImageFile(null);
        setImageFileObject(null);
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      if (supportedExtensions.includes(fileExtension)) {
        setImageFile(URL.createObjectURL(file));
        setImageFileObject(file);
        setError(null);
      } else {
        setError('Extension not supported');
        setImageFile(null);
        setImageFileObject(null);
      }
    }
  };



  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); };




  
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
        `https://us-central1-coffee-bee.cloudfunctions.net/updateCafeInfoByGoogle`,
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
        setImageFile(Object.values(updatedCafeData.adminData.photos)[0])
        setImageFileObject(null)
      }  

      

      console.log(response.data);
    } catch (e) {
      notifyError('Update failed');
      console.log(e);
    } finally {
      setLoadingUpdateCafeInfo(false);
    }
  };
  


  const handleChangeLogo = async() => {
    setBtnLogo(true)
    try {
      if(imageFileObject === null) {
        return 
      }



         const storageRef = ref(storage, `cafe/${data.id}/photos/cafe`);

    // 2. Завантажуємо файл у Storage
    await uploadBytes(storageRef, imageFileObject);

    // 3. Отримуємо downloadURL
    const downloadURL = await getDownloadURL(storageRef);

    // 4. Оновлюємо Firestore (adminData.photos.cafePhoto)
    const cafeRef = doc(db, "cafe", data.id);
    await updateDoc(cafeRef, {
      "adminData.photos.cafePhoto": downloadURL
    });

    console.log("✅ Лого успішно оновлено:", downloadURL);

    setData((prev) => ({
      ...prev,
      adminData: {
        ...prev.adminData,
        photos: {
          ...prev.adminData.photos,
          cafePhoto: downloadURL,
        },
      },
    }));

    notifySuccess("Cafe logo has been successfully updated ✅");

    }catch(e) {
      console.log(e)
    }finally {
setBtnLogo(false)
    }
  }

const handleChangePage = () => {
  navigate("/"); 
};


console.log(cafeData)

  if (!data) {
    return <SubLoader />;
  }

  return (
    <div className="cafe-info-container">
      <img src={backImg} className='backImg-toChangeLogo' onClick={handleChangePage}/>
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
   




             <div className="beans-for-img-con"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            <label htmlFor="beans-img-uploader">Image Upload</label>
            <input
              type="file"
              name="imageUrl"
              id="beans-img-uploader"
              className="input-file-upload-ultimate"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imageFile && <img src={imageFile} alt="Uploaded Preview" className="beans-preview-image-ultimate" />}
            {!imageFile && !error && (
              <p className="beans-upload-prompt">Drag and drop a file or select it via the button</p>
            )}

          <AnimatePresence>
  {(imageFile != Object.values(data.adminData.photos)[0]) && (
    <motion.div
      key="change-logo-btn"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="changeLogoWrapper"
    >
      <button className="changeLogoBtn" onClick={handleChangeLogo} disabled={btnLogo}>
        {btnLogo ? 'Loading' : 'Change cafe logo'}
      </button>
    </motion.div>
  )}
</AnimatePresence>
          </div>




    </div>
  );
};

export default CafeInfo;
