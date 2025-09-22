import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { db, storage } from '../../../firebase';
import './moderationRoasters.css';
import Loader from '../../loader/Loader';
import close from '../../../assets/close.png';
import edit from '../../../assets/edit.png';
import { CountryArray } from '../roasters/data';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MargeModerationRoasters from './margeModerationRoasters/MargeModerationRoasters';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


import closeIcon from '../../../assets/closeIcon.png';

import img from '../../../assets/Untitled.jpeg';
const ModerationRoasters = () => {
  const [roasters, setRoasters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [btnLoader, setBtnLoader] = useState(false);
  const [roaster, setRoaster] = useState(null);
  const [modal, setMoadal] = useState(false);
  const [inputOpen, setInput] = useState({ open: false, value: '' });
  const [rejectBtn, SetrejectBtn] = useState({ loading: false, id: null });
  const [imageModal, setImageModal] = useState(true)
  const notifySuccess = (message) => toast.success(message);
  const notifyError = (message) => toast.error(message);

  const [page, setPage] = useState(1)



            const [imageFile, setImageFile] = useState(null);   // сам файл
const [imageUrl, setImageUrl] = useState(null);     // прев’ю


const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  }
};



  const getData = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'moderation', 'roasters');
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();
      const filteredRoasters = (data.roasters || []).filter(
        (r) => r.accepted === undefined
      );
      setRoasters(filteredRoasters);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) return '';
    let date;
    try {
      if (dateValue?.seconds) {
        date = new Date(dateValue.seconds * 1000);
      } else if (typeof dateValue === 'number') {
        date = dateValue < 1e12 ? new Date(dateValue * 1000) : new Date(dateValue);
      } else if (typeof dateValue === 'string') {
        let cleanString = dateValue.split('.')[0].replace(' ', 'T');
        date = isNaN(new Date(cleanString).getTime()) ? new Date(dateValue) : new Date(cleanString);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        date = new Date(dateValue);
      }
      if (isNaN(date.getTime())) return String(dateValue);
      return date.toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(dateValue);
    }
  };

  const handleReject = async (roasterData) => {
    if (rejectBtn.loading && rejectBtn.id === roasterData.id) return;
    SetrejectBtn({ loading: true, id: roasterData.id });
    try {
      const moderationRef = doc(db, 'moderation', 'roasters');
      const moderationSnap = await getDoc(moderationRef);
      const moderationData = moderationSnap.data();

      if (moderationData?.roasters) {
        const updatedRoasters = moderationData.roasters.map((r) =>
          r.id === roasterData.id ? { ...r, accepted: false } : r
        );
        await updateDoc(moderationRef, { roasters: updatedRoasters });
      }

      setRoasters((prevRoasters) =>
        prevRoasters.filter((r) => r.id !== roasterData.id)
      );

      notifySuccess('Roaster successfully rejected!');
    } catch (e) {
      console.log(e);
      notifyError('An error occurred. Please try again later.');
    } finally {
      SetrejectBtn({ loading: false, id: null });
    }
  };

