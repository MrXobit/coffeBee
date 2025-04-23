import React, { useEffect, useState } from 'react'
import './AdminNetwork.css'


import { doc, getDoc } from "firebase/firestore";
import SubLoader from '../../loader/SubLoader';
import { db } from '../../../firebase';
import ToggleSwitch from '../../toggleSwitch/ToggleSwitch';


const AdminNetwork = () => {

  const [loading, setLoading] = useState(false)
  const [cafeData, setCafeData] = useState(null)
  const [networkData, setNetworkData] = useState(null)
  const [toggleValue, setToggleValue] = useState(true)
  const [networkKafes, setNetworkKafes] = useState(null)

  const loadData = async() => { 
    setLoading(true)
    try {
     const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
        const cafeRef = doc(db, "cafe", selectedCafe.id); 
        const cafeSnap = await getDoc(cafeRef);
        const cafeData = cafeSnap.data();
        setCafeData({
          id: cafeSnap.id,
          ...cafeData
        }) 
        
        const networkRef = doc(db, 'networks', cafeData.network.name)
        const networkSnap = await getDoc(networkRef)
        const networkData = networkSnap.data()
        setNetworkData(networkData)

        const cafes = await Promise.all(
          networkData.cafeIds.map(async (id) => {
            const snap = await getDoc(doc(db, 'cafe', id));
            return snap.exists() ? {id: snap.id, ...snap.data()} : null
          })
        )

        setNetworkKafes(cafes.filter(Boolean))
    } catch(e) {
         console.log(e)
    } finally {
      setLoading(false)
    }
  }



  useEffect(() => {
    loadData()
  }, [])




  const handleToggle = (isAllBeans) => {
    setToggleValue(isAllBeans);
    localStorage.setItem('roasterPage', JSON.stringify(isAllBeans))
  };


  return (
    <div className='AdminNetwork-con'>
         <ToggleSwitch toggleValue={toggleValue} onToggle={handleToggle} words={['Overview', 'Requests']} />
    {toggleValue ? (
      <>
 {loading || !cafeData ? (
    <SubLoader />
  ) : (
    <>
          <h1 className='AdminNetwork-main-title'>{cafeData.network.name}</h1>

           <h2 className="AdminNetwork-members">
              Network members
           </h2>

<div className="AdminNetwork-maincard-for-cards">
{networkKafes.map((roaster) => (
  <div key={roaster.id} to={`/cafe-info/${roaster.id}`} >
    <div className="AdminNetwork-card-con">
      <img
        src={roaster.icon}
        alt="Roaster Logo"
        className="AdminNetwork-card-img"
      />
      {roaster.id === networkData.creatorId && <div className="AdminNetwork-card-creator">Creator</div>}
      <div className="AdminNetwork-card-name">{roaster.name}</div>
      <div className="AdminNetwork-card-description">
        {roaster.vicinity}
      </div>
    </div>
  </div>
))}
</div>
    </>
  )}
      </>
 
    ) : (
     <div></div>
    )}
  
  </div>
  )
}

export default AdminNetwork
