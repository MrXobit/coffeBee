import React, { useEffect, useState } from 'react'
import './ModerationBeans.css'
import Loader from '../../loader/Loader'
import axios from 'axios'
import { db } from '../../../firebase'
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import close from '../../../assets/back.png';
import edit from '../../../assets/edit.png';
import { AnimatePresence, motion } from "framer-motion";
import ModerationRoaster from './RoasterModal'

const ModerationBeans = () => {

    const [loading, setLoading] = useState(false)
    const [beans, setBeans] = useState([])
    const [localLoading, setLocalLoading] = useState({id: '', loading: false})

  const [bean, setBean] = useState(null);
  const [modal, setMoadal] = useState(false);

  const [editBtnSave, setEditBtnSave] = useState(false)





const [showRoasterInfo, setShowRoasterInfo] = useState(false);

const handleOpen = () => setShowRoasterInfo(true);
const handleClose = () => setShowRoasterInfo(false);
    
const [roaster, setRoaster] = useState({});
const [roasterLoading, setRoasterLoading] = useState(false);
const [currentBeans, setCurrentBeans] = useState([])

const handleOpenModal = async (bean) => {
  if (modal) return;

  setRoasterLoading(true);
  try {
    setMoadal(true);
    setBean(bean);

    if (bean.roaster) {
      // 1. Отримуємо ростерію
      const roasterRef = doc(db, "roasters", bean.roaster);
      const roasterSnap = await getDoc(roasterRef);

      if (roasterSnap.exists()) {
        const roasterData = { id: roasterSnap.id, ...roasterSnap.data() };
        setRoaster(roasterData);

        // 2. Отримуємо боби цієї ростерії
        const beansQuery = query(
          collection(db, "beans"),
          where("roaster", "==", bean.roaster),
          where("isVerified", "==", true) // тільки верифіковані
        );

        const beansSnap = await getDocs(beansQuery);
        const beansList = beansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setCurrentBeans(beansList);
      } else {
        setRoaster(null);
        setCurrentBeans([]);
      }
    } else {
      setRoaster(null);
      setCurrentBeans([]);
    }
  } catch (e) {
    console.error("Error loading roaster and beans:", e);
    setRoaster(null);
    setCurrentBeans([]);
  } finally {
    setRoasterLoading(false);
  }
};




const handleCloseModal = () => {
  setMoadal(false);
  setBean(null);
  setRoaster(null);
  setCurrentBeans([]);
  setRoasterLoading(false);
};



    useEffect(() => {
       loadData()
    }, [])



const loadData = async () => {
  setLoading(true);
  try {
    const response = await axios(
      "https://us-central1-coffee-bee.cloudfunctions.net/getModerationsBeans"
    );

    const requiredFields = ["country", "roaster", "name", "variety", "process"];
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    const beansWithRoaster = [];

    for (const bean of response.data) {
      // мінімум 3 поля повинні бути заповнені
      const filledFieldsCount = requiredFields.reduce((count, field) => {
        if (bean[field] && bean[field].toString().trim() !== "") {
          return count + 1;
        }
        return count;
      }, 0);

      if (filledFieldsCount < 3) continue;

      let needsCheck = false;

      if (!bean.lastCheckedAt) {
        needsCheck = true;
      } else {
        const lastCheckedTime = bean.lastCheckedAt?.seconds
          ? bean.lastCheckedAt.seconds * 1000
          : new Date(bean.lastCheckedAt).getTime();

        if (now - lastCheckedTime > sevenDays) {
          needsCheck = true;
        }
      }

      if (needsCheck && bean.roaster) {
        const roasterRef = doc(db, "roasters", bean.roaster);
        const roasterDoc = await getDoc(roasterRef);

        if (roasterDoc.exists()) {
          await updateDoc(doc(db, "beans", bean.id), {
            active: true,
            lastCheckedAt: new Date(),
          });
          bean.active = true;
          bean.lastCheckedAt = new Date();

          // додаємо тільки якщо ростер існує
          beansWithRoaster.push(bean);
        } else {
          await updateDoc(doc(db, "beans", bean.id), {
            active: false,
            lastCheckedAt: new Date(),
          });
          // не додаємо у стан
        }
      } else if (bean.active) {
        // якщо перевірка ще актуальна і вже active = true
        beansWithRoaster.push(bean);
      }
    }

    setBeans(beansWithRoaster);
    console.log(beansWithRoaster);
  } catch (e) {
    console.log(e);
  } finally {
    setLoading(false);
  }
};


    const handleAdd = async(bean) => {
        setLocalLoading({id: bean.id, loading: true})
        try {
           const beanRef = doc(db, 'beans', bean.id);  
       await updateDoc(beanRef, {
      ...bean,          // оновлюємо всі поля, які змінив користувач
      isVerified: true, // завжди ставимо isVerified на true
    });


        setBeans((prev) => prev.filter((be) => be.id !== bean.id));

        }catch(e) {
          console.log(e)
        } finally {
           setLocalLoading({id: '', loading: false})
        }
    }

const handleAddEdit = async (bean) => {
  setEditBtnSave(true);
  try {
    const beanRef = doc(db, 'beans', bean.id);
    await updateDoc(beanRef, {
      ...bean,          
      isVerified: true, 
    });

    setBeans((prev) => prev.filter((be) => be.id !== bean.id));
    setMoadal(false);
    setBean(null);
  } catch (e) {
    console.log(e);
  } finally {
    setEditBtnSave(false);
  }
};



    


  return (
    <div className='ModerationBeans-con'>

{modal &&
<img src={close} className='ModerationBeans-closeBtn' onClick={handleCloseModal} alt="" />
}


{modal ? 
   <>
     <div className="ModerationBeans-conEdit">
  <h1 className="ModerationBeans-editTitle">Edit Bean</h1>

  <div className="ModerationBeans-editContent">
    {/* Name */}
    {bean.name !== undefined && (
      <div className="ModerationBeans-editField">
        <label className="ModerationBeans-editLabel">Name:</label>
        <input
          type="text"
          className="ModerationBeans-editInput"
          value={bean.name || ''}
          onChange={(e) => setBean(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>
    )}

    {/* Country */}
    {bean.country !== undefined && (
      <div className="ModerationBeans-editField">
        <label className="ModerationBeans-editLabel">Country:</label>
        <input
          type="text"
          className="ModerationBeans-editInput"
          value={bean.country || ''}
          onChange={(e) => setBean(prev => ({ ...prev, country: e.target.value }))}
        />
      </div>
    )}

    {/* Roaster */}
    {bean.roaster !== undefined && (
      <div className="ModerationBeans-editField">
        <label className="ModerationBeans-editLabel">Roaster:</label>
        <input
          type="text"
          className="ModerationBeans-editInput"
          value={bean.roaster || ''}
          onChange={(e) => setBean(prev => ({ ...prev, roaster: e.target.value }))}
        />
      </div>
    )}

    {/* Variety */}
    {bean.variety !== undefined && (
      <div className="ModerationBeans-editField">
        <label className="ModerationBeans-editLabel">Variety:</label>
        <input
          type="text"
          className="ModerationBeans-editInput"
          value={bean.variety || ''}
          onChange={(e) => setBean(prev => ({ ...prev, variety: e.target.value }))}
        />
      </div>
    )}

    {/* Process */}
    {bean.process !== undefined && (
      <div className="ModerationBeans-editField">
        <label className="ModerationBeans-editLabel">Process:</label>
        <input
          type="text"
          className="ModerationBeans-editInput"
          value={bean.process || ''}
          onChange={(e) => setBean(prev => ({ ...prev, process: e.target.value }))}
        />
      </div>
    )}

    {/* Producer */}
    {bean.producer !== undefined && (
      <div className="ModerationBeans-editField">
        <label className="ModerationBeans-editLabel">Producer:</label>
        <input
          type="text"
          className="ModerationBeans-editInput"
          value={bean.producer || ''}
          onChange={(e) => setBean(prev => ({ ...prev, producer: e.target.value }))}
        />
      </div>
    )}

    {/* Flavours */}
    {bean.flavours !== undefined && (
      <div className="ModerationBeans-editField">
        <label className="ModerationBeans-editLabel">Flavours:</label>
        <input
          type="text"
          className="ModerationBeans-editInput"
          value={bean.flavours.join(', ') || ''}
          onChange={(e) =>
            setBean(prev => ({ ...prev, flavours: e.target.value.split(',').map(f => f.trim()) }))
          }
        />
      </div>
    )}


    {/* Flavours by Roaster */}
    {bean.flavoursByRoaster !== undefined && (
      <div className="ModerationBeans-editField">
        <label className="ModerationBeans-editLabel">Flavours by Roaster:</label>
        <input
          type="text"
          className="ModerationBeans-editInput"
          value={bean.flavoursByRoaster.join(', ') || ''}
          onChange={(e) =>
            setBean(prev => ({ ...prev, flavoursByRoaster: e.target.value.split(',').map(f => f.trim()) }))
          }
        />
      </div>
    )}

    {/* isAI */}
{/* isAI */}
{bean.isAI !== undefined && (
  <div className="ModerationBeans-editField">
    <label className="ModerationBeans-editLabel">isAI:</label>
    <div className="ModerationBeans-editField-checkboxWrapper">
      <input
        type="checkbox"
        checked={bean.isAI}
        onChange={(e) => setBean(prev => ({ ...prev, isAI: e.target.checked }))}
      />
      <span>{bean.isAI ? 'Yes' : 'No'}</span>
    </div>
  </div>
)}

{/* isVerified */}
{bean.isVerified !== undefined && (
  <div className="ModerationBeans-editField">
    <label className="ModerationBeans-editLabel">isVerified:</label>
    <div className="ModerationBeans-editField-checkboxWrapper">
      <input
        type="checkbox"
        checked={bean.isVerified}
        onChange={(e) => setBean(prev => ({ ...prev, isVerified: e.target.checked }))}
      />
      <span>{bean.isVerified ? 'Yes' : 'No'}</span>
    </div>
  </div>
)}


    <div>
      <ModerationRoaster        roaster={roaster}
        roasterLoading={roasterLoading}
        currentBeans={currentBeans}
      />
    </div>


    {/* Buttons */}
    <div className="ModerationBeans-editActions">
      <button
        className="ModerationBeans-saveBtn"
        onClick={() => handleAddEdit(bean)}
      >
        {editBtnSave ? 'Loading' : "Add Bean"}
      </button>
      <button
        className="ModerationBeans-cancelBtn"
        onClick={handleCloseModal}
      >
        Cancel
      </button>
    </div>
  </div>
</div>

   </>
   : 
   <>
   
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

<button onClick={() => handleOpenModal(bean)} className="moderationBeansBtn-EditAdd">Edit and add</button>

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






   </>
}




    </div>
  )
}

export default ModerationBeans
