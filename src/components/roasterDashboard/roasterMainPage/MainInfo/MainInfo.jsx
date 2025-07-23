import React, { useEffect, useState } from 'react';
import './MainInfo.css';
import { useDispatch, useSelector } from 'react-redux';
import editImg from '../../../../assets/edit.png';
import close from '../../../../assets/closeIcon.png';
import { countrysArray } from '../../../superAdmin/cafes/country';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../../firebase'; // шлях до твого firebase.js або firebaseConfig.js

import { doc, updateDoc} from 'firebase/firestore';
import { db } from '../../../../firebase';
import { updateBankDetails, updateBusinessInfo, updateCountry, updateDescription, updateLogo, updateName } from '../../../../store/roasterSlice';

const MainInfo = () => {
  const { roasterData } = useSelector(state => state.roaster);
  const bank = roasterData?.bank_details || {};
  const business = roasterData?.business_info || {};
  const dispatch = useDispatch()
  const [openBlock, setOpenBlock] = useState('');
  const [animationState, setAnimationState] = useState(false);
  const supportedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'tiff', 'ico'];

  const [btnVisible, setBtnVisible] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false)
  const [imageFileObject, setImageFileObject] = useState(null); 
  const [imageFile, setImageFile] = useState(null);

  
const [error, setError] = useState(null);




useEffect(() => {
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

useEffect(() => {
  if (imageFile) {
    // Через невеликий таймаут запускаємо анімацію появи кнопки
    const timer = setTimeout(() => setBtnVisible(true), 10);
    return () => clearTimeout(timer);
  } else {
    setBtnVisible(false);
  }
}, [imageFile]);


  const [formData, setFormData] = useState({
    name: roasterData.name || '',
    country: roasterData.country || '',
    description: roasterData.description || '',
    bank_name: bank.bank_name || '',
    iban: bank.iban || '',
    swift: bank.swift || '',
    currency: bank.currency || '',
    company_name: business.company_name || '',
    vat_number: business.vat_number || '',
    registration_number: business.registration_number || ''
  });

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value
    }));
  };





  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
  
    if (droppedFile) {
      const fileExtension = droppedFile.name.toLowerCase().split('.').pop();
      if (fileExtension && supportedExtensions.includes(fileExtension)) {
        setImageFile(URL.createObjectURL(droppedFile));
        setImageFileObject(droppedFile); // збереження файлу
        setError(null);
      } else {
        setError('Extension not supported');
        setImageFile(null);
        setImageFileObject(null);
      }
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
  


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      if (fileExtension && supportedExtensions.includes(fileExtension)) {
        setImageFile(URL.createObjectURL(file)); // створення URL для preview
        setImageFileObject(file); // збереження файлу
        setError(null);
      } else {
        setError('Extension not supported');
        setImageFile(null);
        setImageFileObject(null);
      }
    }
  };
  



  const toggleBlock = (blockName) => {
    if (openBlock === blockName) {
      setAnimationState(false);

      setImageFileObject(null);
      setImageFile(null);
      setError(null);

      setTimeout(() => {
        setOpenBlock('');
      }, 400);
    } else {
      setFormData({
        name: roasterData.name || '',
        country: roasterData.country || '',
        description: roasterData.description || '',
        bank_name: bank.bank_name || '',
        iban: bank.iban || '',
        swift: bank.swift || '',
        currency: bank.currency || '',
        company_name: business.company_name || '',
        vat_number: business.vat_number || '',
        registration_number: business.registration_number || ''
      })
      setOpenBlock(blockName);
      setAnimationState(false);
      setTimeout(() => {
        setAnimationState(true);
      }, 10);
    }
  };


