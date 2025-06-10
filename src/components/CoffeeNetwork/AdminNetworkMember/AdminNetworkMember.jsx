import React, { useEffect, useState } from 'react'
import './AdminNetworkMember.css'


import { arrayRemove, doc, getDoc, updateDoc } from "firebase/firestore";
import SubLoader from '../../loader/SubLoader';
import { db } from '../../../firebase';

import close from '../../../assets/close.png';
import threeDots from '../../../assets/threeDots.png';
import { useNavigate } from 'react-router-dom';
const AdminNetworkMember = ({setChoice, setJustMember}) => {

  const navigate = useNavigate()
    
  const [loading, setLoading] = useState(false)
  const [cafeData, setCafeData] = useState(null)
  const [networkData, setNetworkData] = useState(null)
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
        
        const networkRef = doc(db, 'coffeeChain', cafeData.network.name)
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


  const handleLogout = async() => {
    setLocalLoading({disabled: true, mot: 1})
    try {
      const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
        const cafeRef = doc(db, "cafe", selectedCafe.id); 
        const cafeSnap = await getDoc(cafeRef);
        const cafeData = cafeSnap.data();
        const cafeDataNetReq = cafeData.networkRequests.filter(req => req.name !== cafeData.network.name)
        await updateDoc(cafeRef, {
          network: {},
          networkRequests: cafeDataNetReq 
        })


        const networkRef = doc(db, "coffeeChain", cafeData.network.name)

        updateDoc(networkRef, {
           cafeIds: arrayRemove(selectedCafe.id)
        })
        setChoice(1)
        setJustMember(false)
    }catch(e) {
      console.log(e)
    } finally {
      setLocalLoading({disabled: false, mot: 0})
      setModal(false); 
    }
  }

  return (

    
    <div className='AdminNetwork-con'>

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
             <button disabled={localLoading.disabled} onClick={handleLogout} className='AdminNetwork-leave-net'>
             {(localLoading.disabled && localLoading.mot === 1) ? "loading..." : "leave"} 
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
{!loading && Array.isArray(networkKafes) && networkKafes.map((roaster) => (
<div key={roaster.id} to={`/cafe-info/${roaster.id}`} >
<div className="AdminNetwork-card-con">
 <img
  //  src={roaster.icon}
   src={Object.values(roaster.adminData.photos)[0]}
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



</div>
  )
}

export default AdminNetworkMember
