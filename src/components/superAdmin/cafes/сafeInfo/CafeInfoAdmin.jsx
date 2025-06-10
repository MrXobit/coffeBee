import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db, storage } from '../../../../firebase';
import { arrayRemove, deleteDoc, deleteField, doc, getDoc, updateDoc } from 'firebase/firestore';
import SubLoader from '../../../loader/SubLoader';
import './CafeInfo.css'
import axios from 'axios';
import { deleteObject, ref } from 'firebase/storage';
import Loader from '../../../loader/Loader';
import close from '../../../../assets/close.png';
import threeDots from '../../../../assets/threeDots.png'
const CafeInfo = () => {
    const navigate = useNavigate()
    const { id } = useParams(); 
    const [cafe, setCafe] = useState(null)
    const [beans, setBeans] = useState()
    const [loading, setLoading] = useState(false)
    const [findData, setFindData] = useState(false)
    const [modal, setModal] = useState(false); 
    const [localLoading2, setLocalLoading2] = useState({disabled: false, mot: 0})

    const [localLoading, setLocalLoading] = useState(false)
    useEffect(() => {
      loadData()
    }, [id])

    const loadData = async () => {
        setLoading(true)
        setFindData(false)
        try {
            const cafeRef = doc(db, 'cafe', id); 
            const cafeDoc = await getDoc(cafeRef); 
        
            if (cafeDoc.exists()) {
                const cafeData = cafeDoc.data(); 
                setCafe({ id: cafeDoc.id, ...cafeDoc.data() });
              
                setFindData(true)
               
                const beanArray = []
                const cafeBeans = Array.isArray(cafeData.cafeBeans)
                  ? cafeData.cafeBeans
                  : cafeData.cafeBeans ? [cafeData.cafeBeans] : []
                
                if (cafeBeans.length > 0) {
                    for (let i = 0; i < cafeBeans.length; i++) {
                        const beanRef = doc(db, 'beans', cafeBeans[i]) 
                        const beanDoc = await getDoc(beanRef); 
                        if (beanDoc.exists()) {
                            const beanData = beanDoc.data(); 
                            beanArray.push(beanData)
                        }
                    }
                }
                setBeans(beanArray)
            } else {
                setFindData(false)
            }
        } catch (e) {
            console.error(e)
            setFindData(false)
        } finally {
            setLoading(false)
        }
    }




    
  const handleDelete = async(bean) => {
    console.log(bean)
    if (!bean || !bean.id) {
      console.error('❌ bean або bean.id не заданий:', bean);
      return;
    }
    if (!cafe || !cafe.id) {
      console.error('❌ cafe або cafe.id не заданий:', cafe);
      return;
    }
    
    setLocalLoading(true)
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/validAccesAdmin', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      if (response.data.access) {
        try {

      const beanRef = doc(db, 'beans', bean.id)
      await deleteDoc(beanRef)

      const imageRef = ref(storage, `beans/${bean.imagePath}`)
      await deleteObject(imageRef)

      const cafeRef = doc(db, 'cafe', cafe.id)
      await updateDoc(cafeRef, {
       cafeBeans: arrayRemove(bean.id)
      })
   
      const filterBeans = beans.filter(b => b.id !== bean.id)
     setBeans(filterBeans)
      
        } catch (error) {
          console.error('Помилка під час видалення обжарщика та картинки:', error);
        }
      } else {
        console.error('Немає доступу до цієї операції');
      }       
    }catch(e) {
      console.log(e)
    }finally {
      setLocalLoading(false)
    }
}

const handleEdit = (bean) => {
  navigate("/add-coffee-bean", { 
    state: { 
      beanData: bean, 
      cafeData: cafe,
      returnUrl: `/cafe-info/${cafe.id}` 
    } 
  });
}

const handleEditCafeInfo = () => {
  navigate("/edit-coffeeInfo", { 
    state: { 
      cafeData: cafe, 
    } 
  });
}


const handleModalClose = () => {
  setModal(false); 
};

const handleModalOpen = () => {
  setModal(true)
}


