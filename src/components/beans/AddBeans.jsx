import React, { useEffect, useState } from 'react';
import './Beans.css';
import { db, storage } from '../../firebase'; // Імпортуй свої налаштування Firebase
import { doc, getDoc, setDoc, collection, arrayUnion, updateDoc, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';


const Beans = () => {
   const location = useLocation();
  const beanToEdit = location.state?.beanData || null;
  const cafeData = location.state?.cafeData || null;
  const returnUrl = location.state?.returnUrl || '/admin';


  const { email } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({
    name: '',
    roaster: '',
    country: '',
    variety: '',
    process: '',
    roasting: '',
    scaScore: '',
    producer: '',
    altitude: '',
    harvestYear: '',
    flavoursByRoaster: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imageFileObject, setImageFileObject] = useState(null); 
  const [error, setError] = useState(null);
  const supportedExtensions = ['jpg', 'jpeg', 'png'];
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const navigate = useNavigate()
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value, 
    });
  };


  useEffect(() => {
    if(cafeData){
      setData(cafeData)
    } else {
      const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
      if (selectedCafe) {
        setData(selectedCafe);
      }
    }


      if (beanToEdit) {
        setFormData({
          name: beanToEdit.name || '',
          roaster: beanToEdit.roaster || '',
          country: beanToEdit.country || '',
          variety: beanToEdit.variety || '',
          process: beanToEdit.process || '',
          roasting: beanToEdit.roasting || '',
          scaScore: beanToEdit.scaScore || '',
          producer: beanToEdit.producer || '',
          altitude: beanToEdit.altitude || '',
          harvestYear: beanToEdit.harvestYear || '',
          flavoursByRoaster: beanToEdit.flavoursByRoaster || ''
        });

        if (beanToEdit.imageUrl) {
          setImageFile(beanToEdit.imageUrl); 
          setImageFileObject(null); 
        }
      }


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
      if (fileExtension && supportedExtensions.includes(fileExtension)) {
        setImageFile(URL.createObjectURL(droppedFile));
        setImageFileObject(droppedFile); // Збереження файлу
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
      if (fileExtension && supportedExtensions.includes(fileExtension)) {
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

  const handleAddBeans = async(e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const emptyFields = Object.entries(formData).filter(([_, value]) => !value.trim());
      const isImageMissing = !beanToEdit?.imageUrl && !imageFileObject;  
  
      console.log('emptyFields:', emptyFields);
      console.log('isImageMissing:', isImageMissing);
  
      if (emptyFields.length > 0 || isImageMissing) {
        const missingFields = emptyFields.map(([key]) => key).join(', ');
        setError(`Please fill in all fields: ${missingFields}${isImageMissing ? ', image file' : ''}`);
        return;
      }
  


      if(cafeData){
        const token = localStorage.getItem('token');
        const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/validAccesAdmin', {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
    
        if (response.data.access === false) return 

      } else {
        const accessRef = doc(db, 'accessAdmin', email);
        const accessSnap = await getDoc(accessRef);
        if (!accessSnap.exists()) {
          console.log('mistake1');
          return;
        }
        const accessData = accessSnap.data(); 
        if (!accessData.allowedCafeIds.includes(data.id)) {
          console.log('mistake2');
          return;
        }
      }

      if(formData && beanToEdit) {
        const isDataUnchanged = Object.keys(formData).every(
          (key) => formData[key] === beanToEdit[key]
        );
        if (isDataUnchanged && imageFile === beanToEdit.imageUrl) {
          console.log('No data changed, navigating to /admin');
          navigate(returnUrl);
          return;
        }
      }
  
      const beansId = uuidv4();
      const imageId = uuidv4();
  
      console.log('beansId:', beansId);
      console.log('imageId:', imageId);
  
      let imageUrl = '';
      if (!beanToEdit || imageFile !== beanToEdit.imageUrl) {
        if (imageFileObject) {
          const imageRef = ref(storage, `beans/${imageId}`);
          await uploadBytes(imageRef, imageFileObject);
          imageUrl = await getDownloadURL(imageRef);
          console.log('Image uploaded, URL:', imageUrl);
        }
      } else {
        imageUrl = beanToEdit.imageUrl;
      }
      
  
      const imagePathTo = (imageFile !== (beanToEdit?.imageUrl) && imageFileObject) 
      ? imageId 
      : beanToEdit.imagePath
  
      console.log('imagePathTo:', imagePathTo);

      if(!imagePathTo === imageId) {
          const imageRef = ref(storage, `beans/${beanToEdit.imagePath}`)
          await deleteObject(imageRef)
      }
  
      const newBeans = {
        ...formData,
        id: beanToEdit?.id ?? uuidv4(),
        imageUrl,
        isVerified: true,
        imagePath: imagePathTo,
        createdAt: new Date().toISOString()
      };
      if(beanToEdit?.id) {
        const beansRef = doc(db, 'beans', beanToEdit.id);
        await updateDoc(beansRef, newBeans);
      } else {
        const beansRef = doc(db, 'beans', newBeans.id);
        await setDoc(beansRef, newBeans)
        const cafeRef = doc(db, 'cafe', data.id)
        await updateDoc(cafeRef, {
          cafeBeans: arrayUnion(newBeans.id)
        })
      }

      const cafeRef = doc(db, 'cafe', data.id);
      const updatedCafeDoc = await getDoc(cafeRef);
      const updatedCafeData = updatedCafeDoc.data(); 
      const cafeWithId = {
        ...updatedCafeData,
        id: cafeRef.id 
      };
      localStorage.setItem('selectedCafe', JSON.stringify(cafeWithId));
      console.log('Navigating to admin page');
      navigate(returnUrl);
    } catch (error) {
      console.error('Error adding beans:', error);
      setError('An error occurred while adding beans. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

const handleDragOver = (e) => {
  e.preventDefault();
};

const handleDragEnter = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

const handleDragLeave = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

  return (
    <div className="beans-con-wrapper-ultimate">
      <div className="beans-con-structure-ultimate">
        <h2 className="beans-title-heading-ultimate">{beanToEdit ? 'Edit coffee bean' : 'Add New Beans'}
        </h2>
        <form className="beans-data-form-ultimate" onSubmit={handleAddBeans}>
          {Object.keys(formData).map((field) => (
            <div className="beans-input-section-ultimate" key={field}>
              <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                type={field === 'scaScore' || field === 'harvestYear' ? 'number' : 'text'}
                name={field}
                className="input-area-ultimate"
                value={formData[field]}
                onChange={handleInputChange}
                placeholder={`Enter ${field}`}
              />
            </div>
          ))}

          <div className="beans-for-img-con" onDrop={handleDrop}
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
          </div>
          {error && <p className="beans-error-message">{error}</p>}
          <button type="submit" className="beans-action-btn-ultimate">  {loading ? 'loading...' : (beanToEdit ? 'Edit coffee bean' : 'Add New Beans')}</button>
        </form>
      </div>
    </div>
  );
};

export default Beans;
