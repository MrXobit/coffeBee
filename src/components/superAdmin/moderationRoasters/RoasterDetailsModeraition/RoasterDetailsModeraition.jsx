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
          console.log('📋 Roaster data:', roasterData);
          
          setRoaster({ id: roasterSnap.id, ...roasterData });

          const beansRef = collection(db, "beans");

          // перший пошук — по id ростера
          console.log('🔍 First query - searching by roaster ID:', id);
          const q1 = query(
            beansRef,
            where("roaster", "==", String(roasterSnap.id)),
            where("isVerified", "==", true)
          );
          const beansSnap1 = await getDocs(q1);
          let beans = beansSnap1.docs.map((d) => ({ id: d.id, ...d.data() }));
          
          console.log('📊 First query results:', beans.length, 'beans');
          beans.forEach(bean => {
            console.log('   -', bean.name, '(ID:', bean.id, ')');
          });

          // другий пошук — тільки якщо aliasId є і їх більше ніж 1
          const aliasIds = roasterData.aliasId;
          console.log('🔍 Alias IDs found:', aliasIds);
          
          if (Array.isArray(aliasIds) && aliasIds.length > 1) {
            console.log('🔍 Second query - searching by alias IDs:', aliasIds);
            const q2 = query(
              beansRef,
              where("roaster", "in", aliasIds),
              where("isVerified", "==", true)
            );
            const beansSnap2 = await getDocs(q2);
            const beans2 = beansSnap2.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));

            console.log('📊 Second query results:', beans2.length, 'beans');
            beans2.forEach(bean => {
              console.log('   -', bean.name, '(ID:', bean.id, ')');
            });

            // додаємо результати
            beans = [...beans, ...beans2];
          }

          console.log('📦 Total beans after merge:', beans.length);
          console.log('📋 Final beans list:');
          beans.forEach(bean => {
            console.log('   -', bean.name, '(roaster:', bean.roaster, ')');
          });

          setBeans(beans);
        } else {
          console.log('❌ Roaster not found with ID:', id);
          setRoaster(null);
          setBeans([]);
        }
      } catch (err) {
        console.error('❌ Error loading roaster/beans:', err);
        console.error('Error details:', err.message);
        console.error('Error stack:', err.stack);
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
      name: '🌿 Name:'
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