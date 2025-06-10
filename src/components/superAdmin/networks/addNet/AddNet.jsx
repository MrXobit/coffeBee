
import { Link, useNavigate } from 'react-router-dom'
import goBack from '../../../../assets/back.png'

import React, { useState } from 'react'
import './AddNet.css'

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import axios from 'axios';




const AddNet = () => {

    const navigate = useNavigate()

    
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const notifyError = (message) => toast.error(message);

    const handleCreateNetwork = async() => {
        setLoading(true)

        const token = localStorage.getItem('token');
        const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/validAccesAdmin', {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
    
        if (!response.data.access) { 
            return
        }

        if(name.trim() === '') {
            notifyError('Please enter a valid network name. It cannot be empty.');
            setLoading(false);
            return
        }
        try {
            const networkRef = doc(db, 'networks', name); 
            const networkDoc = await getDoc(networkRef);
            if(networkDoc.exists()) {
                notifyError(`A network with this name already exists`);
                setName('')
                setLoading(false);
                return
            }

            await setDoc(networkRef, {
                name: name,
                cafeIds: [],
                requestsCafes: [],
                creatorId: '',
            });
            setName('')
   
            navigate('/super-admin')
            
        } catch(e) {
            notifyError('Oops! Something went wrong. Please try again later.');
        } finally {
            setLoading(false)
        }
    }


  return (
    <div className='createCoffeNetwork-con'>

  <Link to="/super-admin">
         <img className='createCoffeNetwork-imgBack' src={goBack} alt="" />
       </Link>

       <h1 className="createCoffeNetwork-title">
    Create Coffee Network
  </h1>

  <input
    value={name}
    onChange={e => setName(e.target.value)}
    className='createCoffeNetwork-input'
    type="text"
    placeholder='Please enter the name of the network'
  />

  <button onClick={handleCreateNetwork} disabled={loading} className='createCoffeNetwork-btn'>{loading ? "loading..." : "Create"}</button>
  
    <ToastContainer />

    </div>
  )
}

export default AddNet
