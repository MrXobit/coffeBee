import React, { useEffect, useState } from 'react';
import { CountryArray, CurrencyArray, socialMediaLinks } from '../data';
import { AiFillFacebook, AiFillInstagram, AiFillLinkedin } from 'react-icons/ai';
import { SiTiktok, SiReddit } from 'react-icons/si';
import { FaWhatsapp, FaYoutube, FaSnapchat, FaTelegram } from 'react-icons/fa';
import { BsDiscord } from 'react-icons/bs';
import { RiWechatFill } from 'react-icons/ri';
import close from '../../../../assets/close.png';
import { v4 as uuidv4 } from 'uuid';
import { db, storage } from '../../../../firebase';
import { doc, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes,  } from 'firebase/storage';
import { set } from 'firebase/database';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditRoaster = () => {
  const [socialInput, setSocialInput] = useState('');
  const [socials, setSocials] = useState({});

  const navigate = useNavigate()
  const [shippingAvailable, setShippingAvailable] = useState(true);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageFileObject, setImageFileObject] = useState(null); 
  const supportedExtensions = ['jpg', 'jpeg', 'png'];
  const [paymentMethods, setPaymentMethods] = useState({
    0: "bank_transfer",
    1: "paypal"
  });
  const [loading, setLoading] = useState(false);
 const location = useLocation();
  const roaster = location.state?.roasterData || null;

  const [formData, setFormData] = useState({
    name: '',
    country: '',
    description: '',
    website: '',
    shop: '',
    contactEmail: '',
    contactPhone: '',
    companyName: '',
    registrationNumber: '',
    vatNumber: '',
    bankName: '',
    iban: '',
    swift: '',
    accountHolderName: '',
    accountHolderAddress: '',
    taxId: '',
    currency: 'usd',
    paymentMethod: 'bank_transfer',
    shippingAvailable: false,
  });



  



  const popularSocials = {
    'facebook': <AiFillFacebook size={24}/>,
    'instagram': <AiFillInstagram size={24}/>,
    'linkedin': <AiFillLinkedin size={24}/>,
    'tiktok': <SiTiktok size={24}/>,
    'reddit': <SiReddit size={24}/>,
    'whatsapp': <FaWhatsapp size={24}/>,
    'youtube': <FaYoutube size={24}/>,
    'snapchat': <FaSnapchat size={24}/>,
    'discord': <BsDiscord size={24}/>,
    'telegram': <FaTelegram size={24}/>,
    'wechat': <RiWechatFill size={24}/>
  };

  const addSocialInput = () => {
    Object.entries(socialMediaLinks).forEach(([platform, url]) => {
      if (socialInput.startsWith(url)) {
        setSocials((prevSocials) => ({
          ...prevSocials,
          [platform]: socialInput,  
        }));
        console.log(socials);
      }
    });
    setSocialInput('');
  };



  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  useEffect(() => {

    setFormData({
        name: roaster.name || '',
        country: roaster.country || '',
        description: roaster.description || '',
        website: roaster.website || '',
        shop: roaster.shop || '',
        contactEmail: roaster.contact?.email || '',
        contactPhone: roaster.contact?.phone || '',
        companyName: roaster.business_info?.company_name || '',
        registrationNumber: roaster.business_info?.registration_number || '',
        vatNumber: roaster.business_info?.vat_number || '',
        bankName: roaster.bank_details?.bank_name || '',
        iban: roaster.bank_details?.iban || '',
        swift: roaster.bank_details?.swift || '',
        accountHolderName: roaster.bank_details?.account_holder_name || '',
        accountHolderAddress: roaster.bank_details?.account_holder_address || '',
        taxId: roaster.bank_details?.tax_id || '',
        currency: roaster.bank_details?.currency || 'usd',
      });

     

      
      if (roaster.socials && typeof roaster.socials === 'object' && Object.keys(roaster.socials).length > 0) {
        setSocials(roaster.socials);
      }
      
      if (roaster.payment_methods && typeof roaster.payment_methods === 'object') {
        setPaymentMethods(roaster.payment_methods);
   
      }
      setShippingAvailable(roaster.shipping_available)
      if (
        roaster.payment_methods &&
        typeof roaster.payment_methods === 'object' &&
        Object.keys(roaster.payment_methods).length > 0
      ) {
        setPaymentMethods(roaster.payment_methods);
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



  const handlePaymentMethodChange = (event) => {
    const { value } = event.target;
    if(value === 'paypal') {
      setPaymentMethods({
        1: "paypal",
        0: "bank_transfer"
      });
    } else {
      setPaymentMethods({
        0: "paypal",
        1: "bank_transfer"
      });
    }
  };

  const handleDeleteSocial = (urlToDelete) => {
    setSocials((prevSocials) => {
      const updatedSocials = { ...prevSocials };

      const platformToDelete = Object.keys(updatedSocials).find(
        (platform) => updatedSocials[platform] === urlToDelete
      );

      if (platformToDelete) {
        delete updatedSocials[platformToDelete];
      }

      return updatedSocials;
    });
  };

  const handleEditRoaster = async(e) => {
    e.preventDefault();
    setLoading(true);
    try {

        const token = localStorage.getItem('token');
    
        const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/validAccesAdmin', {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (response.data.access) {
          try {
            const errors = {};

            if (!imageFileObject && !roaster.logo) {
              errors.image = 'Image is required';
            }
            
            if (!formData.name) errors.name = 'Name is required';
            if (!formData.country) errors.country = 'Country is required';
            if (!formData.description) errors.description = 'Description is required';
            if (!formData.website) errors.website = 'Website is required';
            if (!formData.shop) errors.shop = 'Shop is required';
            if (!formData.contactEmail) errors.contactEmail = 'Email is required';
            if (!formData.contactPhone) errors.contactPhone = 'Phone number is required';
            if (!formData.companyName) errors.companyName = 'Company name is required';
            if (!formData.registrationNumber) errors.registrationNumber = 'Registration number is required';
            if (!formData.vatNumber) errors.vatNumber = 'VAT number is required';
            if (!formData.bankName) errors.bankName = 'Bank name is required';
            if (!formData.iban) errors.iban = 'IBAN is required';
            if (!formData.swift) errors.swift = 'SWIFT/BIC is required';
            if (!formData.accountHolderName) errors.accountHolderName = 'Account holder name is required';
            if (!formData.accountHolderAddress) errors.accountHolderAddress = 'Account holder address is required';
            if (!formData.taxId) errors.taxId = 'Tax ID is required';
            if (!formData.currency) errors.currency = 'Currency is required';
            
            if (Object.keys(errors).length > 0) {
              setError(errors);
              return;
            }
            let imageUrl = ''
            if(imageFile) {
                   const logoRef = ref(storage, `roasters/${roaster.id}/`);
                          const fileList = await listAll(logoRef);
                          const logoFiles = fileList.items.filter(item => item.name.startsWith('logo'));
                  
                          if (logoFiles.length > 0) {
                            const firstLogoFile = logoFiles[0];
                            await deleteObject(firstLogoFile);
                          }
                 const imageRef = ref(storage, `roasters/${roaster.id}/logo`);
                    await uploadBytes(imageRef, imageFileObject);
                    imageUrl = await getDownloadURL(imageRef);             
            } else{
               imageUrl = roaster.logo
            }
    
            const newRoaster = {
                id: roaster.id,
                name: formData.name,
                countryId: formData.country.toLocaleLowerCase() + '-id',
                country: formData.country,
                description: formData.description,
                website: formData.website,
                shop: formData.shop,
                socials: socials,
                logo: imageUrl,
                contact: {
                  email: formData.contactEmail,
                  phone: formData.contactPhone
                },
                business_info: {
                  company_name: formData.companyName,
                  registration_number: formData.registrationNumber,
                  vat_number: formData.vatNumber,
                },
                bank_details: {
                  bank_name: formData.bankName,
                  iban: formData.iban,
                  swift: formData.swift,
                  account_holder_name: formData.accountHolderName,
                  account_holder_address: formData.accountHolderAddress,
                  tax_id: formData.taxId,
                  currency: formData.currency,
                },
                payment_methods: paymentMethods,
                shipping_available: shippingAvailable
              };
    
              const roasterRef = doc(db, 'roasters', roaster.id);
              await setDoc(roasterRef, newRoaster);
    
              setFormData({
                name: '',
                country: '',
                description: '',
                website: '',
                shop: '',
                contactEmail: '',
                contactPhone: '',
                companyName: '',
                registrationNumber: '',
                vatNumber: '',
                bankName: '',
                iban: '',
                swift: '',
                accountHolderName: '',
                accountHolderAddress: '',
                taxId: '',
                currency: 'usd',
                paymentMethod: 'bank_transfer',
                shippingAvailable: false,
              });
              setSocials({});
              setImageFile(null);
              setImageFileObject(null);
              setPaymentMethods({
                0: "bank_transfer",
                1: "paypal"
              });
        
              setSocialInput('');
              setShippingAvailable(true);
              navigate('/super-admin')
          } catch (error) {
            console.error('Помилка під час видалення обжарщика та картинки:', error);
          }
        } else {
            setError({ general: 'You are not authorized to perform this action' });
            setLoading(false);
            return;
        }
    
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];

    if (droppedFile) {
      const fileExtension = droppedFile.name.toLowerCase().split('.').pop();
      if (fileExtension && supportedExtensions.includes(fileExtension)) {
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
    <div className="add-new-roaster-container">
      <h1 className="add-new-roaster-title">Edit Roaster</h1>
      <form onSubmit={handleEditRoaster} className="add-new-roaster-form">
        
        <div className="add-new-roaster-form-section">
          <label htmlFor="name" className="add-new-roaster-form-label">Name</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter roaster name"
            className="add-new-roaster-form-input-name"
          />
        </div>
  
        <div className="add-new-roaster-form-section">
          <label htmlFor="country" className="add-new-roaster-form-label">Country</label>
          <select
            id="country"
            value={formData.country}
            onChange={handleInputChange}
            className="add-new-roaster-form-input-select"
          >
            {CountryArray.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
  
        <div className="add-new-roaster-form-section">
          <label htmlFor="description" className="add-new-roaster-form-label">Description</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={handleInputChange}
            className="add-new-roaster-form-input-textarea"
          />
        </div>
  
        <div className="add-new-roaster-form-section">
          <label htmlFor="website" className="add-new-roaster-form-label">Website</label>
          <input
            id="website"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="Enter website URL"
            className="add-new-roaster-form-input-website"
          />
        </div>
  
        <div className="add-new-roaster-form-section">
          <label htmlFor="shop" className="add-new-roaster-form-label">Shop</label>
          <input
            id="shop"
            value={formData.shop}
            onChange={handleInputChange}
            placeholder="Enter Shop URL"
            className="add-new-roaster-form-input-shop"
          />
        </div>
  
        <div className="add-new-roaster-form-section">
          <label className="add-new-roaster-form-label">Socials</label>
          <div className="add-new-roaster-form-section-socials-btnInput-con">
            <input
              value={socialInput} 
              onChange={e => setSocialInput(e.target.value)} 
              type="text" 
              placeholder='Enter social Url' 
            />
            <button
              type="button"
              className="add-new-social-button"
              onClick={addSocialInput}
            >
              Add new Social
            </button>
          </div>
          
          <div className="add-new-roaster-form-socials-inputs-container">
            {Object.entries(socials).map(([platform, url]) => (
              <div className='add-new-roaster-form-socials-block' key={platform}>
                {popularSocials[platform]} 
                <strong className='add-new-roaster-form-socials-strong-platform'>{platform}:</strong> {url}
                <img onClick={() => handleDeleteSocial(url)} src={close} alt="" />
              </div>
            ))}
          </div>
        </div>
  
        <div className="add-new-roaster-form-section">
          <label htmlFor="contactEmail" className="add-new-roaster-form-label">Contact</label>
          <input
            id="contactEmail"
            value={formData.contactEmail}
            onChange={handleInputChange}
            className="add-new-roaster-form-input-contact"
            placeholder="Enter email"
          />
          <input
            id='contactPhone'
            value={formData.contactPhone}
            onChange={handleInputChange}
            className="add-new-roaster-form-input-contact"
            placeholder="Enter phone number"
          />
        </div>
  
        <div className="add-new-roaster-form-section">
          <label className="add-new-roaster-form-label">Business Info</label>
  
          <label htmlFor="companyName" className="add-new-roaster-form-label">Company Name</label>
          <input
            id="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            className="add-new-roaster-form-input-business-info"
            placeholder="Company name"
          />
  
          <label htmlFor="registrationNumber" className="add-new-roaster-form-label">Registration Number</label>
          <input
            id="registrationNumber"
            value={formData.registrationNumber}
            onChange={handleInputChange}
            className="add-new-roaster-form-input-business-info"
            placeholder="Registration number"
          />
  
          <label htmlFor="vatNumber" className="add-new-roaster-form-label">Vat Number</label>
          <input
            id="vatNumber"
            value={formData.vatNumber}
            onChange={handleInputChange}
            className="add-new-roaster-form-input-business-info"
            placeholder="Vat number"
          />
        </div>
  
        <div className="add-new-roaster-form-section">
          <label className="add-new-roaster-form-label">Bank Details</label>
          <div className="add-new-roaster-form-bank-details-container">
            <div className="add-new-roaster-form-bank-field">
              <label htmlFor="bankName" className="add-new-roaster-form-label">Bank Name</label>
              <input
                id="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                className="add-new-roaster-form-input-bank"
                placeholder="Enter bank name (e.g., Banco Portugal)"
              />
            </div>
  
            <div className="add-new-roaster-form-bank-field">
              <label htmlFor="iban" className="add-new-roaster-form-label">IBAN</label>
              <input
                id="iban"
                value={formData.iban}
                onChange={handleInputChange}
                className="add-new-roaster-form-input-bank"
                placeholder="Enter IBAN"
              />
            </div>
  
            <div className="add-new-roaster-form-bank-field">
              <label htmlFor="swift" className="add-new-roaster-form-label">SWIFT</label>
              <input
                id="swift"
                value={formData.swift}
                onChange={handleInputChange}
                className="add-new-roaster-form-input-bank"
                placeholder="Enter SWIFT/BIC code"
              />
            </div>
  
            <div className="add-new-roaster-form-bank-field">
              <label htmlFor="accountHolderName" className="add-new-roaster-form-label">Account Holder Name</label>
              <input
                id="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleInputChange}
                className="add-new-roaster-form-input-bank"
                placeholder="Enter full name of account holder"
              />
            </div>
  
            <div className="add-new-roaster-form-bank-field">
              <label htmlFor="accountHolderAddress" className="add-new-roaster-form-label">Account Holder Address</label>
              <input
                id="accountHolderAddress"
                value={formData.accountHolderAddress}
                onChange={handleInputChange}
                className="add-new-roaster-form-input-bank"
                placeholder="Enter full address of account holder"
              />
            </div>
  
            <div className="add-new-roaster-form-bank-field">
              <label htmlFor="taxId" className="add-new-roaster-form-label">Tax ID</label>
              <input
                id="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                className="add-new-roaster-form-input-bank"
                placeholder="Enter tax identification number"
              />
            </div>
  
            <div className="add-new-roaster-form-bank-field">
              <label htmlFor="currency" className="add-new-roaster-form-label">Currency</label>
              <select
                id="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="add-new-roaster-form-input-select"
              >
                {CurrencyArray.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
  
        <div
  className="add-new-roaster-beans-for-img-con"
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
    className="add-new-roaster-input-file-upload-ultimate"
    accept="image/*"
    onChange={handleImageChange}
  />
  {roaster.logo && (
    <img
    src={imageFile ? imageFile : roaster.logo} 
      alt="Uploaded Preview"
      className="add-new-roaster-beans-preview-image-ultimate"
    />
  )}
  {!imageFile && !error && (
    <p className="add-new-roaster-beans-upload-prompt">
      Drag and drop a file or select it via the button
    </p>
  )}
</div>




  
        <div className="add-new-roaster-form-section">
          <label className="add-new-roaster-form-label">Payment Methods</label>
          <div className="add-new-roaster-form-payment-methods-options">
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="bank_transfer"
                checked={paymentMethods[1] === 'bank_transfer'}
                onChange={handlePaymentMethodChange}
              />
              Bank Transfer
            </label>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="paypal"
                checked={paymentMethods[1] === 'paypal'}
                onChange={handlePaymentMethodChange}
              />
              PayPal
            </label>
          </div>
        </div>
  
        <div className="add-new-roaster-form-section">
          <label className="add-new-roaster-form-label">Shipping Available</label>
          <label className="add-new-roaster-form-shipping-available-switch">
            <input
              type="checkbox"
              checked={shippingAvailable}
              onChange={e => setShippingAvailable(prev => !prev)}
            />
            <span className="add-new-roaster-form-shipping-available-slider"></span>
          </label>
        </div>
  
        {error && (
          <div className="add-new-roaster-form-form-errors">
            {Object.entries(error).map(([field, message]) => (
              <div key={field} className="add-new-roaster-orm-error-message">{message}</div>
            ))}
          </div>
        )}
        
        <button disabled={loading} className='add-new-roaster-main-btn'>
          {loading ? 'loading...' : 'Edit Roaster'}
        </button>
      </form>
    </div>
  );
}  

export default EditRoaster;

