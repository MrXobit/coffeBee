import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import './BeansRo.css';
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import ToggleSwitch from '../../toggleSwitch/ToggleSwitch';
import OllBeansRo from './OllBeansRo/OllBeansRo';

const BeansRo = () => {
  const { roasterData } = useSelector(state => state.roaster);

  const [allBeans, setAllBeans] = useState(true);

  useEffect(() => {
    const savedMode = localStorage.getItem('beansViewMode');
    if (savedMode !== null) {
      setAllBeans(JSON.parse(savedMode));
    }
  }, []);

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

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const emptyFields = Object.entries(formData).filter(([_, value]) => !value.trim());
      if (emptyFields.length > 0) {
        setError('Please fill in all fields.');
        setLoading(false);
        return;
      }

      const beanId = uuidv4();
      const fullData = {
        ...formData,
        roaster: roasterData.id,
        id: beanId
      };

      const beanRef = doc(db, 'beans', beanId);
      await setDoc(beanRef, fullData);

      setFormData({
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

      console.log(fullData);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (isAllBeans) => {
    setAllBeans(isAllBeans);
    localStorage.setItem('beansViewMode', JSON.stringify(isAllBeans));
  };

  return (
    <div className="BeansRo-wrapper">
    <div className="BeansRo-container">

      <h2 className="BeansRo-title">{allBeans ? 'Your Beans' : 'Add New Bean'}</h2>

      <div className='toggle-module-centerrr'>
        <ToggleSwitch
          toggleValue={allBeans}
          onToggle={handleToggle}
          words={['Your Beans', 'Add Bean']} // <-- поміняли місцями
        />
      </div>

      {allBeans ? ( // <-- тепер тут OllBeansRo
        <OllBeansRo />
      ) : (
        <form className="BeansRo-form" onSubmit={handleSubmit}>
          {Object.keys(formData).map((field) => (
            <div className="BeansRo-inputGroup" key={field}>
              <label className="BeansRo-label">{field}</label>
              <input
                type={field === 'scaScore' || field === 'harvestYear' ? 'number' : 'text'}
                name={field}
                value={formData[field]}
                onChange={handleInputChange}
                className="BeansRo-input"
                placeholder={`Enter ${field}`}
              />
            </div>
          ))}
          {error && <p className="BeansRo-error">{error}</p>}
          <button type="submit" className="BeansRo-submitBtn" disabled={loading}>
            {loading ? 'Loading...' : 'Add Bean'}
          </button>
        </form>
      )}
    </div>
  </div>
  );
};

export default BeansRo;
