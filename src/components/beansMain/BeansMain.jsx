import React, { useEffect, useState } from 'react';
import './BeansMain.css';
import { Link, useNavigate } from 'react-router-dom';
import bluePlus from '../../assets/blue-plus.png';
import axios from 'axios';
import Loader from '../loader/Loader';
import ToggleSwitch from '../toggleSwitch/ToggleSwitch';
import CafeBeans from '../cafeBeans/CafeBeans';
import { doc, getDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import threeDots from '../../assets/threeDots.png';
import close from '../../assets/close.png';
import { useSelector } from 'react-redux';
import { updateDoc, arrayRemove, deleteDoc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';


const BeansMain = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [cafeData, setCafedata] = useState(null)
  const [allBeans, setAllBeans] = useState(true);
  const [modal, setModal] = useState(null); 
  const [disabledBeans, setDisabledBeans] = useState([])
  const { email } = useSelector((state) => state.user);


  const loadData = async () => {
    setLoading(true);
    try {
      const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe')) 
      const cafeBeansArray = [];
      const roasterBeansArray = [];
      const cafeBeansPromise = Array.isArray(selectedCafe.cafeBeans) && selectedCafe.cafeBeans.length > 0
      ? Promise.all(
          selectedCafe.cafeBeans.map(async (id) => {
            const cafeDoc = await getDoc(doc(db, 'beans', id));
            return cafeDoc.exists() ? cafeDoc.data() : null;
          })
        )
      : Promise.resolve([]); 

    const roasterBeansPromise = Array.isArray(selectedCafe.roasterBeans) && selectedCafe.roasterBeans.length > 0
    ? Promise.all(
        selectedCafe.roasterBeans.flatMap(bean => bean.id).map(async (id) => {
          const roasterDoc = await getDoc(doc(db, 'beans', id));
          return roasterDoc.exists() ? roasterDoc.data() : null;
        })
      )
    : Promise.resolve([]); 

    

    const [cafeDocs, roasterDocs] = await Promise.all([cafeBeansPromise, roasterBeansPromise]);
    
    setDisabledBeans(selectedCafe?.disabledBeans || [])
    cafeBeansArray.push(...cafeDocs.filter(Boolean));
    roasterBeansArray.push(...roasterDocs.filter(Boolean));
    const mergedArray = [...cafeBeansArray, ...roasterBeansArray];
    mergedArray.sort(() => Math.random() - 0.5); 
    setData(mergedArray)
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe')) 
    setCafedata(selectedCafe)
    const beanPage = JSON.parse(localStorage.getItem('allbeans'));
    if (beanPage !== null && beanPage !== undefined) {
      setAllBeans(beanPage);
    }
  },[]);



  
const handleModalOpen = (id) => {
  setModal(id);
};
  
const handleModalClose = () => {
  setModal(null); 
};
  
  const handleToggle = (isAllBeans) => {
    setAllBeans(isAllBeans);
    localStorage.setItem('allbeans', JSON.stringify(isAllBeans))
  };


  const deleteId = (id) =>  {
     setData(data.filter(bean => bean.id !== id))
  }

  const handleEdit = (bean) => {
    navigate("/add-coffee-bean", { 
      state: { 
        beanData: bean, 
      } 
    });
  }

  const handleDelete = async(bean) => {
    setLoading(true)
    try {
      const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
       const accsesRef = doc(db, 'accessAdmin', email)
       const accsesSnap = await getDoc(accsesRef)
       if(!accsesSnap.exists) {
         return
       }
       const accsesData = accsesSnap.data()
       if(!accsesData.allowedCafeIds.includes(selectedCafe.id)) {
         return
       }

       const beanRef = doc(db, 'beans', bean.id)
       await deleteDoc(beanRef)

       const imageRef = ref(storage, `beans/${bean.imagePath}`)
       await deleteObject(imageRef)

       const cafeRef = doc(db, 'cafe', selectedCafe.id)
       await updateDoc(cafeRef, {
        cafeBeans: arrayRemove(bean.id)
       })

       await updateDoc(cafeRef, {
        disabledBeans: arrayRemove(bean.id)
       })
    
       const cafeSnap = await getDoc(cafeRef)
       if(cafeSnap.exists()) {
        const updateCafeData = {id: selectedCafe.id, ...cafeSnap.data()}
        localStorage.setItem('selectedCafe', JSON.stringify(updateCafeData))
       }
     const filterBeans = data.filter(beans => beans.id !== bean.id)
     setData(filterBeans)
    }catch(e) {
      console.log(e)
    }finally {
      setLoading(false)
    }
  }

  const removeBeanByRoaster = async(beanId) => {
    setLoading(true)
    try {
      const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
      const roaster = selectedCafe.roasterBeans.find(bean => bean.id.includes(beanId))?.roaster;
      const cafeRef = doc(db, 'cafe', selectedCafe.id);
      const cafeDoc = await getDoc(cafeRef);
      const roasterRef = doc(db, 'roasters', roaster);
      const roasterGet = await getDoc(roasterRef);
  
      if (cafeDoc.exists() && roasterGet.exists()) {
        const cafeData = cafeDoc.data();
        const roasterData = roasterGet.data();
  
   
        let updatedBeans = cafeData.roasterBeans.map((bean) => {
          if (bean.roaster === roaster) {
            return {
              ...bean,
              id: bean.id.filter((id) => id !== beanId), 
            };
          }
          return bean;
        });
  
        const remainingBeansFromRoaster = updatedBeans.filter(
          (bean) => bean.roaster === roaster && bean.id.length > 0
        );
  
        if (remainingBeansFromRoaster.length === 0) {
          updatedBeans = updatedBeans.filter((bean) => bean.roaster !== roaster);
        }
  
        await updateDoc(cafeRef, {
          roasterBeans: updatedBeans,
        });

        await updateDoc(cafeRef, {
          disabledBeans: arrayRemove(beanId)
         })
  
        const cafeSnap = await getDoc(cafeRef);
  
        if (cafeSnap.exists()) {
          const updatedCafeData = { id: selectedCafe.id, ...cafeSnap.data() };
          localStorage.setItem('selectedCafe', JSON.stringify(updatedCafeData));
          console.log(updatedCafeData);
        }
      }
      setData(prev => prev.filter(bean => bean.id !== beanId))
    } catch (e) {
      console.error('Error removing bean:', e);
    } finally {
      setLoading(false)
    }
  }


  const handleDeactivate = async (beanId) => {
    setLoading(true)
     try {
      const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
       const cafeRef = doc(db, 'cafe', selectedCafe.id)
      const disabledBeans = Array.isArray(selectedCafe.disabledBeans) 
      ? [...selectedCafe.disabledBeans, beanId] 
      : [beanId];
 
     await updateDoc(cafeRef, { 
      disabledBeans: disabledBeans
      });
     const cafeSnap = await getDoc(cafeRef);
     setDisabledBeans(prev => [...prev, beanId])

     if (cafeSnap.exists()) {
       const updatedCafeData = { id: selectedCafe.id, ...cafeSnap.data() };
       localStorage.setItem('selectedCafe', JSON.stringify(updatedCafeData));
       console.log(updatedCafeData);
     }
     setModal(null)
     } catch(e) {
      console.log(e)
     }finally {
      setLoading(false)
     }
  }

  const handleActivate = async(beanId) => {
    setLoading(true)
    try {
      const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
      const cafeRef = doc(db, 'cafe', selectedCafe.id)
      await updateDoc(cafeRef, {
        disabledBeans: arrayRemove(beanId)
      })
       
      setDisabledBeans(prev => prev.filter(bean => bean !== beanId))

      const cafeSnap = await getDoc(cafeRef);
  
      if (cafeSnap.exists()) {
        const updatedCafeData = { id: selectedCafe.id, ...cafeSnap.data() };
        localStorage.setItem('selectedCafe', JSON.stringify(updatedCafeData));
        console.log(updatedCafeData);
      }
      setModal(null)
    } catch(e) {
      console.log(e) 
    } finally {
      setLoading(false)
    }
  }
      

  return (
    <div className="beansMain-container">
       <div className='beans-main-togl-btn'>
  <ToggleSwitch toggleValue={allBeans} onToggle={handleToggle} words={['All Beans', 'You Beans']} />
</div>
    {allBeans ? (
  <div>
  <h1 className="beansMain-title">Find Coffee Beans</h1>

  {loading ? (
    <div className="beanMain-loader-con">
      <Loader />
    </div>
  ) : (
    <div className="bean-main-con-for-cards">
  {data.length > 0 ? (
  data.map((bean) => (
    <div key={bean.id} className='beanMain-main-card-block'>
       <div className={`beans-main-modalWindow-con ${bean.id === modal ? 'beans-main-modal-show' : ''}`}>
          <img className='beans-main-modal-close' src={close} alt="" onClick={handleModalClose} />
          {cafeData.cafeBeans.includes(bean.id) ? (
            <div>
      <button className="beanmain-btn-edit-cofebeans" onClick={() => handleEdit(bean)}>Edit</button>
      <button className="beanmain-btn-delete-cafebeans" onClick={() => handleDelete(bean)}>Delete</button>
      {disabledBeans.includes(bean.id) ? (
     <button className='btn-handleActivate' onClick={() => handleActivate(bean.id)}>Activate</button>
    ) : (
      <button className='btn-handleDeactivate' onClick={() => handleDeactivate(bean.id)}>Deactivate</button>
    )}
            </div>
          ) : (
            <div>
   <button className='beanMain-removeRoasterBean' onClick={() => removeBeanByRoaster(bean.id)}>Remove Roaster’s Bean</button>           
   {disabledBeans.includes(bean.id) ? (
     <button className='btn-handleActivate' onClick={() => handleActivate(bean.id)}>Activate</button>
    ) : (
      <button className='btn-handleDeactivate' onClick={() => handleDeactivate(bean.id)}>Deactivate</button>
    )}
            </div>
          )}
       </div>
      <img className={`beanmain-three-dots ${bean.id === modal ? 'beans-main-modal-none' : ''}`} 
       src={threeDots} alt="threeDots" 
      onClick={() => handleModalOpen(bean.id)} 
      />
      <img src={bean.imageUrl} alt={bean.name} className="beanMain-image-card" />
     
        <div className={` ${disabledBeans.includes(bean.id) ? 'beans-main-status-disabled' : 'beans-main-status'}`}>Status: {disabledBeans.includes(bean.id) ? 'disabled' : 'active'}</div>
    
      <div className="beanmain-main-con-for-cards">
        <div className="beanMain-details-card">
          <h2 className="beanMain-name-card">{bean.name}</h2>
          <p className="beanMain-country-card">Country: {bean.country}</p>
          <p className="beanMain-altitude-card">Altitude: {bean.altitude} meters</p>
          <p className="beanMain-sca-score-card">SCA Score: {bean.scaScore}</p>
          <p className="beanMain-flavours-card">Flavours by Roaster: {bean.flavoursByRoaster}</p>
          <p className="beanMain-process-card">Process: {bean.process}</p>
          <p className="beanMain-variety-card">Variety: {bean.variety}</p>
          <p className="beanMain-harvest-year-card">Harvest Year: {bean.harvestYear}</p>
          <p className="beanMain-producer-card">Producer: {bean.producer}</p>
          <p className="beanMain-roaster-card heavy-text">Roaster: {bean.roaster}</p>
          <p className="beanMain-roasting-card">Roasting: {bean.roasting}</p>
          {cafeData.cafeBeans.includes(bean.id) ? (
   <div className='beanMain-beanBy-you'>Beans you added</div>
          ) : (
            <div className='beanMain-beanBy-roaster'>Beans from the roastery</div>
          )}
        </div>
      </div>
    </div>
  ))
) : (
  <p className="no-beans-message">No beans found</p> 
)}

    </div>
  )}

</div>
) : (
  <CafeBeans deleteId={deleteId}/>
)}
    </div>
  );
};

export default BeansMain;
