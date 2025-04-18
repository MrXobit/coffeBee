import React, { useEffect, useState } from 'react';
import './Contact.css';
import axios from 'axios';
import SubLoader from '../../loader/SubLoader';
import { db } from '../../../firebase'; 
import { doc, getDoc } from 'firebase/firestore';


import { AiFillFacebook, AiFillInstagram, AiFillLinkedin } from 'react-icons/ai';
import { SiTiktok, SiReddit } from 'react-icons/si';
import { FaWhatsapp, FaYoutube, FaSnapchat, FaTelegram } from 'react-icons/fa';
import { BsDiscord } from 'react-icons/bs';
import { RiWechatFill } from 'react-icons/ri';
import close from '../../../assets/close.png';
import { socialMediaLinks } from '../../superAdmin/roasters/data';


const Contact = ({cafeData}) => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

 const [socialInput, setSocialInput] = useState('');
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

   const [socials, setSocials] = useState({});

  useEffect(() => {
console.log(cafeData?.adminData?.contacts?.socials)
    if(cafeData) {
      setData(cafeData);
      setPhone(cafeData?.adminData?.contacts?.phone || '');
      setEmail(cafeData?.adminData?.contacts?.email || ''); 
      setWebsite(cafeData?.adminData?.contacts?.website || '');
      setSocials(cafeData?.adminData?.contacts?.socials || {})
    }

    // const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
    // if (selectedCafe) {
    //   setData(selectedCafe);
    //   setPhone(selectedCafe?.adminData?.contacts?.phone || '');
    //   setEmail(selectedCafe?.adminData?.contacts?.email || ''); 
    //   setWebsite(selectedCafe?.adminData?.contacts?.website || '');
    //   setInstagram(selectedCafe?.adminData?.contacts?.socials?.instagram || '');
    //   setFacebook(selectedCafe?.adminData?.contacts?.socials?.facebook || '');
    // }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Важливо, щоб форма не перезавантажувала сторінку

    setLoading(true);
    setError(null);

    // Перевірка, чи хоча б один параметр передано
    if (!phone.trim() && !email.trim() && !website.trim() && !instagram.trim() && !facebook.trim()) {
      setError('At least one contact detail (phone, email, website, or social media) is required.');
      setLoading(false);
      return;
    }

    // Формуємо об'єкт, щоб не передавати порожні значення
    const requestData = {
      cafeId: data.id,
      ...(email && { email }),
      ...(phone && { phone }),
      ...(website && { website }),
      ...(socials && { socials }),
    };



    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'https://us-central1-coffee-bee.cloudfunctions.net/updateContacts',
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
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
      console.log(e);
      if (e.response && e.response.data && e.response.data.message) {
        setError(e.response.data.message);
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return <SubLoader />;
  }

  return (
    <div className="contact-form-wrapper">
      <h2 className="contact-form-title">Update Contact Information</h2>
      <form className="contact-form">
        <label className="contact-form-label">
          Phone:
          <input className="contact-form-input" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" />
        </label>
        <label className="contact-form-label">
          Email:
          <input className="contact-form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email address" />
        </label>
        <label className="contact-form-label">
          Website:
          <input className="contact-form-input" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Enter website URL" />
        </label>
  

  {/* тут стилі взяв з Addnewroaster.css */}

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

        <button className="contact-form-button" disabled={loading} onClick={handleSubmit}>
          {loading ? "Loading..." : 'Update Contacts'}
        </button>
        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
};

export default Contact;
