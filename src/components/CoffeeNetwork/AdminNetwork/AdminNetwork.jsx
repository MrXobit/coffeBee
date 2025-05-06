import React, { useEffect, useState } from 'react'
import './AdminNetwork.css'
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import SubLoader from '../../loader/SubLoader';
import { db } from '../../../firebase';
import ToggleSwitch from '../../toggleSwitch/ToggleSwitch';
import AdminNetworkRequests from '../AdminNetworkRequests/AdminNetworkRequests';
import close from '../../../assets/close.png';
import threeDots from '../../../assets/threeDots.png';

const AdminNetwork = ({setChoice, setSuperAdmin}) => {

  const [loading, setLoading] = useState(false)
  const [cafeData, setCafeData] = useState(null)
  const [networkData, setNetworkData] = useState(null)
  const [toggleValue, setToggleValue] = useState(true)
  const [networkKafes, setNetworkKafes] = useState(null)
  const [modal, setModal] = useState(false); 
    const [localLoading, setLocalLoading] = useState({disabled: false, mot: 0})
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

  const handleModalClose = () => {
    setModal(false); 
  };

  const handleModalOpen = () => {
    setModal(true)
  }


  useEffect(() => {
    loadData()
  }, [])


  const handleRemoveNet = async() => {
    setLocalLoading({disabled: true, mot: 1})
    try {
      const networkRef = doc(db, "networks", networkData.name);

      for (let i = 0; i < networkData.cafeIds.length; i++) {
        const cafeRef = doc(db, "cafe", networkData.cafeIds[i]);
        const cafeSnap = await getDoc(cafeRef);
  
        if (!cafeSnap.exists()) continue;
  
        const cafeData = cafeSnap.data();
  
        const filteredRequests = cafeData.networkRequests?.filter(
          (req) => req.name !== networkData.name
        ) || [];
  
        await updateDoc(cafeRef, {
          network: {}, 
          networkRequests: filteredRequests
        });
      }
 
      await deleteDoc(networkRef);
      setChoice(1) 
      setSuperAdmin(false)
    }catch(e) {
       console.log(e)
    }finally {
     setLocalLoading({disabled: false, mot: 0})
    }
  }






   





  const handleToggle = (isAllBeans) => {
    setModal(false)
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


<div className='AdminNetwork-main-con-forMod'>
   <img className={`beanmain-three-dots ${modal ? 'beans-main-modal-none' : ''}`} 
       src={threeDots} alt="threeDots" 
      onClick={() => handleModalOpen()} 
      />

   <div className={`beans-main-modalWindow-con ${modal ? 'beans-main-modal-show' : ''}`}>
          <img className='beans-main-modal-close' src={close} alt="" onClick={handleModalClose} />
        {modal && (
             <div>
             <button disabled={localLoading.disabled} onClick={handleRemoveNet} className='AdminNetwork-leave-net'>
             {(localLoading.disabled && localLoading.mot === 1) ? "loading..." : "Remove Network"} 
              </button>  
         </div>
        )}
       </div>

     </div>



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
    <AdminNetworkRequests setNetworkData={setNetworkData} setCafeData={setNetworkKafes} networkName={networkData.name}/>
    )}
  
  </div>
  )
}

export default AdminNetwork
