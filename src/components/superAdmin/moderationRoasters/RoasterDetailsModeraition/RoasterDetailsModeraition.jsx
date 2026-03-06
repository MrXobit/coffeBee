import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import "./RoasterDetailsModeraition.css";
import back from '../../../../assets/back.png'
import defoultImg from '../../../../assets/noImage.jpeg'

const ALLOWED_FIELD_NAMES = [
  'price',
  'description',
  'country',
  'flavours', 
  'flavoursByRoaster',
  'name',
  'process',
  'producer', 
  'variety'
];

const RoasterDetailsModeraition = () => {
  const { id } = useParams();
  const [roaster, setRoaster] = useState(null);
  const [beans, setBeans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [beanToDelete, setBeanToDelete] = useState(null);
  const [deleteResult, setDeleteResult] = useState(null);

  const navigate = useNavigate();

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      console.log('🔄 Starting fetchData for roaster ID:', id);

      const roasterRef = doc(db, "roasters", id);
      const roasterSnap = await getDoc(roasterRef);

      if (roasterSnap.exists()) {
        const roasterData = roasterSnap.data();
        console.log('✅ Roaster found:', roasterData.name);
        
        setRoaster({ id: roasterSnap.id, ...roasterData });

        const beansRef = collection(db, "beans");
        
        // Отримуємо всі ID для пошуку (основний ID + aliasIds)
        const allSearchIds = new Set();
        
        // Додаємо основний ID
        allSearchIds.add(String(roasterSnap.id));
        
        // Додаємо aliasIds, якщо вони є і відрізняються від основного ID
        const aliasIds = roasterData.aliasId;
        console.log('🔍 Alias IDs found:', aliasIds);
        
        if (Array.isArray(aliasIds)) {
          aliasIds.forEach(aliasId => {
            if (aliasId && aliasId !== String(roasterSnap.id)) {
              allSearchIds.add(String(aliasId));
            }
          });
        }
        
        // Конвертуємо Set в масив для запиту
        const uniqueSearchIds = Array.from(allSearchIds);
        console.log('🔍 Unique IDs to search:', uniqueSearchIds);
        
        // Робимо ОДИН запит з усіма унікальними ID
        if (uniqueSearchIds.length === 1) {
          // Якщо тільки один ID
          console.log('🔍 Single ID query for:', uniqueSearchIds[0]);
          const q = query(
            beansRef,
            where("roaster", "==", uniqueSearchIds[0]),
            where("isVerified", "==", true)
          );
          const beansSnap = await getDocs(q);
          const beans = beansSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          console.log('📦 Beans array:', beans); // ДОДАНО ВИВЕДЕННЯ МАСИВУ
          setBeans(beans);
        } else {
          // Якщо кілька ID
          console.log('🔍 Multiple IDs query for:', uniqueSearchIds);
          const q = query(
            beansRef,
            where("roaster", "in", uniqueSearchIds),
            where("isVerified", "==", true)
          );
          const beansSnap = await getDocs(q);
          
          // Використовуємо Map для уникнення дублікатів за ID бобу
          const beansMap = new Map();
          beansSnap.docs.forEach(doc => {
            const data = doc.data();
            beansMap.set(doc.id, { id: doc.id, ...data });
          });
          
          const beans = Array.from(beansMap.values());
          console.log('📦 Beans array:', beans); // ДОДАНО ВИВЕДЕННЯ МАСИВУ
          setBeans(beans);
        }
        
        console.log('📦 Total unique beans found:', beans.length);
        
      } else {
        console.log('❌ Roaster not found with ID:', id);
        setRoaster(null);
        setBeans([]);
      }
    } catch (err) {
      console.error('❌ Error loading roaster/beans:', err);
    } finally {
      setLoading(false);
      console.log('🏁 FetchData completed');
    }
  };

  fetchData();
}, [id]);

  // Функція для підтвердження видалення всіх зерен
  const confirmDeleteAllBeans = () => {
    setShowDeleteAllModal(true);
  };

  // Функція для видалення всіх зерен
  const handleDeleteAllBeans = async () => {
    try {
      setDeleting(true);
      setShowDeleteAllModal(false);
      
      const beansRef = collection(db, "beans");
      const q = query(
        beansRef,
        where("roaster", "==", id)
      );
      
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
      
      // Оновлюємо стан після видалення
      setBeans([]);
      setDeleteResult({
        type: 'success',
        message: `✅ Successfully deleted all beans from ${roaster.name}`
      });
      
    } catch (err) {
      console.error("Error deleting all beans:", err);
      setDeleteResult({
        type: 'error',
        message: `❌ Error deleting beans: ${err.message}`
      });
    } finally {
      setDeleting(false);
      // Автоматично приховати повідомлення через 3 секунди
      setTimeout(() => setDeleteResult(null), 3000);
    }
  };

  // Функція для підтвердження видалення одного зерна
  const confirmDeleteBean = (beanId, beanName) => {
    setBeanToDelete({ id: beanId, name: beanName });
    setShowDeleteModal(true);
  };

  // Функція для видалення одного зерна
  const handleDeleteBean = async () => {
    if (!beanToDelete) return;

    try {
      setDeleting(true);
      setShowDeleteModal(false);
      
      const beanRef = doc(db, "beans", beanToDelete.id);
      await deleteDoc(beanRef);
      
      // Оновлюємо стан після видалення
      setBeans(prevBeans => prevBeans.filter(bean => bean.id !== beanToDelete.id));
      setDeleteResult({
        type: 'success',
        message: `✅ Successfully deleted "${beanToDelete.name}"`
      });
      
    } catch (err) {
      console.error("Error deleting bean:", err);
      setDeleteResult({
        type: 'error',
        message: `❌ Error deleting bean: ${err.message}`
      });
    } finally {
      setDeleting(false);
      setBeanToDelete(null);
      // Автоматично приховати повідомлення через 3 секунди
      setTimeout(() => setDeleteResult(null), 3000);
    }
  };

  // Закриття модальних вікон
  const closeModals = () => {
    setShowDeleteModal(false);
    setShowDeleteAllModal(false);
    setBeanToDelete(null);
  };

  // Функція для відображення поля з красивим лейблом
  const renderField = (bean, fieldName) => {
    const value = bean[fieldName];
    
    if (!value || value === 'Not found') return null;

    // Спеціальні випадки для полів flavours
    if (fieldName === 'flavours' || fieldName === 'flavoursByRoaster') {
      if (Array.isArray(value) && value.length > 0) {
        return (
          <div className="bean-detail">
            <span className="detail-label">
              {fieldName === 'flavours' ? '👃 Tasting Notes:' : '👨‍🍳 Roaster Notes:'}
            </span>
            <div className="flavours-tags">
              {value.map((flavour, index) => (
                <span key={index} className="flavour-tag">
                  {flavour}
                </span>
              ))}
            </div>
          </div>
        );
      }
      return null;
    }

    // Загальні поля
    const fieldLabels = {
      price: '💰 Price:',
      description: '📝 Description:',
      country: '📍 Country:',
      process: '⚡ Process:',
      producer: '👨‍🌾 Producer:',
      variety: '🌱 Variety:',
      roaster: '🏭 Roaster:',
      name: '🌿 Name:',
      url: '🔗 URL:' // Додаємо лейбл для URL
    };

    return (
      <div className="bean-detail">
        <span className="detail-label">{fieldLabels[fieldName] || `${fieldName}:`}</span>
        <span className="detail-value">
          {Array.isArray(value) ? value.join(', ') : value}
        </span>
      </div>
    );
  };

  // Функція для відображення URL
  const renderUrl = (bean) => {
    if (!bean.url) return null;
    
    return (
      <div className="bean-detail url-detail">
        <span className="detail-label">🔗 URL:</span>
        <a 
          href={bean.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bean-url-link"
          title="Open product page"
        >
          {bean.url.length > 50 ? `${bean.url.substring(0, 47)}...` : bean.url}
        </a>
      </div>
    );
  };

  if (loading) {
    return <div className="RoasterDetailsModeraition-loader">Loading...</div>;
  }

  if (!roaster) {
    return <div className="RoasterDetailsModeraition-not-found">Roaster not found</div>;
  }

  return (
    <div className="RoasterDetailsModeraition-container">
      {/* Повідомлення про результат */}
    
      {deleteResult && (
        <div className={`delete-result ${deleteResult.type}`}>
          {deleteResult.message}
        </div>
      )}

      {/* Модальне вікно для видалення одного зерна */}
      {showDeleteModal && beanToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete "<strong>{beanToDelete.name}</strong>"?</p>
            <p className="warning-text">This action cannot be undone!</p>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel-btn"
                onClick={closeModals}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="modal-btn delete-btn"
                onClick={handleDeleteBean}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно для видалення всіх зерен */}
      {showDeleteAllModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Bulk Deletion</h3>
            <p>Are you sure you want to delete <strong>ALL {beans.length} beans</strong> from <strong>{roaster.name}</strong>?</p>
            <p className="warning-text">This action cannot be undone!</p>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel-btn"
                onClick={closeModals}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="modal-btn delete-btn"
                onClick={handleDeleteAllBeans}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}

      <img
        src={back}
        alt="back"
        className="RoasterDetailsModeraition-back"
        onClick={() => navigate("/")}
      />
      
      <div className="RoasterDetailsModeraition-roaster-card">
        <img
          src={roaster.logo || defoultImg}
          alt="Roaster Logo"
          className="RoasterDetailsModeraition-roaster-logo"
        />
        <div className="RoasterDetailsModeraition-roaster-info">
          <h1>{roaster.name}</h1>
          <p className="RoasterDetailsModeraition-description">
            {roaster.description || "No description available"}
          </p>
          <div className="RoasterDetailsModeraition-location">
            <span className="location-icon">🌍</span>
            {roaster.country || "Unknown"}
            {roaster.city && ` • ${roaster.city}`}
          </div>
          {roaster.website && (
            <div className="RoasterDetailsModeraition-website-container">
              <a 
                href={roaster.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="RoasterDetailsModeraition-website"
              >
                🌐 Visit Website
              </a>
              <span className="website-url">({roaster.website})</span>
            </div>
          )}
        </div>
      </div>

      <div className="RoasterDetailsModeraition-header-actions">
        <h2 className="RoasterDetailsModeraition-beans-title">
          Available Beans ({beans.length})
        </h2>
        {beans.length > 0 && (
          <button 
            className="RoasterDetailsModeraition-delete-all-btn"
            onClick={confirmDeleteAllBeans}
            disabled={deleting}
          >
            {deleting ? "⏳ Deleting..." : "🗑️ Delete All Beans"}
          </button>
        )}
      </div>
      
<div className="RoasterDetailsModeraition-beans-grid">
  {beans.length > 0 ? (
    beans.map((bean) => (
      <div key={bean.id} className="RoasterDetailsModeraition-bean-card">
        {/* Кнопка видалення окремого зерна */}
        <button 
          className="bean-delete-btn"
          onClick={() => confirmDeleteBean(bean.id, bean.name)}
          title="Delete this bean"
          disabled={deleting}
        >
          {deleting ? "⏳" : "×"}
        </button>
        
        <div className="bean-card-header">
          <h3 className="bean-name">{bean.name}</h3>
          {bean.price && (
            <span className="bean-price">{bean.price} ₴</span>
          )}
        </div>
        
        <div className="bean-details">
          {/* Відображаємо всі дозволені поля */}
          {ALLOWED_FIELD_NAMES.map(fieldName => 
            renderField(bean, fieldName)
          )}
          
          {/* Відображаємо URL - ВСТАВТЕ ТУТ */}
      {bean.source_url && (
  <a 
    href={bean.source_url} 
    target="_blank" 
    rel="noopener noreferrer"
    className="bean-url-link"
  >
    <span>{bean.source_url.length > 30 ? bean.source_url.substring(0, 27) + '...' : bean.source_url}</span>
  </a>
)}
        </div>
      </div>
    ))
  ) : (
    <div className="RoasterDetailsModeraition-no-beans">
      <p>No beans found for this roaster</p>
    </div>
  )}
</div>
    </div>
  );
};

export default RoasterDetailsModeraition;