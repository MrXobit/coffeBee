import React, { useEffect, useState } from 'react'
import './ModerationBeans.css'
import Loader from '../../loader/Loader'
import axios from 'axios'
import { db } from '../../../firebase'
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore'

const ModerationBeans = () => {

    const [loading, setLoading] = useState(false)
    const [beans, setBeans] = useState([])
    const [localLoading, setLocalLoading] = useState({id: '', loading: false})

    useEffect(() => {
       loadData()
    }, [])

    const loadData = async() => {
        setLoading(true)
        try {
            const response = await axios('https://us-central1-coffee-bee.cloudfunctions.net/getModerationsBeans')
            const requiredFields = ['country', 'roaster', 'name', 'variety', 'process'];

      const filteredBeans = response.data.filter(bean => {
      const filledFieldsCount = requiredFields.reduce((count, field) => {
        if (bean[field] && bean[field].toString().trim() !== '') {
          return count + 1;
        }
        return count;
      }, 0);

      return filledFieldsCount >= 3;
    });

    setBeans(filteredBeans);
    console.log(filteredBeans);
        } catch(e) {
            console.log(e)
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = async(bean) => {
        setLocalLoading({id: bean.id, loading: true})
        try {
           const beanRef = doc(db, 'beans', bean.id);  
        await updateDoc(beanRef, {
            isVerified: true
        });

        setBeans((prev) => prev.filter((be) => be.id !== bean.id));

        }catch(e) {
          console.log(e)
        } finally {
           setLocalLoading({id: '', loading: false})
        }
    }

    
 



  return (
    <div className='ModerationBeans-con'>
         <h1 className='ModerationBeans-title'>Moderation Beans</h1>

        {loading ? (
            <div className='ModerationBeans-loader'>
                <Loader/>
            </div>
        ) : (
            <>
            
              <div className="bean-main-con-for-cards">
    {beans.length > 0 ? (
        <>

          {beans.map((bean) => (
<div key={bean.id} className="moderationBeans-main-card-block">
<div className="moderationBeans-details-card">
  <h2 className={`moderationBeans-name-card ${bean.name ? '' : 'moderationBeans-emptyFieald'}`}>{bean.name || '—'}</h2>
<p className={`moderationBeans-roaster-card heavy-text ${bean.roaster ? '' : 'moderationBeans-emptyFieald'}`}>
  Roaster: <span>{bean.roaster || '—'}</span>
</p>
<p className={`moderationBeans-country-card ${bean.country ? '' : 'moderationBeans-emptyFieald'}`}>
  Country: <span>{bean.country || '—'}</span>
</p>
<p className={`moderationBeans-variety-card ${bean.variety ? '' : 'moderationBeans-emptyFieald'}`}>
  Variety: <span>{bean.variety || '—'}</span>
</p>
<p className={`moderationBeans-process-card ${bean.process ? '' : 'moderationBeans-emptyFieald'}`}>
  Process: <span>{bean.process || '—'}</span>
</p>
<p className={`moderationBeans-altitude-card ${bean.altitude ? '' : 'moderationBeans-emptyFieald'}`}>
  Altitude: <span>{bean.altitude || '—'} meters</span>
</p>
<p className={`moderationBeans-sca-score-card ${bean.scaScore ? '' : 'moderationBeans-emptyFieald'}`}>
  SCA Score: <span>{bean.scaScore || '—'}</span>
</p>
<p className={`moderationBeans-flavours-card ${bean.flavoursByRoaster ? '' : 'moderationBeans-emptyFieald'}`}>
  Flavours by Roaster: <span>{bean.flavoursByRoaster || '—'}</span>
</p>
<p className={`moderationBeans-harvest-year-card ${bean.harvestYear ? '' : 'moderationBeans-emptyFieald'}`}>
  Harvest Year: <span>{bean.harvestYear || '—'}</span>
</p>
<p className={`moderationBeans-producer-card ${bean.producer ? '' : 'moderationBeans-emptyFieald'}`}>
  Producer: <span>{bean.producer || '—'}</span>
</p>
<p className={`moderationBeans-roasting-card ${bean.roasting ? '' : 'moderationBeans-emptyFieald'}`}>
  Roasting: <span>{bean.roasting || '—'}</span>
</p>

<p className={`moderationBeans-isAi-card ${bean.isAI !== undefined && bean.isAI !== null ? '' : 'moderationBeans-emptyFieald'}`}>
  isAi: <span>{bean.isAI === true ? 'Yes' : bean.isAI === false ? 'No' : '—'}</span>
</p>


</div>

  <div className="moderationBeans-btn-con-actions">
  <button
  disabled={localLoading.id === bean.id && loading}
  onClick={() => handleAdd(bean)} 
  className='moderationBeansBtn-Adbean'>
  {localLoading.id === bean.id && loading ? 'Loading...' : 'Add bean'}
</button>

  </div>
</div>
    ))}

        </>
    ) : (
        <p>no beans for moderations</p>
    )}
   
  </div>


            </>
        )}

    </div>
  )
}

export default ModerationBeans
