import React, { useEffect, useState } from 'react';
import './Paymant.css';
import { db } from '../../firebase'; 
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useSelector } from 'react-redux';

const Payment = ({data}) => {
  const { email } = useSelector((state) => state.user);
  const [cafeInfo, setCafeInfo] = useState(data);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    iban: '',
    swift: '',
    bankName: ''
  });

  const [errors, setErrors] = useState({
    iban: '',
    swift: '',
    bankName: ''
  });

  useEffect(() => {
    if (cafeInfo && cafeInfo.paymentInfo) {
      setFormData({
        iban: cafeInfo.paymentInfo.iban || '',
        swift: cafeInfo.paymentInfo.swift || '',
        bankName: cafeInfo.paymentInfo.bankName || ''
      });
    }
  }, [cafeInfo]);

  const validateIBAN = (iban) => /^[A-Z]{2}[A-Z0-9]{13,32}$/.test(iban);
  const validateSWIFT = (swift) => /^[A-Z0-9]{8,11}$/.test(swift);
  const validateBankName = (name) => /^[A-Za-z\s]+$/.test(name);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    const newErrors = {
      iban: validateIBAN(formData.iban) ? '' : 'Invalid IBAN format',
      swift: validateSWIFT(formData.swift) ? '' : 'Invalid SWIFT code',
      bankName: validateBankName(formData.bankName) ? '' : 'Bank name should contain only letters'
    };
  
    setErrors(newErrors);
  
    if (Object.values(newErrors).some(error => error)) {
      setLoading(false);
      return;
    }
  
    try {
      const accessRef = doc(db, 'accessAdmin', email);
      const accessSnap = await getDoc(accessRef);
  
      if (!accessSnap.exists()) return;
  
      const allowedCafeIds = accessSnap.data().allowedCafeIds || [];
      if (!allowedCafeIds.includes(cafeInfo.id)) return;
  
      const cafeRef = doc(db, 'cafe', cafeInfo.id);
      await updateDoc(cafeRef, { paymentInfo: formData });
  
      const updatedCafeSnap = await getDoc(cafeRef);
      const updatedCafeData = { id: cafeInfo.id, ...updatedCafeSnap.data() };
  
      setCafeInfo(updatedCafeData);
      localStorage.setItem('selectedCafe', JSON.stringify(updatedCafeData));
    } catch (e) {
      console.error('Error updating payment info:', e);
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <div className="main-con-container-payment">
      <div className="paymant-container">
        <h2 className="paymant-title">Payment Details Management</h2>
        <form className="paymant-form" onSubmit={handleSubmit}>
          <label className="paymant-label">
            IBAN:
            <input
              className="paymant-input"
              type="text"
              name="iban"
              value={formData.iban}
              onChange={handleChange}
              required
            />
            {errors.iban && <span className="paymant-error">{errors.iban}</span>}
          </label>
          <label className="paymant-label">
            SWIFT:
            <input
              className="paymant-input"
              type="text"
              name="swift"
              value={formData.swift}
              onChange={handleChange}
              required
            />
            {errors.swift && <span className="paymant-error">{errors.swift}</span>}
          </label>
          <label className="paymant-label">
            Bank Name:
            <input
              className="paymant-input"
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              required
            />
            {errors.bankName && <span className="paymant-error">{errors.bankName}</span>}
          </label>
          <button className="paymant-button" disabled={loading} type="submit">
            {loading ? 'Loading...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Payment;
