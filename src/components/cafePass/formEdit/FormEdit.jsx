import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { db } from '../../../firebase'; 
import { doc, getDoc } from 'firebase/firestore';

const FormEdit = () => {
    const location = useLocation();
        const [data, setData] = useState(null);
      const [title, setTitle] = useState('');
      const [duration, setDuration] = useState('month');
      const [cups, setCups] = useState('');
      const [price, setPrice] = useState('');
      const [currency, setCurrency] = useState('USD');
      const [coffeeTypes, setCoffeeTypes] = useState([]);
      const [loading, setLoading] = useState(false)
      const navigate = useNavigate()

      const handleCoffeeTypeChange = (event) => {
        const { value } = event.target;
        setCoffeeTypes((prevCoffeeTypes) =>
          prevCoffeeTypes.includes(value)
            ? prevCoffeeTypes.filter((type) => type !== value) 
            : [...prevCoffeeTypes, value] 
        );
      };

      const subData = location.state?.subData; 
      const cafeId = location.state?.cafeId; 
      useEffect(() => {
        if (subData) {
            setTitle(subData.title || '');
            setDuration(subData.duration || 'month');
            setCups(subData.cups || '');
            setPrice(subData.price || '');
            setCurrency(subData.currency || 'USD');
            setCoffeeTypes(subData.coffeeTypes || []);
        } else {
            console.log('No subscription data available');
        }
    }, [subData]);


    const handleEddNewSub = async (e) => {
        e.preventDefault();
        setLoading(true)
        const token = localStorage.getItem('token');
         try {
           const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/subscriptionsEdit',
            {
              title, 
              duration, 
              cups: parseInt(cups, 10),
              price: parseFloat(price),  
              currency, 
              coffeeTypes, 
              cafeId, 
              subscriptionId: subData.id
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
           )

           const cafeRef = doc(db, 'cafe', cafeId); 
           const cafeSnap = await getDoc(cafeRef);    
       
           if (cafeSnap.exists()) {
             const updatedCafeData = { id: cafeId, ...cafeSnap.data() }; 
     
             localStorage.setItem('selectedCafe', JSON.stringify(updatedCafeData));
           }  

           navigate('/admin')

         } catch(e) {
            console.log(e)
         } finally {
            setLoading(false)
         }
      }

  return (
    <div className="form-add-new-sub-container">
    <h1 className="form-add-new-sub-title">Add New Coffee Subscription</h1>
    <form className="form-add-new-sub-form" onSubmit={handleEddNewSub}>
      <div className="form-add-new-sub-form-group">
        <label htmlFor="title" className="form-add-new-sub-form-label">Subscription Title</label>
        <input
          type="text"
          id="title"
          name="title"
          placeholder="Enter the subscription title"
          className="form-add-new-sub-form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)} 
          required
        />
      </div>


      <div className="form-add-new-sub-form-group">
        <label htmlFor="duration" className="form-add-new-sub-form-label">Duration</label>
        <select
          id="duration"
          name="duration"
          className="form-add-new-sub-form-input"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}  
          required
        >
          <option value="month">1 Month</option>
          <option value="3 months">3 Months</option>
          <option value="half-year">6 Months</option>
          <option value="year">1 Year</option>
        </select>
      </div>

     
      <div className="form-add-new-sub-form-group">
        <label htmlFor="cups" className="form-add-new-sub-form-label">Cups</label>
        <input
          type="number"
          id="cups"
          name="cups"
          min="1"
          placeholder="Enter number of cups"
          className="form-add-new-sub-form-input"
          value={cups}
          onChange={(e) => setCups(e.target.value)}  
          required
        />
      </div>

     
      <div className="form-add-new-sub-form-group">
        <label htmlFor="price" className="form-add-new-sub-form-label">Price</label>
        <input
          type="number"
          id="price"
          name="price"
          placeholder="Enter the price"
          className="form-add-new-sub-form-input"
          value={price}
          onChange={(e) => setPrice(e.target.value)}  
          required
        />
      </div>

     
      <div className="form-add-new-sub-form-group">
        <label htmlFor="currency" className="form-add-new-sub-form-label">Currency</label>
        <select
          id="currency"
          name="currency"
          className="form-add-new-sub-form-input"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}  
          required
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="AUD">AUD</option>
          <option value="BRL">BRL</option>
          <option value="CAD">CAD</option>
          <option value="CNY">CNY</option>
          <option value="CZK">CZK</option>
          <option value="DKK">DKK</option>
          <option value="HKD">HKD</option>
          <option value="HUF">HUF</option>
          <option value="ILS">ILS</option>
          <option value="JPY">JPY</option>
          <option value="MYR">MYR</option>
          <option value="MXN">MXN</option>
          <option value="TWD">TWD</option>
          <option value="NZD">NZD</option>
          <option value="NOK">NOK</option>
          <option value="PHP">PHP</option>
          <option value="PLN">PLN</option>
          <option value="SGD">SGD</option>
          <option value="SEK">SEK</option>
          <option value="CHF">CHF</option>
          <option value="THB">THB</option>
        </select>
      </div>

      <div className="form-add-new-sub-form-group">
        <label className="form-add-new-sub-form-label">Coffee Types</label>
        <div className="form-add-new-sub-coffee-types">
          {[
            "Espresso", "Double Espresso (Doppio)", "Ristretto", "Lungo", "Americano", "Macchiato", 
            "Cortado", "Cappuccino", "Flat White", "Latte", "Mocha", "Brewed Coffee",
            "Batch Brew", "Pour Over (V60, Chemex, Kalita Wave)", "French Press", "AeroPress", 
            "Cold Brew", "Drip Coffee", "Siphon Coffee", "Turkish Coffee", "Moka Pot", 
            "Cold Coffee Drinks", "Iced Coffee", "Iced Latte", "Iced Cappuccino", 
            "Nitro Cold Brew", "Frappé", "Affogato"
          ].map((type) => (
            <label key={type} className="form-add-new-sub-coffee-checkbox">
              <input
                type="checkbox"
                value={type}
                checked={coffeeTypes.includes(type)}
                onChange={handleCoffeeTypeChange}  
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      <button type="submit" disabled={loading} className="form-add-new-sub-submit-btn">{loading ? 'Loading...' : 'Update Subscription'}</button>
    </form>
  </div>
  )
}

export default FormEdit