const handleDeleteCafe = async () => {
  setLocalLoading2({disabled: true, mot: 1});
  try {
  
    const cafeRef = doc(db, 'cafe' ,cafe.id)
    const docSnap = await getDoc(cafeRef);

    const data = docSnap.data();

    if (data?.network?.name){
      const netRef = doc(db, 'coffeeChain', data.network.name);
      const netDoc = await getDoc(netRef);
      
      if (netDoc.exists()) {
        const netData = netDoc.data();
        let cafeIds = netData.cafeIds || []; 
        
       
        cafeIds = cafeIds.filter(id => id !== cafe.id);
        
        
        await updateDoc(netRef, {
          cafeIds: cafeIds
        });
      }
    }
    await deleteDoc(cafeRef)

    const imagePath = `cafe/${cafe.id}/photos/cafe`;
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
    navigate('/super-admin')
  } catch (e) {
    console.log(e);
  } finally {
    setLocalLoading2({disabled: false, mot: 0});
  }
};

    
// стилі з CafeBeans частично
  return (
    <div>
      {loading ? (
        <SubLoader/>
      ) : findData ? (
          
         <div className='cafeInfoAdmin-con'>




<div className='AdminNetwork-main-con-forMod'>
   <img className={`beanmain-three-dots ${modal ? 'beans-main-modal-none' : ''}`} 
       src={threeDots} alt="threeDots" 
      onClick={() => handleModalOpen()} 
      />

   <div className={`beans-main-modalWindow-con ${modal ? 'beans-main-modal-show' : ''}`}>
          <img className='beans-main-modal-close' src={close} alt="" onClick={handleModalClose} />
        {modal && (
             <div>
             <button disabled={localLoading2.disabled} onClick={handleDeleteCafe} className='AdminNetwork-leave-net'>
             {(localLoading2.disabled && localLoading2.mot === 1) ? "loading..." : "Remove Caffe"} 
              </button>  
              <button className='cafeInfoAdmin-editcafe' onClick={handleEditCafeInfo}>Edit Admin Data</button>

         </div>
        )}
       </div>

     </div>



            <div className="cafeIngoAdmin-name">{cafe.name}</div>
            <img  src={Object.values(cafe.adminData.photos)[0]} alt="cafe icon" className="cafeIngoAdmin-img" />
            <div className="cafeInfoAdmin-locations">{cafe.vicinity}</div>
         
            {localLoading ? (
               <Loader />
            ) : (
              <div className="bean-main-con-for-cards">
              {beans.length > 0 ? (
  beans.map((bean) => (
    <div key={bean.id} className="beanMain-main-card-block" onClick={() => console.log(bean)}>
      <img src={bean.imageUrl} alt={bean.name} className="beanMain-image-card" />
      <div className="beanmain-main-con-for-cards">
        <div className="beanMain-details-card">
          <h2 className="beanMain-name-card">{bean.name}</h2>
          <p className="beanMain-roaster-card heavy-text">Roaster: {bean.roaster}</p>
          <p className="beanMain-country-card">Country: {bean.country}</p>
          <p className="beanMain-altitude-card">Altitude: {bean.altitude} meters</p>
          <p className="beanMain-sca-score-card">SCA Score: {bean.scaScore}</p>
          <p className="beanMain-flavours-card">Flavours by Roaster: {bean.flavoursByRoaster}</p>
          <p className="beanMain-process-card">Process: {bean.process}</p>
          <p className="beanMain-variety-card">Variety: {bean.variety}</p>
          <p className="beanMain-harvest-year-card">Harvest Year: {bean.harvestYear}</p>
          <p className="beanMain-producer-card">Producer: {bean.producer}</p>
          <p className="beanMain-roasting-card">Roasting: {bean.roasting}</p>
        </div>
      </div>
      <div className="cafebeans-btn-con-actions">
          
          <button className="btn-edit-cofebeans" onClick={() => handleEdit(bean)}>Edit</button>
    
          <button className="btn-delete-cafebeans" onClick={() => handleDelete(bean)}>Delete</button>
        </div>
    </div>
    ))
  ) : (
            <div className='cafeInfoAdmin-roasting-notFond'>No coffee beans available in the cafe</div>
    
  )}
              </div>
            )}
          


         </div>
         
      ) : (
        <div className='cafeInfoAdmin-dataNotFound'>Data not found</div>
      )}
    </div>
  )
}

export default CafeInfo