const handleAcept = async () => {
  if (btnLoader) return;
  setBtnLoader(true);

  try {
    let logoUrl = roaster?.logo || null;

    // якщо вибрано файл -> заливаємо в Firebase Storage
    if (imageFile) {
      const storageRef = ref(storage, `roasters/${roaster.id}/logo`);
      await uploadBytes(storageRef, imageFile);
      logoUrl = await getDownloadURL(storageRef);
    }

    const roasterData = {
      name: inputOpen.value ? inputOpen.value : roaster.name,
      id: roaster.id,
      aliasId: [roaster.id],
      countryId: selectedCountry,
      logo: logoUrl || '' // додаємо силку на лого
    };

    // записуємо ростера
    await setDoc(doc(db, 'roasters', roasterData.id), roasterData);

    // оновлюємо moderation
    const moderationRef = doc(db, 'moderation', 'roasters');
    const moderationSnap = await getDoc(moderationRef);
    const moderationData = moderationSnap.data();

    if (moderationData?.roasters) {
      const updatedRoasters = moderationData.roasters.map((r) =>
        r.id === roasterData.id ? { ...r, accepted: true } : r
      );
      await updateDoc(moderationRef, { roasters: updatedRoasters });
    }

    setRoasters((prevRoasters) =>
      prevRoasters.filter((r) => r.id !== roasterData.id)
    );

    notifySuccess('Roaster successfully approved!');
  } catch (e) {
    console.log(e);
    notifyError('An error occurred. Please try again later.');
  } finally {
    setRoaster(null);
    setMoadal(false);
    setBtnLoader(false);
    setSelectedCountry('');
    setImageUrl(null);   // очищаємо прев’ю
    setImageFile(null);  // очищаємо файл
  }
};
  const handleOpenModal = (roaster) => {
    if (modal) return;
    setMoadal(true);
    setRoaster(roaster);
    if (roaster.records?.[0]?.countryId) {
      setSelectedCountry(roaster.records[0].countryId);
    } else {
      setSelectedCountry('');
    }
  };

  const handleCloseModal = () => {
    setMoadal(false);
    setRoaster(null);
    setSelectedCountry('');
      setImageFile(null);   // очищаємо файл
  setImageUrl(null);    // очищаємо прев’ю
  };

  return (
    <div className="ModerationRoasters">
      {page === 1 && <h1 className="ModerationRoasters-title">Moderation Roasters</h1>}
      {loading ? (
        <div className="ModerationRoasters-loaderCon">
          <Loader />
        </div>
      ) : (
        <>

             {page === 1 ? (
  <>
    


<div className="ModerationRoasters-btn-wrapper" onClick={() => setPage(2)}>
  <button className="ModerationRoasters-add-btn">
   Merge roasters
  </button>
</div>

             <div className="ModerationRoasters-list">
          {roasters.length > 0 ? (
            roasters.map((roaster, index) => (
              <div key={index} className="ModerationRoasters-item">
                <div className="ModerationRoasters-name">{roaster.name}</div>
                <div className="ModerationRoasters-roasterCountry">
                  Country: {roaster.records?.[0]?.countryId || 'Not specified'}
                </div>
                <div className="ModerationRoasters-recordsCount">
                  records {roaster?.records?.length || 0}
                </div>



                <div className="ModerationRoasters-btnContainer">
                  <div
                    disabled={btnLoader && btnLoader.id === roaster.id}
                    className="ModerationRoasters-btnAccept"
                    onClick={() => handleOpenModal(roaster)}
                  >
                    Accept
                  </div>

                  <div
                    className="ModerationRoasters-btnReject"
                    onClick={() => handleReject(roaster)}
                    disabled={rejectBtn.loading && rejectBtn.id === roaster.id}
                  >
                    {rejectBtn.loading && rejectBtn.id === roaster.id
                      ? 'Loading'
                      : 'Reject'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="ModerationRoasters-empty">No records</div>
          )}
        </div>


  </>
) : (
  <MargeModerationRoasters setRoasters={setRoasters} setPage={setPage} roasters={roasters} formatDate={formatDate} />
)}

        </>
   
      )}



      {modal && (
        <>
        
        <div className="ModerationRoasters-modalOverlay">
          <div className="ModerationRoasters-modal">
            <img
              src={close}
              alt="close"
              className="ModerationRoasters-modalClose"
              onClick={handleCloseModal}
            />
            <div className="ModerationRoasters-modalContent">
              <div className="ModerationRoasters-roasterHeader">
                <h3 className="ModerationRoasters-roasterName">
                  roaster name: <span>{roaster.name}</span>
                </h3>
                <img
                  src={edit}
                  alt="edit"
                  className="ModerationRoasters-roasterEdit"
                  onClick={() =>
                    setInput((prev) => ({
                      ...prev,
                      open: !prev.open,
                      value: ''
                    }))
                  }
                />
              </div>

              {inputOpen.open && (
                <div className="ModerationRoasters-inputWrapper">
                  <p className="ModerationRoasters-inputLabel">
                    Please enter new name
                  </p>
                  <input
                    type="text"
                    className="ModerationRoasters-inputField"
                    value={inputOpen.value}
                    onChange={(e) =>
                      setInput((prev) => ({ ...prev, value: e.target.value }))
                    }
                  />
                </div>
              )}

    <div className="ModerationRoasters-modalTitle">
                Please select a country
              </div>

          

              <div className="ModerationRoasters-modalSelectWrapper">
                <div className="ModerationRoasters-modalSelectHeader">
                  {selectedCountry || 'Select...'}
                </div>
                <div className="ModerationRoasters-modalSelectOptions">
                  {CountryArray.map((country, index) => (
                    <div
                      key={index}
                      className="ModerationRoasters-modalSelectOption"
                      onClick={() => setSelectedCountry(country)}
                    >
                      {country}
                    </div>
                  ))}
                </div>
              </div>

              {selectedCountry && (
                <h3 className="ModerationRoasters-selectedCountry">
                  Selected country: {selectedCountry}
                </h3>
              )}




<div className="ModerationRoasters-fileInputWrapper">
  <label htmlFor="fileInput" className="ModerationRoasters-fileInputLabel">
    Upload Image
  </label>
  <input
    id="fileInput"
    type="file"
    accept="image/*"
    className="ModerationRoasters-fileInput"
    onChange={handleImageChange}
  />

  {imageUrl && (
    <div className="ModerationRoasters-imagePreviewWrapper">
      <img
        src={imageUrl}
        alt="preview"
        className="ModerationRoasters-imagePreview"
      />
      <img
        src={closeIcon} /* твій хрестик */
        alt="close"
        className="ModerationRoasters-imageRemove"
        onClick={() => {
          setImageFile(null);
          setImageUrl(null);
        }}
      />
    </div>
  )}
</div>



              <button
                disabled={btnLoader}
                onClick={handleAcept}
                className="ModerationRoasters-saveBtn"
              >
                {btnLoader ? 'Loading' : 'Save'}
              </button>
            </div>
          </div>
        </div>





        </>
      )}


      <ToastContainer />
    </div>
   
  );
};

export default ModerationRoasters;
