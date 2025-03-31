import React, { useEffect, useState } from 'react'
import { db} from '../../../firebase'; 
import { doc, getDoc, updateDoc} from 'firebase/firestore';
import Loader from '../../loader/Loader';
import './ActiveRoasteries.css';
import { useNavigate } from 'react-router-dom';

const ActiveRoasteries = () => {
  const [roasters, setRoasters] = useState([])
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const loadRoasters = async() => {
    setLoading(true)
    try {
        const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
        console.log(selectedCafe)
        const arrayRoasterid = selectedCafe.roasterBeans.map(bean => bean.roaster)
        if (arrayRoasterid.length > 0) {
            const roastersArray = [];
            for (let i = 0; i < arrayRoasterid.length; i++) {
                const roasterRef = doc(db, 'roasters', arrayRoasterid[i]);
                const roasterGet = await getDoc(roasterRef);  
                roastersArray.push(roasterGet.data());
            }
    
            if (roastersArray.length > 0) {
                setRoasters(roastersArray);
            }
            console.log(roastersArray)
        }
    } catch(e) {
       console.log(e)
    } finally {
        setLoading(false)
    }
  }

  const handleDetails = (roaster) => {
    navigate(`/roaster/${roaster.id}`, { 
     state: { 
       roaster: roaster, 
     } 
   })
 }

useEffect(() => {
 loadRoasters()
}, [])

  return (
    <div className='roasterActive-main-con'>
        {loading ? (
         <div className='activeRoaster-loader-con'>
         <Loader className="activaRoaster-loader"/>
         </div>
        ) : (
            <div>
    <div className="roaster-maincard-for-cards">
       {roasters.map((roaster) => 
            <div key={roaster.id} className="roaster-card-con" onClick={() => handleDetails(roaster)}>
            <img src={roaster.logo} alt="Roaster Logo" className="roaster-card-img" />
            <div className="roaster-card-name">{roaster.name}</div>
            <div className="roaster-card-description">
             {roaster.description}
            </div>
          </div>
    )}
    </div>
            </div>
        )}
    </div>
  )
}

export default ActiveRoasteries
