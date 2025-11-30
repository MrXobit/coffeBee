// ModerationRoaster.jsx
import React, { useEffect, useState } from "react";
import "./ModerationBeans.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import noImage from "../../../assets/noImage.jpeg"; // підстав правильний шлях
import { db, storage } from "../../../firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import close from '../../../assets/close.png';
import edit from '../../../assets/edit.png';
import { CountryArray } from '../roasters/data';
import closeIcon from '../../../assets/closeIcon.png';

const ModerationRoaster = ({ currentBeans, bean, setIsBeanAddable, roasterLoading, setRoasterLoading }) => {
  const [roaster, setRoaster] = useState(null);
 
  const [recordsData, setRecordsData] = useState([]);

    const notifySuccess = (message) => toast.success(message);
    const notifyError = (message) => toast.error(message);
  
 const [inputOpen, setInput] = useState({ open: false, value: '' });

  const [selectedCountry, setSelectedCountry] = useState('');
    const [btnLoader, setBtnLoader] = useState(false);
 
    const [modal, setMoadal] = useState(false);

    const [imageFile, setImageFile] = useState(null);   // сам файл
    const [imageUrl, setImageUrl] = useState(null); 

  const getRoasterData = async () => {
    setRoasterLoading(true);

    try {
      const roasterId = bean?.roaster;
      if (!roasterId) {
        setRoaster({ notFound: true, source: "noId" });
        return;
      }

      let roasterData = null;

      // === 1. Основна колекція ===
      const roasterRef = doc(db, "roasters", roasterId);
      const roasterSnap = await getDoc(roasterRef);

      if (roasterSnap.exists()) {
        roasterData = {
          id: roasterSnap.id,
          source: "roasters",
          ...roasterSnap.data(),
        };
        setIsBeanAddable(true)
      } else {
        // === 2. Модерація ===
        const modRef = doc(db, "moderation", "roasters");
        const modSnap = await getDoc(modRef);

        if (modSnap.exists()) {
          const found = (modSnap.data().roasters || []).find(
            (r) => r.id === roasterId
          );
          if (found) {
            roasterData = { ...found, source: "moderation" };
          }
        }
      }

      if (!roasterData) {
        setRoaster({ notFound: true, source: "notFound" });
        return;
      }

      let results = [];
      if (roasterData.source === "moderation" && roasterData.records?.length) {
        for (const record of roasterData.records) {
          const cafeId = record.cafeId;

          if (cafeId === "defaultCafe") {
            results.push({ ...record, cafe: "defaultCafe" });
            continue;
          }

          const cafeRef = doc(db, "cafe", cafeId);
          const cafeSnap = await getDoc(cafeRef);
          if (cafeSnap.exists()) {
            results.push({
              ...record,
              cafe: { id: cafeSnap.id, ...cafeSnap.data() },
              cafeFromModeration: false,
            });
            continue;
          }

          const modCafeRef = doc(db, "moderationCafe", cafeId);
          const modCafeSnap = await getDoc(modCafeRef);
          if (modCafeSnap.exists()) {
            results.push({
              ...record,
              cafe: { id: modCafeSnap.id, ...modCafeSnap.data() },
              cafeFromModeration: true,
            });
            continue;
          }

          results.push({ ...record, cafe: "noData" });
        }
      }

      setRoaster(roasterData);
      if (roasterData.source === "moderation") {
        setRecordsData(results);
      } else {
        setRecordsData([]);
      }
    } catch (e) {
      console.error("Error fetching roaster:", e);
      setRoaster({ notFound: true, source: "error" });
    } finally {
      setRoasterLoading(false);
    }
  };

  useEffect(() => {
    getRoasterData();
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) return "";
    let date;
    try {
      if (dateValue?.seconds) {
        date = new Date(dateValue.seconds * 1000);
      } else if (typeof dateValue === "number") {
        date = dateValue < 1e12 ? new Date(dateValue * 1000) : new Date(dateValue);
      } else if (typeof dateValue === "string") {
        let cleanString = dateValue.split(".")[0].replace(" ", "T");
        date = isNaN(new Date(cleanString).getTime())
          ? new Date(dateValue)
          : new Date(cleanString);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        date = new Date(dateValue);
      }
      if (isNaN(date.getTime())) return String(dateValue);
      return date.toLocaleString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateValue);
    }
  };


  const handleOpenModal = () => {
    if (!roaster) return;
    if (modal) return;
    setMoadal(true);
    if (roaster.records?.[0]?.countryId) {
      setSelectedCountry(roaster.records[0].countryId);
    } else {
      setSelectedCountry('');
    }
  };

  const handleCloseModal = () => {
    setMoadal(false);
    setSelectedCountry('');
      setImageFile(null);   // очищаємо файл
  setImageUrl(null);    // очищаємо прев’ю
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

  setRoaster({
  ...roasterData,
  source: "roasters", 
});
setRecordsData([]); 
setIsBeanAddable(true)

    notifySuccess('Roaster successfully approved!');
  } catch (e) {
    console.log(e);
    notifyError('An error occurred. Please try again later.');
  } finally {
    setMoadal(false);
    setBtnLoader(false);
    setSelectedCountry('');
    setImageUrl(null);   // очищаємо прев’ю
    setImageFile(null);  // очищаємо файл
  }
};

