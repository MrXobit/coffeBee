import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { db } from '../../../firebase'
import Loader from '../../loader/Loader'
import './AdminNetworkRequests.css'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

const AdminNetworkRequests = ({setNetworkData, networkName, setCafeData}) => {
   const notifySuccess = (message) => toast.success(message);
    const notifyError = (message) => toast.error(message);

  const [cafes, setCafes] = useState([])
  const [loading, setLoading] = useState(false)
  const [localLoading, SetLoacalLoading] = useState({disabled: false, cafeId: '', met: 0})

  const loadData = async () => {
    setLoading(true);
    try {
      const networkSnap = await getDoc(doc(db, 'coffeeChain', networkName));
      
      if (!networkSnap.exists()) {
        console.log("Network not found");
        return;
      }
  
      const networkData = networkSnap.data();
  
      if (!Array.isArray(networkData.requestsCafes)) {
        console.log("No request cafes found");
        return;
      }
  
      const cafes = await Promise.all(
        networkData.requestsCafes.map(async (id) => {
          const snap = await getDoc(doc(db, 'cafe', id));
          return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        })
      );
  
      setCafes(cafes.filter(Boolean));
  
    } catch (e) {
      console.log("Error loading cafes:", e);
    } finally {
      setLoading(false);
    }
  };
  

  const handleDelete = async(cafeId) => {
    SetLoacalLoading({disabled: true, cafeId: cafeId, met: 1})
    try {
 
      const networkRef = doc(db, 'coffeeChain', networkName)
      await updateDoc(networkRef, {
        requestsCafes: arrayRemove(cafeId)
      });
  

      const cafeRef = doc(db, "cafe", cafeId);
      const cafeSnap = await getDoc(cafeRef);
      const cafeData = cafeSnap.data();
      
   
      const networkRequestIndex = cafeData.networkRequests.findIndex(req => req.name === networkName);
      
      if (networkRequestIndex !== -1) {
   
        cafeData.networkRequests[networkRequestIndex].request = false;
      

        await updateDoc(cafeRef, {
            networkRequests: cafeData.networkRequests
          });
    }

    const filteredCafes = cafes.filter(cafe => cafe.id !== cafeId)
    setCafes(filteredCafes)

    }catch(e) {
      console.log(e)
    }finally {
        SetLoacalLoading({disabled: false, cafeId: '',met: 0})
    }
  }


  const handleAplly =async (cafeId) => {
    SetLoacalLoading({disabled: true, cafeId: cafeId, met: 2})
    try {
        const networkRef = doc(db, 'coffeeChain', networkName)
        

        const cafeRef = doc(db, "cafe", cafeId);
        const cafeSnap = await getDoc(cafeRef);
        const cafeData = cafeSnap.data();
        

        if(cafeData?.network?.name) {
            await updateDoc(networkRef, {
              requestsCafes: arrayRemove(cafeId)
            });
            notifyError('This cafe is already associated with another network');
            return;
        }

        await updateDoc(cafeRef, {
            network: {name: networkName, isCreator: false}
        })

        await updateDoc(networkRef, {
            cafeIds: arrayUnion(cafeId),
            requestsCafes: arrayRemove(cafeId)
          });

          notifySuccess('Cafe has been successfully added to the network');
          setCafeData(prev => [...prev, { id: cafeSnap.id, ...cafeData }])
          const filteredCafes = cafes.filter(cafe => cafe.id !== cafeId)
          setCafes(filteredCafes)
          setNetworkData(prev => ({
            ...prev,
            cafeIds: [...prev.cafeIds, cafeId]
          }));          
    } catch(e) {
       console.log(e)
    }finally {
        SetLoacalLoading({disabled: false, cafeId: '', met: 0})
    }
  }



  useEffect(() => {
      loadData()
  }, [])

  return (
<div className='AdminNetworkRequests-con'>
  <h1 className="AdminNetworkRequests-title">Incoming Requests</h1>
  {loading ? (
    <Loader />
  ) : (
    <div className="activeRoasters-maincard-for-cards">
      {cafes.length > 0 ? (
        cafes.map((roaster) => (
          <div  key={roaster.id}>
            <div className="activeRoasters-card-con">
              <img
                src={Object.values(roaster.adminData.photos)[0]}
                alt="Roaster Logo"
                className="activeRoasters-card-img"
              />
              <div className="activeRoasters-card-name">{roaster.name}</div>
              <div className="activeRoasters-card-description">
                {roaster.vicinity}
              </div>
              <div className="AdminNetworkRequests-net-actions">
<button disabled={localLoading.disabled} onClick={() => handleAplly(roaster.id)} className="AdminNetworkRequests-apply">
  {localLoading.cafeId === roaster.id && localLoading.met === 2 ? 'loading...' : "Apply"}  
</button>
<button disabled={localLoading.disabled} onClick={() => handleDelete(roaster.id)} className="AdminNetworkRequests-reject">
  {localLoading.cafeId === roaster.id && localLoading.met === 1 ? 'loading...' : "Reject"}  
</button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className='AdminNetworkRequests-noreq'>No requests</div>
      )}
    </div>
  )}
       <ToastContainer />
</div>
  )
}

export default AdminNetworkRequests