const handleShowReduxState  = () => {
   console.log(roasterData)
}


  const handleSave = async() => {

    const roasterRef = doc(db, 'roasters', roasterData.id);


    if (openBlock === 'name') {
      await updateDoc(roasterRef, {
        name: formData.name
      });

      dispatch(updateName(formData.name));

 
      toggleBlock('');
 

      return 


    }


    if (openBlock === 'country') {
      await updateDoc(roasterRef, {
        country: formData.country
      });
    
      dispatch(updateCountry(formData.country)); // <- Потрібно додати цей редюсер у slice
    
      toggleBlock('');
      return;
    }
  
    if (openBlock === 'description') {
      await updateDoc(roasterRef, {
        description: formData.description
      });
    
      dispatch(updateDescription(formData.description));
    
      toggleBlock('');
      return;
    }
    if (openBlock === 'bank') {
      const bankDetails = {
        bank_name: formData.bank_name,
        iban: formData.iban,
        swift: formData.swift,
        currency: formData.currency,
      };
    
      await updateDoc(roasterRef, {
        'bank_details.bank_name': formData.bank_name,
        'bank_details.iban': formData.iban,
        'bank_details.swift': formData.swift,
        'bank_details.currency': formData.currency,
      });
    
      dispatch(updateBankDetails(bankDetails));
    
      toggleBlock('');
      return;
    }
    
  
    if (openBlock === 'business') {
      const businessInfo = {
        company_name: formData.company_name,
        vat_number: formData.vat_number,
        registration_number: formData.registration_number,
      };
    
      const updates = {};
      Object.entries(businessInfo).forEach(([key, value]) => {
        updates[`business_info.${key}`] = value;
      });
    
      await updateDoc(roasterRef, updates);
    
      dispatch(updateBusinessInfo(businessInfo));
    
      toggleBlock('');
      return;
    }
  
    // Закриваємо блок після збереження
    toggleBlock(openBlock);
  };
  



  const handleUploadClick = async () => {
    setImageUploadLoading(true);
    try {
      if (!imageFileObject || !roasterData?.id) return;
  
      const imageRef = ref(storage, `roasters/${roasterData.id}/logo`);
      await uploadBytes(imageRef, imageFileObject);
      const imageUrl = await getDownloadURL(imageRef);
  
      const roasterRef = doc(db, 'roasters', roasterData.id); // Додано тут
      await updateDoc(roasterRef, { logo: imageUrl }); // Виправлено з uploadDoc
      dispatch(updateLogo(imageUrl));
      setImageFile(null);
      setImageFileObject(null);
      setError(null);
      toggleBlock('');
    } catch (e) {
      console.error('Upload error:', e);
      setError('Failed to upload image');
    } finally {
      setImageUploadLoading(false); // Завжди зупиняє спінер
    }
  };
  


  return (
    <div className="roasterInfo-mainContainer">
      <div className="roasterInfo-con">
      <div className="roasterImg-roasterImg-block">
  <img src={roasterData.logo} className="roasterInfo-roasterLogo" alt="Roaster Logo" />
  <div className="roasterInfo-roasterLogoEditImg" onClick={() => toggleBlock('logo')}>
    <img src={editImg} alt="Edit" />
  </div>
</div>







        {openBlock === 'logo' && (
  <div className={`roasterInfo-invisibleBlockForName ${animationState ? 'roasterInfo-invisibleBlockForName-show' : ''}`}>
    <img onClick={() => toggleBlock('logo')} src={close} alt="Close" />
    <p>Edit logo</p>
 




    <div
  className="roasterInfo-logoUploadBlock"
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  onDragEnter={handleDragEnter}
  onDragLeave={handleDragLeave}
>
  <label htmlFor="roasterInfo-logoUploader" className="roasterInfo-uploadLabel">
    Upload Logo
  </label>
  <input
    type="file"
    name="imageUrl"
    id="roasterInfo-logoUploader"
    className="roasterInfo-fileInput"
    accept="image/*"
    onChange={handleImageChange}
  />
  
  {imageFile && (
    <img
      src={imageFile}
      alt="Uploaded Preview"
      className="roasterInfo-logoPreview"
    />
  )}

  {!imageFile && !error && (
    <p className="roasterInfo-uploadHint">
      Drag and drop a file or select it via the button
    </p>
  )}
  
{imageFile && (
  <button
     disabled={imageUploadLoading}
    className={`roasterInfo-uploadBtn ${btnVisible ? 'show' : ''}`}
    onClick={handleUploadClick}
  >
    {imageUploadLoading ? 'Loading...' : 'Upload'}
  </button>
)}



  {error && <p className="roasterInfo-uploadError">{error}</p>}
</div>



  </div>
)}








        <div className="roasterInfo-roasterName-block">
          <div className="roasterInfo-roasterName">{roasterData.name}</div>
          <img onClick={() => toggleBlock('name')} src={editImg} alt="Edit" />
        </div>

        {openBlock === 'name' && (
          <div className={`roasterInfo-invisibleBlockForName ${animationState ? 'roasterInfo-invisibleBlockForName-show' : ''}`}>
            <img onClick={() => toggleBlock('name')} src={close} alt="Close" />
            <p>Enter new name</p>
            <input
              type="text"
              placeholder="Enter new name"
              value={formData.name}
              onChange={handleChange('name')}
            />
            <button onClick={handleSave}>Save</button>
          </div>
        )}

        <div className="roasterCountry-roasterCountry-block">
          <div className="roasterInfo-roasterCountry">{roasterData.country}</div>
          <img onClick={() => toggleBlock('country')} src={editImg} alt="Edit" />
        </div>

        {openBlock === 'country' && (
          <div className={`roasterInfo-invisibleBlockForName ${animationState ? 'roasterInfo-invisibleBlockForName-show' : ''}`}>
            <img onClick={() => toggleBlock('country')} src={close} alt="Close" />
            <p>Enter new country</p>
            <select className="roasterInfo-countrySelect" value={formData.country} onChange={handleChange('country')}>
              {countrysArray.map((country, index) => (
                <option key={index} value={country}>{country}</option>
              ))}
            </select>
            <button onClick={handleSave}>Save</button>
          </div>
        )}

        <div className="roasterInfo-roasterDescription-block largeDescriptionBlock">
          <div className="roasterInfo-descriptionEditIcon" onClick={() => toggleBlock('description')}>
            <img src={editImg} alt="Edit" />
          </div>
          <div className="roasterInfo-roasterDescription">
            {roasterData.description}
          </div>
        </div>

        {openBlock === 'description' && (
          <div className={`roasterInfo-invisibleBlockForName roasterInfo-descriptionEditBlock ${animationState ? 'roasterInfo-invisibleBlockForName-show' : ''}`}>
            <img onClick={() => toggleBlock('description')} src={close} alt="Close" />
            <p>Edit description</p>
            <textarea
              className="roasterInfo-descriptionTextArea"
              placeholder="Enter new description"
              rows={6}
              value={formData.description}
              onChange={handleChange('description')}
            />
            <button onClick={handleSave}>Save</button>
          </div>
        )}

        <div className="roasterInfo-bankDetails-wrapper">
          <div className="roasterInfo-editIcon--bank" onClick={() => toggleBlock('bank')}>
            <img src={editImg} alt="Edit" />
          </div>
          <h3 className="roasterInfo-sectionTitle">Banking Information</h3>
          <p><strong>Bank Name:</strong> {bank.bank_name || '-'}</p>
          <p><strong>IBAN:</strong> {bank.iban || '-'}</p>
          <p><strong>SWIFT:</strong> {bank.swift || '-'}</p>
          <p><strong>Currency:</strong> {bank.currency || '-'}</p>
          <p><strong>Payment Methods:</strong> {(bank.payment_methods || []).join(', ') || '-'}</p>
        </div>

        {openBlock === 'bank' && (
          <div className={`roasterInfo-invisibleBlockForName ${animationState ? 'roasterInfo-invisibleBlockForName-show' : ''}`}>
            <img onClick={() => toggleBlock('bank')} src={close} alt="Close" />
            <p>Edit bank details</p>

            <h5 className="roasterInfo-inputLabel">Bank Name</h5>
            <input type="text" value={formData.bank_name} onChange={handleChange('bank_name')} />

            <h5 className="roasterInfo-inputLabel">IBAN</h5>
            <input type="text" value={formData.iban} onChange={handleChange('iban')} />

            <h5 className="roasterInfo-inputLabel">SWIFT</h5>
            <input type="text" value={formData.swift} onChange={handleChange('swift')} />

            <h5 className="roasterInfo-inputLabel">Currency</h5>
            <select className="roasterInfo-countrySelect" value={formData.currency} onChange={handleChange('currency')}>
              {[
                'USD', 'EUR', 'GBP', 'AUD', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK',
                'HKD', 'HUF', 'ILS', 'JPY', 'MYR', 'MXN', 'TWD', 'NZD', 'NOK',
                'PHP', 'PLN', 'SGD', 'SEK', 'CHF', 'THB'
              ].map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>

            <button onClick={handleSave}>Save</button>
          </div>
        )}

        <div className="roasterInfo-businessInfo-wrapper">
          <div className="roasterInfo-editIcon--business" onClick={() => toggleBlock('business')}>
            <img src={editImg} alt="Edit" />
          </div>
          <h3 className="roasterInfo-sectionTitle">Business Information</h3>
          <p><strong>Company Name:</strong> {business.company_name || '-'}</p>
          <p><strong>VAT Number:</strong> {business.vat_number || '-'}</p>
          <p><strong>Registration Number:</strong> {business.registration_number || '-'}</p>
        </div>

        {openBlock === 'business' && (
          <div className={`roasterInfo-invisibleBlockForName ${animationState ? 'roasterInfo-invisibleBlockForName-show' : ''}`}>
            <img onClick={() => toggleBlock('business')} src={close} alt="Close" />
            <p>Edit business information</p>

            <h5 className="roasterInfo-inputLabel">Company Name</h5>
            <input type="text" value={formData.company_name} onChange={handleChange('company_name')} />

            <h5 className="roasterInfo-inputLabel">VAT Number</h5>
            <input type="text" value={formData.vat_number} onChange={handleChange('vat_number')} />

            <h5 className="roasterInfo-inputLabel">Registration Number</h5>
            <input type="text" value={formData.registration_number} onChange={handleChange('registration_number')} />

            <button onClick={handleSave}>Save</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainInfo;
