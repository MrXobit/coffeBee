import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase'; // шлях до твого firebase.js
import Loader from '../../../loader/Loader';
import './OllBeansRo.css'
const OllBeansRo = () => {
    const { roasterData } = useSelector(state => state.roaster);
    const [beans, setBeans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
console.log('roaster iddd' + roasterData.id)
    const fetchBeans = async () => {
        setLoading(true);
        setError(null);
        try {
          const beansRef = collection(db, 'beans');
          const q = query(beansRef, where('roaster', '==', roasterData.id));
          const querySnapshot = await getDocs(q);
          const beansList = [];
          querySnapshot.forEach(doc => {
            beansList.push({ id: doc.id, ...doc.data() });
          });
          setBeans(beansList);
          console.log(beansList)
        } catch (err) {
          console.error('Error fetching beans:', err);
          setError('Failed to load beans.');
        } finally {
          setLoading(false);
        }
      };
  

    useEffect(() => {
        fetchBeans()
    }, [])

  return (
<div className="OllBeansRo-wrapper">
  {loading ? (
    <div className='OllBeansRo-center-loader'><Loader /></div>
  ) : (
<>
  <p className="OllBeansRo-statusMessage">
    {beans.length === 0 ? 'No beans found' : 'Your beans:'}
  </p>
  {beans.length > 0 && beans.map(bean => (
    <div key={bean.id} className="OllBeansRo-beanItem">
      {bean.name ? <p className="OllBeansRo-beanField"><strong>Name:</strong> {bean.name}</p> : null}
      {bean.country ? <p className="OllBeansRo-beanField"><strong>Country:</strong> {bean.country}</p> : null}
      {bean.variety ? <p className="OllBeansRo-beanField"><strong>Variety:</strong> {bean.variety}</p> : null}
      {bean.process ? <p className="OllBeansRo-beanField"><strong>Process:</strong> {bean.process}</p> : null}
      {bean.roasting ? <p className="OllBeansRo-beanField"><strong>Roasting:</strong> {bean.roasting}</p> : null}
      {bean.scaScore ? <p className="OllBeansRo-beanField"><strong>SCA Score:</strong> {bean.scaScore}</p> : null}
      {bean.producer ? <p className="OllBeansRo-beanField"><strong>Producer:</strong> {bean.producer}</p> : null}
      {bean.altitude ? <p className="OllBeansRo-beanField"><strong>Altitude:</strong> {bean.altitude}</p> : null}
      {bean.harvestYear ? <p className="OllBeansRo-beanField"><strong>Harvest Year:</strong> {bean.harvestYear}</p> : null}
      {bean.flavoursByRoaster ? <p className="OllBeansRo-beanField"><strong>Flavours by Roaster:</strong> {bean.flavoursByRoaster}</p> : null}
    </div>
  ))}
</>

  )}
</div>


  )
}

export default OllBeansRo