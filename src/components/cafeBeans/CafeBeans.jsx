import React, { useEffect, useState } from 'react'
import './CafeBeans.css';
import Loader from '../loader/Loader';
import { db, storage } from '../../firebase'; 
import { doc, getDoc, setDoc, collection, arrayUnion, updateDoc, arrayRemove, deleteDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import bluePlus from '../../assets/blue-plus.png';
import noImg from '../../assets/noImage.jpeg';
import { useSelector } from 'react-redux';
import { deleteObject, ref } from 'firebase/storage';

const CafeBeans = ({deleteId}) => {
  const navigate = useNavigate()
  const { email } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false)
  const [beans, setBeans] = useState([])

  const loadData = async () => {
    setLoading(true)
    try {
      const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
      const beansData = []
      if (!selectedCafe?.cafeBeans) {
        return 
      }
      for (const beanId of selectedCafe.cafeBeans) {
        const beanRef = doc(db, 'beans', beanId)
        const beanDoc = await getDoc(beanRef)
        if (beanDoc.exists()) {
          beansData.push(beanDoc.data());
        } else {
          console.log(`Bean with ID ${beanId} not found`);
        }
      }
      setBeans(beansData);
      
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
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
       deleteId(bean.id)

       const cafeRef = doc(db, 'cafe', selectedCafe.id)
       await updateDoc(cafeRef, {
        cafeBeans: arrayRemove(bean.id)
       })
    
       const cafeSnap = await getDoc(cafeRef)
       if(cafeSnap.exists()) {
        const updateCafeData = {id: selectedCafe.id, ...cafeSnap.data()}
        localStorage.setItem('selectedCafe', JSON.stringify(updateCafeData))
       }
     const filterBeans = beans.filter(bean => bean.id !== bean.id)
     setBeans(filterBeans)
                       
    }catch(e) {
      console.log(e)
    }finally {
      setLoading(false)
    }
}

const handleEdit = (bean) => {
  navigate("/add-coffee-bean", { 
    state: { 
      beanData: bean, 
    } 
  });
}


  useEffect(() => {  
    loadData()
  }, [])




  return (
    <div className='cafebeans-main-con'>
      <h1 className='cafebeans-main-title'>Your Coffee Beans</h1>
      
      <Link to="/add-coffee-bean" className="cafePass-add-new-cafe-pass-con">
    <div className="block-for-cafe-pass-img-pluss">
      <img src={bluePlus} alt="plus-icon" />
    </div>
    <p className="cafe-pass-p-just-text">Add New Coffee Bean</p>
  </Link>

      {loading ? (
    <div className="cafebeans-main-conLoader">
      <Loader />
    </div>
) : (
  <div className="bean-main-con-for-cards">
    {beans.map((bean) => (
      <div key={bean.id} className="beanMain-main-card-block">
        <img src={bean.imageUrl || noImg} alt={bean.name} className="beanMain-image-card" />
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
            <p className="beanMain-roasting-card">Roasting: {bean.roasting}</p>
          </div>
        </div>
        <div className="cafebeans-btn-con-actions">
            
            <button className="btn-edit-cofebeans" onClick={() => handleEdit(bean)}>Edit</button>
      
            <button className="btn-delete-cafebeans" onClick={() => handleDelete(bean)}>Delete</button>
          </div>
      </div>
    ))}
  </div>
)}
</div>
  )
}

export default CafeBeans
