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
import BeanEditModal from './BeanEditModal'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiClock as Clock, FiCheck as Check } from 'react-icons/fi';

const ModerationBeans = () => {
  const notifySuccess = (message) => toast.success(message);
    const notifyError = (message) => toast.error(message);

    const [loading, setLoading] = useState(false)
    const [beans, setBeans] = useState([])
    const [localLoading, setLocalLoading] = useState({id: '', loading: false})

  const [bean, setBean] = useState(null);
  const [modal, setMoadal] = useState(false);

  const [editBtnSave, setEditBtnSave] = useState(false)




const [showRoasterInfo, setShowRoasterInfo] = useState(false);

const handleOpen = () => setShowRoasterInfo(true);
const handleClose = () => setShowRoasterInfo(false);
    

const [currentBeans, setCurrentBeans] = useState([])

const handleOpenModal = (bean) => {
  if (modal) return;

  setMoadal(true);
  setBean(bean);

  // Видаляємо всю логіку підвантаження ростерії та бобів

  setCurrentBeans([]);
};

const handleCloseModal = () => {
  setMoadal(false);
  setBean(null);
 
  setCurrentBeans([]);

};






function addDays(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString(); // Зберігаємо у форматі ISO
}

const [SnoozeLoading, setSnoozeLoading] = useState(true);

const [snoozeLoadingId, setSnoozeLoadingId] = useState(null);

async function handleSnooze(beanId, days) {
  setSnoozeLoadingId(beanId); // ← запам'ятали, який bean вантажиться

  try {
    const until = addDays(days);
    const beanRef = doc(db, "beans", beanId);
    const beanSnap = await getDoc(beanRef);

    if (beanSnap.exists()) {
      await updateDoc(beanRef, {
        isSnoozed: true,
        snoozedUntil: until,
      });

      console.log(`✅ Bean ${beanId} snoozed until ${until}`);
      setBeans((prev) => prev.filter((bean) => bean.id !== beanId));

      const message =
        days === 3
          ? "Successfully snoozed for 3 days"
          : days === 7
          ? "Successfully snoozed for 1 week"
          : days === 30
          ? "Successfully snoozed for 1 month"
          : `Successfully snoozed for ${days} days`;

      notifySuccess(message);
    } else {
      console.warn("⚠️ Bean not found:", beanId);
    }
  } catch (err) {
    console.error("❌ Error snoozing bean:", err);
  } finally {
    setSnoozeLoadingId(null); // ← очистили після завершення
  }
}


 


  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count] = useState(10); // кількість бобів на сторінку