const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  }
};




  return (
    <div className="ModerationBeans-roasterData">
      {roasterLoading ? (
        <p className="ModerationBeans-roasterLoading">Loading roaster data...</p>
      ) : !roaster || roaster.notFound ? (
        <p className="ModerationBeans-roasterNotFound">🚫 Roaster not found</p>
      ) : roaster.source === "roasters" ? (
        // === CASE 1: З основної колекції ===
        <div className="ModerationBeans-roasterInfo">
                    <h1 className="MargeRoasterDetails-con-roasterH1">
  Roaster Verified
</h1>
          <div className="ModerationBeans-roasterHeader">
         <img
  src={roaster.logo ? roaster.logo : noImage}
  alt={roaster.name || "No image"}
  className="ModerationBeans-roasterLogo"
/>

            {roaster.name && (
              <h2 className="ModerationBeans-roasterName">{roaster.name}</h2>
            )}

<p
  className={`ModerationBeans-roasterCountry ${
    roaster.countryId ? "country-set" : "country-empty"
  }`}
>
  {roaster.countryId ? roaster.countryId : "Country not specified"}
</p>


            {roaster.description && (
              <p className="ModerationBeans-roasterDesc">{roaster.description}</p>
            )}
          </div>
        </div>
      ) : (
        // === CASE 2: З модерації ===
       
        <div className="MargeRoasterDetails-con">
          <h1 className="MargeRoasterDetails-con-roasterH1">
  Roaster Under Review
</h1>

          <div className="MargeRoasterDetails-header">
            <img
              src={roaster.logoUrl || noImage}
              alt={roaster.name || "Roaster"}
              className="MargeRoasterDetails-logo"
            />
            <div>
              <h2 className="MargeRoasterDetails-name">{roaster.name}</h2>
              <p className="MargeRoasterDetails-country">
                {roaster.country || "Unknown country"}
              </p>
            </div>
            <div className="ModerationRoasters-recordsCount">
              records {roaster?.records?.length || 0}
            </div>
          </div>

          <h1 className="MargeRoasterDetails-title">Records Details</h1>
          {recordsData.length === 0 ? (
            <div className="MargeRoasterDetails-empty">
              <div className="MargeRoasterDetails-emptyCircle">☕</div>
              <h2 className="MargeRoasterDetails-emptyTitle">Nothing to brew yet</h2>
              <p className="MargeRoasterDetails-emptySubtitle">
                This roaster hasn’t shared any records.
                <br />
                Come back later for a fresh cup of updates!
              </p>
            </div>
          ) : (
            <div className="MargeRoasterDetails-list">
              {recordsData.map((record, index) => {
                let cafeStatus = "No data";
                if (record.cafe === "defaultCafe") cafeStatus = "From Home";
                else if (record.cafeFromModeration === true)
                  cafeStatus = "From Moderation";
                else if (record.cafeFromModeration === false)
                  cafeStatus = "Verified Cafe";

                return (
                  <div key={index} className="MargeRoasterDetails-recordBlock">
                    <div className="MargeRoasterDetails-recordHeader">
                      <p className="MargeRoasterDetails-recordText">
                        Country: {record.countryId || "Not specified"}
                      </p>
                      <p className="MargeRoasterDetails-recordText">
                        Time: {formatDate(record.date)}
                      </p>
                    </div>
                    <div className="MargeRoasterDetails-cafeBlock">
                      <h3 className="MargeRoasterDetails-cafeTitle">Cafe</h3>
                      <p className="MargeRoasterDetails-cafeStatus">
                        Status: {cafeStatus}
                      </p>
                      {record.cafe &&
                      record.cafe !== "defaultCafe" &&
                      record.cafe !== "noData" ? (
                        <div className="MargeRoasterDetails-cafeInfo">
                          <img
                            src={
                              record.cafe?.adminData?.photos &&
                              Object.values(record.cafe.adminData.photos).length > 0
                                ? Object.values(record.cafe.adminData.photos)[0]
                                : noImage
                            }
                            alt="Cafe"
                            className="MargeRoasterDetails-cafeImg"
                          />
                          <div className="MargeRoasterDetails-cafeText">
                            <p className="MargeRoasterDetails-cafeName">
                              {record.cafe.name}
                            </p>
                            <p className="MargeRoasterDetails-cafeDescription">
                              {record.cafe.vicinity}, {record.cafe.city},{" "}
                              {record.cafe.country}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="MargeRoasterDetails-cafeNoData">
                          No cafe data available
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* кнопка прийняття */}
     <div className="ModerationRoasters-actions">
  <button onClick={handleOpenModal} className="ModerationRoasters-approveBtn">
  <span className="whiteCheck">✔</span> Accept Roaster
</button>

</div>

        </div>
      )}



      {(modal && roaster.source === "moderation") && (
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


    </div>
  );
};

export default ModerationRoaster;
