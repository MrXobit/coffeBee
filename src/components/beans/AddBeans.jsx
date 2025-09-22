import React, { useEffect, useRef, useState } from 'react';
import './Beans.css';
import { db, storage } from '../../firebase';
import { doc, getDoc, setDoc, collection, arrayUnion, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import debounce from 'lodash.debounce'; // якщо ще не імпортував

const Beans = () => {


  const { uid } = useSelector((state) => state.user);

 

  const location = useLocation();
  const beanToEdit = location.state?.beanData || null;
  const cafeData = location.state?.cafeData || null;
  const returnUrl = location.state?.returnUrl || '/admin';
const inputValueRef = useRef(''); // зберігає останній введений текст


const [roasterQueryInput, setRoasterQueryInput] = useState('');
const [roasterSearchResults, setRoasterSearchResults] = useState([]);

  const { email } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    name: '',
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

  const [roaster, setRoaster] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imageFileObject, setImageFileObject] = useState(null);
  const [error, setError] = useState(null);
  const supportedExtensions = ['jpg', 'jpeg', 'png'];
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [roasters, setRoasters] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    console.log('Component mounted');

    if (cafeData) {
      setData(cafeData);
    } else {
      const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
      if (selectedCafe) setData(selectedCafe);
    }

    if (beanToEdit) {
      setFormData({
        name: beanToEdit.name || '',
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
      setRoaster(beanToEdit.roaster || '');

      // if (beanToEdit.imageUrl) {
      //   setImageFile(beanToEdit.imageUrl);
      //   setImageFileObject(null);
      // }
    }

    // const preventFileOpen = (e) => {
    //   e.preventDefault();
    //   e.stopPropagation();
    // };

    // window.addEventListener('dragover', preventFileOpen);
    // window.addEventListener('drop', preventFileOpen);

    // return () => {
    //   window.removeEventListener('dragover', preventFileOpen);
    //   window.removeEventListener('drop', preventFileOpen);
    // };
  }, [beanToEdit, cafeData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // const handleDrop = (e) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   const droppedFile = e.dataTransfer.files[0];
  //   if (droppedFile) {
  //     const fileExtension = droppedFile.name.toLowerCase().split('.').pop();
  //     if (supportedExtensions.includes(fileExtension)) {
  //       setImageFile(URL.createObjectURL(droppedFile));
  //       setImageFileObject(droppedFile);
  //       setError(null);
  //     } else {
  //       setError('Extension not supported');
  //       setImageFile(null);
  //       setImageFileObject(null);
  //     }
  //   }
  // };

  // const handleImageChange = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     const fileExtension = file.name.toLowerCase().split('.').pop();
  //     if (supportedExtensions.includes(fileExtension)) {
  //       setImageFile(URL.createObjectURL(file));
  //       setImageFileObject(file);
  //       setError(null);
  //     } else {
  //       setError('Extension not supported');
  //       setImageFile(null);
  //       setImageFileObject(null);
  //     }
  //   }
  // };





const handleAddBeans = async (e) => {
  let roasterId = null;
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
// Копіюємо всі поля форми
const fullForm = { ...formData };

// Шукаємо поля, які пусті або складаються лише з пробілів
const emptyFields = Object.entries(fullForm).filter(([_, val]) => {
  if (typeof val !== 'string') return true; // поле не рядок — вважаємо пустим
  return val.trim() === ''; // поле — рядок, але пустий або тільки пробіли
});

// Якщо є хоча б одне пусте поле — показуємо помилку і зупиняємо сабміт
if (emptyFields.length > 0) {
  const missingFields = emptyFields.map(([key]) => key).join(', ');
  setError(`Please fill in all fields: ${missingFields}`);
  setLoading(false);
  return;
}



    if (!inputValueRef.current.trim()) {
      setError('Please specify the roaster name before proceeding.');
      setLoading(false);
      return;
    } else {
      const inputValue = inputValueRef.current.trim().toLowerCase();
      const found = roaster.find(r => r.name.toLowerCase() === inputValue);

      if (found) {
        roasterId = found.id;
      } else {
        const inputValueRaw = inputValueRef.current.trim();
        const moderationDocRef = doc(db, "moderation", "roasters");
        const moderationDocSnap = await getDoc(moderationDocRef);

        if (!moderationDocSnap.exists()) {
          setError("Moderation document not found.");
          setLoading(false);
          return;
        }

        const moderationData = moderationDocSnap.data();
        const roastersArray = moderationData.roasters || [];

        const roasterIndex = roastersArray.findIndex(
          (r) => r.name.toLowerCase() === inputValueRaw.toLowerCase()
        );

        if (roasterIndex !== -1) {
          const foundRoaster = roastersArray[roasterIndex];
          roasterId = foundRoaster.id;

          const currentDate = new Date().toISOString();
          const updatedRecord = {
            cafeId: data?.id,
            userId: uid,
            date: currentDate,
          };

          const roasterRecords = roastersArray[roasterIndex].records || [];
          const updatedRecords = [...roasterRecords, updatedRecord];

          roastersArray[roasterIndex] = {
            ...roastersArray[roasterIndex],
            records: updatedRecords,
          };

          await updateDoc(moderationDocRef, {
            roasters: roastersArray,
          });
        } else {
          const newRoasterId = uuidv4();
          const inputName = inputValueRef.current.trim();
          const currentDate2 = new Date().toISOString();

          const newRoaster = {
            id: newRoasterId,
            name: inputName,
            records: [
              {
                cafeId: data?.id,
                userId: uid,
                date: currentDate2,
              },
            ],
          };

          const updatedRoastersArray = [...roastersArray, newRoaster];

          await updateDoc(moderationDocRef, {
            roasters: updatedRoastersArray,
          });

          roasterId = newRoasterId;
        }
      }
    }

    if (cafeData) {
      const token = localStorage.getItem('token');
      const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/validAccesAdmin', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.access === false) {
        setError('Access denied');
        setLoading(false);
        return;
      }
    } else {
      const accessRef = doc(db, 'accessAdmin', email);
      const accessSnap = await getDoc(accessRef);
      if (!accessSnap.exists()) {
        setError('Access denied');
        setLoading(false);
        return;
      }
      const accessData = accessSnap.data();
      if (!accessData.allowedCafeIds.includes(data.id)) {
        setError('Access denied');
        setLoading(false);
        return;
      }
    }

    if (beanToEdit) {
      const isDataUnchanged = Object.keys(formData).every(
        (key) => formData[key] === beanToEdit[key]
      ) && roaster === beanToEdit.roaster;

      if (isDataUnchanged
        //  && imageFile === beanToEdit.imageUrl
        ) {
        navigate(returnUrl);
        setLoading(false);
        return;
      }
    }

    const beansId = uuidv4();
    // const imageId = uuidv4();

    // let imageUrl = '';
    // if (!beanToEdit || imageFile !== beanToEdit.imageUrl) {
    //   if (imageFileObject) {
    //     const imageRef = ref(storage, `beans/${imageId}`);
    //     await uploadBytes(imageRef, imageFileObject);
    //     imageUrl = await getDownloadURL(imageRef);
    //   }
    // } else {
    //   imageUrl = beanToEdit.imageUrl;
    // }

    // const imagePathTo = (imageFile !== beanToEdit?.imageUrl && imageFileObject)
    //   ? imageId
    //   : beanToEdit.imagePath;

    // if (!(imagePathTo === imageId) && beanToEdit?.imagePath) {
    //   const oldImageRef = ref(storage, `beans/${beanToEdit.imagePath}`);
    //   await deleteObject(oldImageRef);
    // }

    const newBeans = {
      ...formData,
      roaster: roasterId,
      id: beanToEdit?.id ?? beansId,
      // imageUrl,
      isVerified: true,
      // imagePath: imagePathTo,
      createdAt: new Date().toISOString()
    };

    if (beanToEdit?.id) {
      const beansRef = doc(db, 'beans', beanToEdit.id);
      await updateDoc(beansRef, newBeans);
    } else {
      const beansRef = doc(db, 'beans', newBeans.id);
      await setDoc(beansRef, newBeans);
      const cafeRef = doc(db, 'cafe', data.id);
      await updateDoc(cafeRef, {
        cafeBeans: arrayUnion(newBeans.id)
      });
    }

    const cafeRef = doc(db, 'cafe', data.id);
    const updatedCafeDoc = await getDoc(cafeRef);
    const updatedCafeData = updatedCafeDoc.data();
    const cafeWithId = { ...updatedCafeData, id: cafeRef.id };
    localStorage.setItem('selectedCafe', JSON.stringify(cafeWithId));
    navigate(returnUrl);

  } catch (error) {
    console.error('Error adding beans:', error);
    setError('An error occurred while adding beans. Please try again.');
  } finally {
    setLoading(false);
  }
};







let currentAbortController = null;

const handleSearch = debounce(async (e) => {
  const value = e.target.value;
  console.log('[handleSearch] called with value:', value);

  if (!value.trim()) {
    console.log('[handleSearch] empty value, clearing roasters');
    setRoasters([]);
    return;
  }

  // ❌ Скасовуємо попередній запит
  if (currentAbortController) {
    currentAbortController.abort();
  }

  // ✅ Створюємо новий AbortController
  currentAbortController = new AbortController();
  const signal = currentAbortController.signal;

  setLoading(true);
  try {
    console.log('[handleSearch] sending request...');
    const response = await axios.post(
      'https://us-central1-coffee-bee.cloudfunctions.net/getRoasterByInput',
      { roasterName: value },
      { signal } // <-- передаємо сигнал для відміни
    );

    console.log('[handleSearch] response received:', response.data);

   if (value !== inputValueRef.current) {
      console.log('[handleSearch] skipped outdated result for:', value);
      return;
    }

    if (Array.isArray(response.data) && response.data.length === 0) {
      setRoasters([]);
    } else {
      setRoasters(response.data);
    }
  } catch (error) {
    if (axios.isCancel(error) || error.name === 'CanceledError' || error.message === 'canceled') {
      console.log('[handleSearch] request was cancelled');
    } else {
      console.error('[handleSearch] error:', error.response?.data || error.message);
    }
  } finally {
    setLoading(false);
    console.log('[handleSearch] loading set to false');
  }
}, 500);


const handleRoasterSearchMain = (e) => {
 inputValueRef.current = e.target.value;
  if(!e.target.value.trim()) {
      setRoasters([]);
      setLoading(false)
    return;
  }


  setLoading(true);
  handleSearch(e); // debounce-обгортка
};

  // Handlers for drag and drop image events
  // const handleDragOver = (e) => { e.preventDefault(); };
  // const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); };
  // const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); };

  return (
    <div className="beans-con-wrapper-ultimate">
      <div className="beans-con-structure-ultimate">
        <h2 className="beans-title-heading-ultimate">
          {beanToEdit ? 'Edit coffee bean' : 'Add New Beans'}
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

          {/* <div className="beans-for-img-con"
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
          
          </div> */}


<div className="ultimate-roaster-input-section-container" style={{ position: 'relative' }}>
  <div className="dlskkfsdklfsdklfdsk">

  <label className="ultimate-roaster-input-label">Roaster</label>
  <input
    type="text"
    name="roaster"
    className="ultimate-roaster-text-input-field"
    onChange={handleRoasterSearchMain}
    placeholder="Enter roaster"
  />


  </div>

  {roasters.length > 0 && (
    <div className="ultimate-roaster-suggestions-dropdown-list-container">
      {roasters.slice(0, 5).map((item) => (
        <div
          key={item.id}
          className="ultimate-roaster-suggestion-item"
          onClick={() => setRoasterQueryInput(item.name)}
        >
          {item.name}
        </div>
      ))}
    </div>
  )}
</div>


          {error && <p className="beans-error-message">{error}</p>}
          <button type="submit" className="beans-action-btn-ultimate">
            {loading ? 'loading...' : (beanToEdit ? 'Edit coffee bean' : 'Add New Beans')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Beans;
