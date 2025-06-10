import React, { useEffect, useState } from 'react'
import './NetworkDetails.css'
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import SubLoader from '../../../loader/SubLoader';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import { arrayRemove, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from '../../../../firebase';
import goBack from '../../../../assets/back.png'
import threeDots from '../../../../assets/threeDots.png';
import close from '../../../../assets/close.png';
import Loader from '../../../loader/Loader';
import bluePlus from '../../../../assets/blue-plus.png';
import ToggleSwitch from '../../../toggleSwitch/ToggleSwitch';
import NetworkAddCoffeForNet from './NetworkAddCoffeForNet';

import './NetworkDetails.css'
const NetworkDetails = () => {


  

       const notifySuccess = (message) => toast.success(message);
        const notifyError = (message) => toast.error(message);
    const [access, setAccses] = useState(false)
  const [networkData, setNetworkData] = useState(null)
  const [networkKafes, setNetworkKafes] = useState(null)
    const [modal, setModal] = useState(false); 
    
      const [localLoading, setLocalLoading] = useState({disabled: false, mot: 0})
    const { id } = useParams();
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const [toggleValue, setToggleValue] = useState(true)


    const loadData = async() => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/validAccesAdmin', {}, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
        
            if (response.data.access) {
              try {
                setAccses(true)

                       
                       const networkRef = doc(db, 'coffeeChain', id)
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
                       
              } catch (e) {
                console.log(e)
              }
            } else {
                setAccses(false)
            }
        }catch(e) {

        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
     }, [])

    if(loading) {
        return <SubLoader/>
    }

    if (!access) {
        return <h1 className='NetworkDetails-dennid'>Access denied</h1>   
    }
    

    const handleModalClose = () => {
        setModal(false); 
      };
    
      const handleModalOpen = () => {
        setModal(true)
      }


      const handleRemoveNet = async () => {
        setLocalLoading({ disabled: true, mot: 1 });
      
        try {
          const token = localStorage.getItem('token');
          const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/validAccesAdmin', {}, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
      
          if (!response.data.access) {
            notifyError('Access denied')
            setLocalLoading({ disabled: false, mot: 0 });
            setModal(false)
            return;
          }
      
          const networkRef = doc(db, "coffeeChain", id);
      
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


          for(let i = 0; i < networkData.requestsCafes.length; i++) {
            const cafeRef = doc(db, "cafe", networkData.requestsCafes[i]);
            const cafeSnap = await getDoc(cafeRef);
      
            if (!cafeSnap.exists()) continue;
      
            const cafeData = cafeSnap.data();

            if (Array.isArray(cafeData.networkRequests)) {
              const updatedRequests = cafeData.networkRequests.filter(
                (req) => req.name !== networkData.name
              );
          
             
              await updateDoc(cafeRef, {
                networkRequests: updatedRequests,
              });
            }
          }


      
          await deleteDoc(networkRef);
      
          navigate('/super-admin')
        
      
        } catch (e) {
          console.log('Error removing network:', e);
        } finally {
          setLocalLoading({ disabled: false, mot: 0 });
        }
      };


      const handleRemove = async (cafe) => {
        setLocalLoading({ disabled: true, mot: 2 });
      
        try {
          const token = localStorage.getItem('token');
          const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/validAccesAdmin', {}, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
      
          if (!response.data.access) {
            notifyError('Access denied');
            setLocalLoading({ disabled: false, mot: 0 });
            setModal(false);
            return;
          }
      
          const cafeRef = doc(db, "cafe", cafe.id);
          const cafeSnap = await getDoc(cafeRef);
          const cafeData = cafeSnap.data();
      
        
          const cafeDataNetReq = Array.isArray(cafeData.networkRequests) 
            ? cafeData.networkRequests.filter(req => req.name !== cafeData.network?.name) 
            : [];
      
          await updateDoc(cafeRef, {
            network: {},
            networkRequests: cafeDataNetReq
          });
      
          const networkRef = doc(db, "coffeeChain", cafeData.network.name);
      
          await updateDoc(networkRef, {
            cafeIds: arrayRemove(cafe.id)
          });
      
          setNetworkKafes(prev => prev.filter(cafedata => cafedata.id !== cafe.id));
      
        } catch (e) {
          console.log('Error removing network:', e);
        } finally {
          setLocalLoading({ disabled: false, mot: 0 });
        }
      }
      
      
      const handleToggle = (isAllBeans) => {
        setToggleValue(isAllBeans);
      };
      

  return (
    <div className='NetworkDetails-con'>
      
       <Link to="/super-admin">
         <img className='createCoffeNetwork-imgBack' src={goBack} alt="" />
       </Link>
         <h1 className='AdminNetwork-main-title'>{networkData.name}</h1>


        <div className="NetworkDetails-con-togle">
        <ToggleSwitch toggleValue={toggleValue} onToggle={handleToggle} words={['Network', 'Add']} />
        </div>

        {toggleValue ? (

          <>
          <h2 className="AdminNetwork-members">
   Network members
</h2>
<div className="AdminNetwork-maincard-for-cards">
  {(localLoading.disabled && localLoading.mot === 2) ? (
    <div className='AdminNetwork-loader-class'>
 <Loader /> 
    </div>
  ) : (
    <>
      {Array.isArray(networkKafes) && networkKafes.map((roaster) => (
        <div key={roaster.id}>
          <div to={`/cafe-info/${roaster.id}`}>
            <div className="AdminNetwork-card-con">
              <img
                // src={roaster.icon}
                src={Object.values(roaster.adminData.photos)[0]}
                alt="Roaster Logo"
                className="AdminNetwork-card-img"
              />
              {roaster.id === networkData.creatorId && <div className="AdminNetwork-card-creator">Creator</div>}
              <div className="AdminNetwork-card-name">{roaster.name}</div>
              <div className="AdminNetwork-card-description">
                {roaster.vicinity}
              </div>
              <p className="NetworkDetails-removeBy-net" onClick={() => handleRemove(roaster)}>
                {(localLoading.disabled && localLoading.mot === 2) ? "loading..." : "Remove"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </>
  )}



<div className='AdminNetwork-main-con-forMod'>
            <img 
              className={`beanmain-three-dots ${modal ? 'beans-main-modal-none' : ''}`} 
              src={threeDots} 
              alt="threeDots" 
              onClick={() => handleModalOpen()} 
            />

            <div className={`beans-main-modalWindow-con ${modal ? 'beans-main-modal-show' : ''}`}>
              <img 
                className='beans-main-modal-close' 
                src={close} 
                alt="" 
                onClick={handleModalClose} 
              />
              {modal && (
                <div>
                  <button 
                    disabled={localLoading.disabled} 
                    onClick={handleRemoveNet} 
                    className='AdminNetwork-leave-net'>
                    {(localLoading.disabled && localLoading.mot === 1) ? "loading..." : "Remove Network"} 
                  </button>
                </div>
              )}
            </div>
          </div>


 
</div>
          </>
        ) : (
          <>
          <NetworkAddCoffeForNet networkName={networkData.name} setNetworkKafes={setNetworkKafes}/>
          </>
        )}
   


<ToastContainer  />
</div>
  )
}

export default NetworkDetails
