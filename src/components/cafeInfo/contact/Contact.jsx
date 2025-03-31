import React, { useEffect, useState } from 'react';
import './Contact.css';
import axios from 'axios';
import SubLoader from '../../loader/SubLoader';
import { db } from '../../../firebase'; 
import { doc, getDoc } from 'firebase/firestore';


const Contact = () => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
    if (selectedCafe) {
      setData(selectedCafe);
      setPhone(selectedCafe?.adminData?.contacts?.phone || '');
      setEmail(selectedCafe?.adminData?.contacts?.email || ''); 
      setWebsite(selectedCafe?.adminData?.contacts?.website || '');
      setInstagram(selectedCafe?.adminData?.contacts?.socials?.instagram || '');
      setFacebook(selectedCafe?.adminData?.contacts?.socials?.facebook || '');
    }
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
    };

    // Додаємо соцмережі тільки якщо є значення, інакше передаємо порожній об'єкт
    requestData.socials = {};
    if (instagram) {
      requestData.socials.instagram = instagram;
    }
    if (facebook) {
      requestData.socials.facebook = facebook;
    }

    // Якщо social media порожні, відправляємо порожній об'єкт
    if (!instagram && !facebook) {
      requestData.socials = {};
    }

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
        setPhone(updatedCafeData?.adminData?.contacts?.phone || '');
        setEmail(updatedCafeData?.adminData?.contacts?.email || '');
        setWebsite(updatedCafeData?.adminData?.contacts?.website || '');
        setInstagram(updatedCafeData?.adminData?.contacts?.socials?.instagram || '');
        setFacebook(updatedCafeData?.adminData?.contacts?.socials?.facebook || '');        
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
        <fieldset className="contact-form-socials">
          <legend className="contact-form-legend">Social Media</legend>
          <label className="contact-form-label">
            Instagram:
            <input className="contact-form-input" type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram URL" />
          </label>
          <label className="contact-form-label">
            Facebook:
            <input className="contact-form-input" type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Facebook URL" />
          </label>
        </fieldset>
        <button className="contact-form-button" disabled={loading} onClick={handleSubmit}>
          {loading ? "Loading..." : 'Update Contacts'}
        </button>
        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
};

export default Contact;
