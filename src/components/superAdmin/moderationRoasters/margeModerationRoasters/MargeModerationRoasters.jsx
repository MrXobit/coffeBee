import React, { useState, useEffect } from 'react';
import close from '../../../../assets/close.png';
import './margeModerationRoasters.css';
import { motion, AnimatePresence } from 'framer-motion';
import edit from '../../../../assets/edit.png';
import { CountryArray } from '../../roasters/data';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../../../firebase';
import img from '../../../../assets/Untitled.jpeg';
import closeIcon from '../../../../assets/closeIcon.png';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import stringSimilarity from "string-similarity";
import MargeRoasterDetails from './MargeRoasterDetails';
import { FiClock as Clock, FiCheck as Check } from 'react-icons/fi';

const MargeModerationRoasters = ({ roasters, setPage, formatDate,setRoasters }) => {
  const [findRoasters, setFindRoasters] = useState([]);
  const [similarRoasters, setSimilarRoasters] = useState([]); // новий стан для схожих
  const [selectedRoasters, setSelectedRoasters] = useState([]); 
  const [modal, setMoadal] = useState(false);
  const [inputOpen, setInput] = useState({ open: false, value: '' });
  const [btnLoader, setBtnLoader] = useState(false);

  const [imageFile, setImageFile] = useState(null);   
  const [imageUrl, setImageUrl] = useState(null);     
  const [selectedCountry, setSelectedCountry] = useState('');

  const notifySuccess = (message) => toast.success(message);
  const notifyError = (message) => toast.error(message);

  // ==================== handle image ====================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  // ==================== init similar roasters ====================
  useEffect(() => {
    if (!roasters || roasters.length === 0) return;

    let pairs = [];

    for (let i = 0; i < roasters.length; i++) {
      for (let j = i + 1; j < roasters.length; j++) {
        const sim = stringSimilarity.compareTwoStrings(
          roasters[i].name.toLowerCase(),
          roasters[j].name.toLowerCase()
        );
        if (sim > 0.75) { 
          pairs.push(roasters[i], roasters[j]);
        }
      }
    }

    // прибираємо дублікати
    const unique = Array.from(new Map(pairs.map(r => [r.id, r])).values());
    setSimilarRoasters(unique);
  }, [roasters]);

  // ==================== search ====================
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase().trim();

    if (value === '') {
      setFindRoasters([]);
      return;
    }

    const filtered = roasters.filter((r) =>
      r.name.toLowerCase().includes(value)
    );

    setFindRoasters(filtered);
  };

  const toggleSelect = (roaster) => {
    setSelectedRoasters((prev) => {
      const exists = prev.some(r => r.id === roaster.id);
      if (exists) {
        return prev.filter(r => r.id !== roaster.id);
      } else {
        return [...prev, roaster];
      }
    });
  };

  const handleCloseModal = () => {
    setMoadal(false);
    setSelectedRoasters([]);
    setImageUrl(null);
    setImageFile(null);
    setSelectedCountry('');
    setInput({ open: false, value: '' });
  };

  const handleAcept = async () => {
    if (btnLoader) return;
    if (!selectedCountry && inputOpen.value.trim() !== '') return;
    setBtnLoader(true);

    try {
      let logoUrl = null;

      let roasterData = {
        name: inputOpen.value,
        id: uuidv4(),
        aliasId: selectedRoasters.map((roaster) => roaster.id),
        countryId: selectedCountry,
        logo: '' 
      };

      if (imageFile) {
        const storageRef = ref(storage, `roasters/${roasterData.id}/logo`);
        await uploadBytes(storageRef, imageFile);
        logoUrl = await getDownloadURL(storageRef);
        roasterData.logo = logoUrl;
      }

      await setDoc(doc(db, 'roasters', roasterData.id), roasterData);

      const moderationRef = doc(db, 'moderation', 'roasters');
      const moderationSnap = await getDoc(moderationRef);
      const moderationData = moderationSnap.data();

      if (moderationData?.roasters) {
        const aliasIds = roasterData.aliasId;

        const updatedRoasters = moderationData.roasters.map((r) =>
          aliasIds.includes(r.id) ? { ...r, accepted: true } : r
        );

        await updateDoc(moderationRef, { roasters: updatedRoasters });
      }

      setRoasters((prevRoasters) =>
        prevRoasters.filter((r) => !roasterData.aliasId.includes(r.id))
      );

      setFindRoasters((prevFindRoasters) =>
        prevFindRoasters.filter((r) => !roasterData.aliasId.includes(r.id))
      );

      notifySuccess('Roaster successfully approved!');
    } catch (e) {
      console.log(e);
      notifyError('An error occurred. Please try again later.');
    } finally {
      setSelectedRoasters([]);
      setMoadal(false);
      setBtnLoader(false);
      setSelectedCountry('');
      setImageUrl(null);
      setImageFile(null);
    }
  };

  const handleOpen = () => {
    setMoadal(true);

    if (selectedRoasters.length === 1) {
      setSelectedCountry(selectedRoasters[0].records?.[0]?.countryId || '');
    } else if (selectedRoasters.length > 1) {
      const countries = selectedRoasters.map(r => r.records?.[0]?.countryId || '');
      const allSame = countries.every(c => c === countries[0]);

      if (allSame && countries[0]) {
        setSelectedCountry(countries[0]);
      } else {
        setSelectedCountry('');
      }
    } else {
      setSelectedCountry('');
    }
  };