const loadData = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `https://us-central1-coffee-bee.cloudfunctions.net/getModerationsBeans?count=${count}&offset=${(currentPage - 1) * count}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let beansWithStatus = [];

    for (const bean of response.data.beans) {
      let isAddable = false;

      try {
        if (bean.roaster) {
          // === 1. Перевірка в основній колекції ===
          const roasterRef = doc(db, "roasters", bean.roaster);
          const roasterSnap = await getDoc(roasterRef);

          if (roasterSnap.exists()) {
            isAddable = true; // ✅ існує, можна додати зерно
          } else {
            // === 2. Перевірка в moderation ===
            const modRef = doc(db, "moderation", "roasters");
            const modSnap = await getDoc(modRef);

            if (modSnap.exists()) {
              const found = (modSnap.data().roasters || []).find(
                (r) => r.id === bean.roaster
              );
              if (found) {
                isAddable = false; // ❌ ще в модерації
              }
            }
          }
        }
      } catch (err) {
        console.error("Roaster check error:", err);
      }

      beansWithStatus.push({ ...bean, isBeanAddable: isAddable });
    }

    setBeans(beansWithStatus);
    console.log(beansWithStatus);

    setTotalPages(Math.ceil(response.data.totalCount / count));
  } catch (e) {
    console.log(e);
  } finally {
    setLoading(false);
  }
};






  useEffect(() => {
    loadData();
  }, [currentPage]);

const handleAdd = async (bean) => {
  if (!bean.isBeanAddable) return; // 🔒 якщо не можна додати, виходимо
  setLocalLoading({ id: bean.id, loading: true });

  try {
    const beanRef = doc(db, 'beans', bean.id);
    await updateDoc(beanRef, {
      ...bean,
      isVerified: true,
    });

    setBeans((prev) => prev.filter((be) => be.id !== bean.id));

    notifySuccess("Bean has been successfully added"); 
  } catch (e) {
    console.log(e);
  } finally {
    setLocalLoading({ id: '', loading: false });
  }
};




  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };



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



  const renderPaginationButtons = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (totalPages > 5) {
      if (currentPage <= 3) endPage = 5;
      else if (currentPage >= totalPages - 2) startPage = totalPages - 4;
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="beansMain-pagination-container">
        <ul className="beansMain-pagination-list">
          <li className="beansMain-pagination-item">
            <a
              href="#"
              className="beansMain-pagination-link"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </a>
          </li>

          {pages.map((page) => (
            <li
              key={page}
              className={`beansMain-pagination-item ${currentPage === page ? 'beansMain-pagination-item-active' : ''}`}
            >
              <a href="#" className="beansMain-pagination-link" onClick={() => handlePageChange(page)}>
                {page}
              </a>
            </li>
          ))}

          <li className="beansMain-pagination-item">
            <a
              href="#"
              className="beansMain-pagination-link"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </a>
          </li>
        </ul>
      </div>
    );
  };


  return (
    <div className='ModerationBeans-con'>

{modal &&
<img src={close} className='ModerationBeans-closeBtn' onClick={handleCloseModal} alt="" />
}


{modal ? 
    <BeanEditModal
    setMoadal={setMoadal}
    setBeans={setBeans}
    bean={bean}
    setBean={setBean}
    handleCloseModal={handleCloseModal}
    handleAddEdit={handleAddEdit}
    editBtnSave={editBtnSave}
    currentBeans={currentBeans}
  />
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

{!bean.isBeanAddable && (
  <p className="moderationBeans-beanWarning">
    Cannot add this bean: either the roaster does not exist or it is still under moderation.
  </p>
)}

 <div className="moderationBeans-btn-con-actions">
<button
  disabled={
    (localLoading.id === bean.id && loading) || !bean.isBeanAddable
  }
  onClick={() => handleAdd(bean)}
 className={bean.isBeanAddable 
  ? "moderationBeansBtn-Active" 
  : "moderationBeansBtn-Disabled"}

>
  {localLoading.id === bean.id && loading
    ? "Loading..."
    : bean.isBeanAddable
      ? "Add bean"
      : "Cannot add"}
</button>



<button onClick={() => handleOpenModal(bean)} className="moderationBeansBtn-EditAdd">Edit and add</button>

{(SnoozeLoading && snoozeLoadingId === bean.id) ? (
  <div className="moderationBeansBtn-loading">
    <Clock className="moderationBeansBtn-loadingIcon" />
    <span>Loading...</span>
  </div>
) : (
  <>
    <p className="moderationBeansBtn-label">
      Snooze moderation for a specific period:
    </p>

    <div className="moderationBeansBtn-container">
      <button
        onClick={() => handleSnooze(bean.id, 3)}
        className="moderationBeansBtn moderationBeansBtn--3days"
      >
        <Clock className="moderationBeansBtn-icon" /> 3 days
      </button>
      <button
        onClick={() => handleSnooze(bean.id, 7)}
        className="moderationBeansBtn moderationBeansBtn--1week"
      >
        <Clock className="moderationBeansBtn-icon" /> 1 week
      </button>
      <button
        onClick={() => handleSnooze(bean.id, 30)}
        className="moderationBeansBtn moderationBeansBtn--1month"
      >
        <Clock className="moderationBeansBtn-icon" /> 1 month
      </button>
    </div>
  </>
)}




  </div>
</div>
    ))}

        </>
    ) : (
        <p>no beans for moderations</p>
    )}
   
  </div>


          {renderPaginationButtons()}
            </>
        )}






   </>
}




    </div>
  )
}

export default ModerationBeans
