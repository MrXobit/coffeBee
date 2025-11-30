import React, { useState } from 'react'
import ModerationRoaster from './RoasterModal'
import close from '../../../assets/back.png'
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BeanEditModal = ({ bean, setBean, handleCloseModal, currentBeans, setBeans, setMoadal }) => {
 const [isBeanAddable, setIsBeanAddable] = useState(false);
 const [roasterLoading, setRoasterLoading] = useState(false);
const [editBtnSave, setEditBtnSave] = useState(false)
  const notifySuccess = (message) => toast.success(message);
    const notifyError = (message) => toast.error(message);
  
const navigate = useNavigate()


const handleAddEdit = async (bean) => {
   if (!isBeanAddable) return;
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
    navigate('/');
    notifySuccess("Bean has been successfully added");
  } catch (e) {
    console.log(e);
  } finally {
    setEditBtnSave(false);
  }
};





  if (!bean) return null

  const handleChange = (field, value) => setBean(prev => ({ ...prev, [field]: value }))

  


  return (
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
              onChange={(e) => handleChange('name', e.target.value)}
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
              onChange={(e) => handleChange('country', e.target.value)}
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
              onChange={(e) => handleChange('roaster', e.target.value)}
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
              onChange={(e) => handleChange('variety', e.target.value)}
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
              onChange={(e) => handleChange('process', e.target.value)}
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
              onChange={(e) => handleChange('producer', e.target.value)}
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
              onChange={(e) => handleChange('flavours', e.target.value.split(',').map(f => f.trim()))}
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
              onChange={(e) => handleChange('flavoursByRoaster', e.target.value.split(',').map(f => f.trim()))}
            />
          </div>
        )}

        {/* isAI */}
        {bean.isAI !== undefined && (
          <div className="ModerationBeans-editField">
            <label className="ModerationBeans-editLabel">isAI:</label>
            <div className="ModerationBeans-editField-checkboxWrapper">
              <input
                type="checkbox"
                checked={bean.isAI}
                onChange={(e) => handleChange('isAI', e.target.checked)}
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
                onChange={(e) => handleChange('isVerified', e.target.checked)}
              />
              <span>{bean.isVerified ? 'Yes' : 'No'}</span>
            </div>
          </div>
        )}

     <ModerationRoaster  roasterLoading={roasterLoading}
  setRoasterLoading={setRoasterLoading} setIsBeanAddable={setIsBeanAddable} currentBeans={currentBeans} bean={bean} />

{!roasterLoading && !isBeanAddable && (
  <p className="ModerationBeans-cannotAddP">
    Cannot add — roaster did not pass moderation
  </p>
)}


        {/* Buttons */}
       <div className="ModerationBeans-editActions">
  {!roasterLoading && (
    isBeanAddable ? (
      <button
        className="ModerationBeans-saveBtn"
        onClick={() => handleAddEdit(bean)}
      >
        {editBtnSave ? 'Loading' : "Add Bean"}
      </button>
    ) : (
      <button className="ModerationBeans-saveBtn" disabled>
        Cannot add
      </button>
    )
  )}

  <button
    className="ModerationBeans-cancelBtn"
    onClick={handleCloseModal}
  >
    Cancel
  </button>
</div>

      </div>
    </div>
  )
}

export default BeanEditModal
