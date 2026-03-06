import React, { useState } from 'react'
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../../../../../firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RoasterInfo = ({ selectedRoaster, onClearSelection, onShowRoasterSelector
  ,
  onSaveParser,
  isSaveParserButtonActive,
  savingParser,
  isFromUrl
 }) => {
  const [editingWebsite, setEditingWebsite] = useState(false);
  const [editingShop, setEditingShop] = useState(false);
  const [tempWebsite, setTempWebsite] = useState('');
  const [tempShop, setTempShop] = useState('');
  const [updatingRoasterWebsite, setUpdatingRoasterWebsite] = useState(false);
  const [updatingRoasterShop, setUpdatingRoasterShop] = useState(false);

  const notifySuccess = (message) => toast.success(message);
  const notifyError = (message) => toast.error(message);

  const handleUpdateRoasterWebsite = async () => {
    if (!selectedRoaster) {
      notifyError('Please select a roaster');
      return;
    }

    // Дозволяємо пусте поле - воно видалить website з бази даних
    if (tempWebsite) {
      try {
        new URL(tempWebsite);
      } catch (err) {
        notifyError('Please enter a valid URL (including http:// or https://)');
        return;
      }
    }

    try {
      setUpdatingRoasterWebsite(true);
      
      const roasterRef = doc(db, 'roasters', selectedRoaster.id);
      
      // Якщо поле пусте - видаляємо його з бази даних
      const updateData = {
        updatedAt: new Date()
      };
      
      if (tempWebsite.trim() === '') {
        updateData.website = deleteField(); // повністю видаляємо поле
      } else {
        updateData.website = tempWebsite;
      }
      
      await updateDoc(roasterRef, updateData);
      
      // Оновлюємо локальний стан ростеру
      selectedRoaster.website = tempWebsite.trim() === '' ? undefined : tempWebsite;
      
      if (tempWebsite.trim() === '') {
        notifySuccess('✅ Roaster website removed from database!');
      } else {
        notifySuccess('✅ Roaster website updated successfully in database!');
      }
      
      setEditingWebsite(false);
    } catch (error) {
      console.error('❌ Error updating roaster website:', error);
      notifyError('❌ Failed to update roaster website in database');
    } finally {
      setUpdatingRoasterWebsite(false);
    }
  };

  const handleUpdateRoasterShop = async () => {
    if (!selectedRoaster) {
      notifyError('Please select a roaster');
      return;
    }

    // Дозволяємо пусте поле - воно видалить shop з бази даних
    if (tempShop) {
      try {
        new URL(tempShop);
      } catch (err) {
        notifyError('Please enter a valid URL (including http:// or https://)');
        return;
      }
    }

    try {
      setUpdatingRoasterShop(true);
      
      const roasterRef = doc(db, 'roasters', selectedRoaster.id);
      
      // Якщо поле пусте - видаляємо його з бази даних
      const updateData = {
        updatedAt: new Date()
      };
      
      if (tempShop.trim() === '') {
        updateData.shop = deleteField(); // повністю видаляємо поле
      } else {
        updateData.shop = tempShop;
      }
      
      await updateDoc(roasterRef, updateData);
      
      // Оновлюємо локальний стан ростеру
      selectedRoaster.shop = tempShop.trim() === '' ? undefined : tempShop;
      
      if (tempShop.trim() === '') {
        notifySuccess('✅ Roaster shop removed from database!');
      } else {
        notifySuccess('✅ Roaster shop updated successfully in database!');
      }
      
      setEditingShop(false);
    } catch (error) {
      console.error('❌ Error updating roaster shop:', error);
      notifyError('❌ Failed to update roaster shop in database');
    } finally {
      setUpdatingRoasterShop(false);
    }
  };

  const startEditingWebsite = () => {
    setTempWebsite(selectedRoaster.website || '');
    setEditingWebsite(true);
  };

  const cancelEditingWebsite = () => {
    setEditingWebsite(false);
    setTempWebsite('');
  };

  const startEditingShop = () => {
    setTempShop(selectedRoaster.shop || '');
    setEditingShop(true);
  };

  const cancelEditingShop = () => {
    setEditingShop(false);
    setTempShop('');
  };

  if (!selectedRoaster) {
    return (
      <div className="beanfetch-header">
        {/* <div className="beanfetch-no-roaster">
          <h1 className="beanfetch-title">Bean Fetch</h1>
          <button 
            onClick={onShowRoasterSelector}
            className="beanfetch-select-roaster-btn"
          >
            🏭 Select Roaster
          </button>
        </div> */}
      </div>
    );
  }

  return (
    <div className="beanfetch-header">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="beanfetch-roaster-info">
        <div className="beanfetch-roaster-header">
          {/* {isFromUrl === false && 
              <button onClick={onClearSelection} className="beanfetch-back-btn">
            ← Change Roaster
          </button>
          } */}
      
          <h1 className="beanfetch-title">
            Bean Fetch for: <span className="beanfetch-roaster-name">{selectedRoaster.name}</span>
          </h1>
        </div>
        <div className="beanfetch-roaster-details">
          <div className="beanfetch-website-section">
            <div className="beanfetch-website-label">
              <strong>Website in DB:</strong>
            </div>
            
            {!editingWebsite ? (
              <div className="beanfetch-website-display">
                {selectedRoaster.website ? (
                  <>
                    <span className="beanfetch-website-url">{selectedRoaster.website}</span>
                    <button
                      onClick={startEditingWebsite}
                      className="beanfetch-edit-btn"
                      title="Edit website"
                    >
                      ✏️
                    </button>
                  </>
                ) : (
                  <>
                    <span className="beanfetch-no-website">No website set</span>
                    <button
                      onClick={startEditingWebsite}
                      className="beanfetch-add-btn"
                      title="Add website"
                    >
                      ➕ Add Website
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="beanfetch-website-editor">
                <input
                  type="text"
                  value={tempWebsite}
                  onChange={(e) => setTempWebsite(e.target.value)}
                  placeholder="https://example.com (leave empty to remove)"
                  className="beanfetch-website-input"
                />
                <div className="beanfetch-website-actions">
                  <button
                    onClick={handleUpdateRoasterWebsite}
                    disabled={updatingRoasterWebsite}
                    className="beanfetch-save-btn"
                  >
                    {updatingRoasterWebsite ? 'Saving...' : '💾 Save'}
                  </button>
                  <button
                    onClick={cancelEditingWebsite}
                    disabled={updatingRoasterWebsite}
                    className="beanfetch-cancel-btn"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="beanfetch-website-section">
            <div className="beanfetch-website-label">
              <strong>Shop in DB:</strong>
            </div>
            
            {!editingShop ? (
              <div className="beanfetch-website-display">
                {selectedRoaster.shop ? (
                  <>
                    <span className="beanfetch-website-url">{selectedRoaster.shop}</span>
                    <button
                      onClick={startEditingShop}
                      className="beanfetch-edit-btn"
                      title="Edit shop"
                    >
                      ✏️
                    </button>
                  </>
                ) : (
                  <>
                    <span className="beanfetch-no-website">No shop set</span>
                    <button
                      onClick={startEditingShop}
                      className="beanfetch-add-btn"
                      title="Add shop"
                    >
                      ➕ Add Shop
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="beanfetch-website-editor">
                <input
                  type="text"
                  value={tempShop}
                  onChange={(e) => setTempShop(e.target.value)}
                  placeholder="https://example.com (leave empty to remove)"
                  className="beanfetch-website-input"
                />
                <div className="beanfetch-website-actions">
                  <button
                    onClick={handleUpdateRoasterShop}
                    disabled={updatingRoasterShop}
                    className="beanfetch-save-btn"
                  >
                    {updatingRoasterShop ? 'Saving...' : '💾 Save'}
                  </button>
                  <button
                    onClick={cancelEditingShop}
                    disabled={updatingRoasterShop}
                    className="beanfetch-cancel-btn"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
          {/* {selectedRoaster && (
        <button
          onClick={onSaveParser}
          disabled={!isSaveParserButtonActive || savingParser}
          className={`beanfetch-btn save-parser-btn ${savingParser ? 'loading' : ''}`}
        >
          {savingParser ? (
            <>
              <span className="spinner-small"></span>
              Saving Parser...
            </>
          ) : (
            '💾 Save Parser Configuration'
          )}
        </button>
      )} */}
    </div>
  );
};

export default RoasterInfo;