const [detailOpen, setDetailOpen] = useState(false)
const [detailInfo, setDetailInfo] = useState({})
const handleOpenDetail = (e, roaster) => {
  e.stopPropagation(); // щоб не спрацьовував клік на батьківському div
  setDetailOpen(true)
  setDetailInfo(roaster)
  console.log("Detail clicked:", roaster);

  // тут твоя логіка відкриття модалки або деталей
};

const handleCloseItem = () => {
    setDetailOpen(false);
  setDetailInfo({});
}











function addDays(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

const [snoozeLoadingId, setSnoozeLoadingId] = useState(null);
const [SnoozeLoading, setSnoozeLoading] = useState(true);


async function handleSnoozeRoaster(roasterId, days) {
  setSnoozeLoading(true)
  setSnoozeLoadingId(roasterId);

  try {
    const until = addDays(days);
    const docRef = doc(db, "moderation", "roasters");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const updatedRoasters = (data.roasters || []).map((r) => {
        if (r.id === roasterId) {
          return {
            ...r,
            isSnoozed: true,
            snoozedUntil: until,
          };
        }
        return r;
      });

      await updateDoc(docRef, { roasters: updatedRoasters });

      console.log(`✅ Roaster ${roasterId} snoozed until ${until}`);
      setRoasters((prev) => prev.filter((r) => r.id !== roasterId));
     setFindRoasters((prev) => prev.filter((r) => r.id !== roasterId));
      setSimilarRoasters((prev) => prev.filter((r) => r.id !== roasterId));
     setSelectedRoasters((prev) => prev.filter((r) => r.id !== roasterId));

      const message =
        days === 3
          ? "Successfully snoozed for 3 days"
          : days === 7
          ? "Successfully snoozed for 1 week"
          : days === 30
          ? "Successfully snoozed for 1 month"
          : `Successfully snoozed for ${days} days`;

      notifySuccess(message);


    } else {
      console.warn("⚠️ moderation/roasters doc not found");
    }
  } catch (err) {
    console.error("❌ Error snoozing roaster:", err);
  } finally {
    setSnoozeLoadingId(null);
    setSnoozeLoading(false)
  }
}






  return (
    <div className="margeModerationRoasters">
      <h1>Marge Moderation Roasters</h1>


{detailOpen ? 
<MargeRoasterDetails roasters={detailInfo} handleCloseItem={handleCloseItem}/>
 : 
<>
   
      <AnimatePresence>
        {selectedRoasters.length > 0 && (
          <motion.button
            onClick={handleOpen}
            className="margeModerationRoasters-button"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            Marge
          </motion.button>
        )}
      </AnimatePresence>

      <img
        onClick={() => setPage(1)}
        src={close}
        alt="Close"
        className="margeModerationRoasters-close"
      />
      <input
        onChange={handleSearch}
        type="text"
        placeholder="Find roasters..."
      />

      <div className="sdfsdfdsfsdfsdsdfs">
        <div className="ModerationRoasters-list">
          {findRoasters.length > 0
            ? findRoasters.map((roaster, index) => (
              <div
                key={index}
                className={`ModerationRoasters-item ${
                  selectedRoasters.some(r => r.id === roaster.id) ? 'selected' : ''
                }`}
                onClick={() => toggleSelect(roaster)}
              >
                <div className="ModerationRoasters-name">{roaster.name}</div>
                <div className="ModerationRoasters-roasterCountry">
                  Country: {roaster.records?.[0]?.countryId || 'Not specified'}
                </div>
                <div className="ModerationRoasters-recordsCount">
                  records {roaster?.records?.length || 0}
                </div>

               <div className="ModerationRoasters-recordsDetails">
  <button onClick={(e) => handleOpenDetail(e, roaster)}>Detail</button>
</div>


{(SnoozeLoading && snoozeLoadingId === roaster.id) ? (
  <div className="moderationBeansBtn-loading">
    <Clock className="moderationBeansBtn-loadingIcon" />
    <span>Loading...</span>
  </div>
) : (
  <>
    <p className="moderationBeansBtn-label">
      Snooze moderation for a specific period:
    </p>

  <div className="moderationBeansBtn-container">
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleSnoozeRoaster(roaster.id, 3);
    }}
    className="moderationBeansBtn moderationBeansBtn--3days"
  >
    <Clock className="moderationBeansBtn-icon" /> 3 days
  </button>

  <button
    onClick={(e) => {
      e.stopPropagation();
      handleSnoozeRoaster(roaster.id, 7);
    }}
    className="moderationBeansBtn moderationBeansBtn--1week"
  >
    <Clock className="moderationBeansBtn-icon" /> 1 week
  </button>

  <button
    onClick={(e) => {
      e.stopPropagation();
      handleSnoozeRoaster(roaster.id, 30);
    }}
    className="moderationBeansBtn moderationBeansBtn--1month"
  >
    <Clock className="moderationBeansBtn-icon" /> 1 month
  </button>
</div>

  </>
)}
            
              </div>
            ))
            : similarRoasters.map((roaster, index) => (
              <div
                key={index}
                className={`ModerationRoasters-item ${
                  selectedRoasters.some(r => r.id === roaster.id) ? 'selected' : ''
                }`}
                onClick={() => toggleSelect(roaster)}
              >
                <div className="ModerationRoasters-name">{roaster.name}</div>
                <div className="ModerationRoasters-roasterCountry">
                  Country: {roaster.records?.[0]?.countryId || 'Not specified'}
                </div>
                <div className="ModerationRoasters-recordsCount">
                  records {roaster?.records?.length || 0}
                </div>

                               <div className="ModerationRoasters-recordsDetails">
  <button onClick={(e) => handleOpenDetail(e, roaster)}>Detail</button>
</div>

{(SnoozeLoading && snoozeLoadingId === roaster.id) ? (
  <div className="moderationBeansBtn-loading">
    <Clock className="moderationBeansBtn-loadingIcon" />
    <span>Loading...</span>
  </div>
) : (
  <>
    <p className="moderationBeansBtn-label">
      Snooze moderation for a specific period:
    </p>

  <div className="moderationBeansBtn-container">
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleSnoozeRoaster(roaster.id, 3);
    }}
    className="moderationBeansBtn moderationBeansBtn--3days"
  >
    <Clock className="moderationBeansBtn-icon" /> 3 days
  </button>

  <button
    onClick={(e) => {
      e.stopPropagation();
      handleSnoozeRoaster(roaster.id, 7);
    }}
    className="moderationBeansBtn moderationBeansBtn--1week"
  >
    <Clock className="moderationBeansBtn-icon" /> 1 week
  </button>

  <button
    onClick={(e) => {
      e.stopPropagation();
      handleSnoozeRoaster(roaster.id, 30);
    }}
    className="moderationBeansBtn moderationBeansBtn--1month"
  >
    <Clock className="moderationBeansBtn-icon" /> 1 month
  </button>
</div>

  </>
)}
          
              </div>
            ))}
        </div>
      </div>

      {modal && (
        <div className="ModerationRoasters-modalOverlay">
          <div className="ModerationRoasters-modal">
            <img
              src={close}
              alt="close"
              className="ModerationRoasters-modalClose"
              onClick={handleCloseModal}
            />

            <div className="ModerationRoasters-modalContent">
              {selectedRoasters.map((roaster) => (
                <div key={roaster.id} className="ModerationRoasters-modalItem">
                  <div className="ModerationRoasters-modalHeader">
                    Roaster name: <span>{roaster.name}</span>
                    Country: <span>{roaster.records?.[0]?.countryId || 'Not specified'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="ModerationRoasters-roasterHeader">
              <h3 className="ModerationRoasters-roasterName">Enter new name</h3>
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
                <p className="ModerationRoasters-inputLabel">Please enter new name</p>
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

            <div className="sdafasefa">
              <div className="ModerationRoasters-modalTitle">Please select a country</div>
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
                    src={closeIcon}
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

            {selectedCountry && inputOpen.value.trim() !== '' && (
              <button
                disabled={btnLoader}
                onClick={handleAcept}
                className="MargeModerationRoasters-saveBtn"
              >
                {btnLoader ? 'Loading' : 'Save'}
              </button>
            )}
          </div>
        </div>
      )}
</>
}


    </div>
  );
};

export default MargeModerationRoasters;