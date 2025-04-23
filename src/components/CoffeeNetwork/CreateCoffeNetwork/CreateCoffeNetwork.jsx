import React, { useState } from 'react'
import './CreateCoffeNetwork.css'
import goBack from '../../../assets/back.png'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';


const CreateCoffeNetwork = ({setChoice, setSuperAdmin}) => {


    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const notifyError = (message) => toast.error(message);

    const handleCreateNetwork = async() => {
        setLoading(true)
        const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
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
                cafeIds: [selectedCafe.id],
                requestsCafes: [],
                creatorId: selectedCafe.id,
            });

            const cafeRef = doc(db, 'cafe', selectedCafe.id);

            await updateDoc(cafeRef, {
                network: {
                    name: name,
                    isCreator: true
                  }                  
            });
            setName('')
            setSuperAdmin(true)
            localStorage.setItem('selectedCafe', JSON.stringify({ ...selectedCafe, network: { name, isCreator: true } })); 
        } catch(e) {
            notifyError('Oops! Something went wrong. Please try again later.');
        } finally {
            setLoading(false)
        }
    }

  return (

 <div className='createCoffeNetwork-con'>
   <img className='createCoffeNetwork-imgBack'  onClick={() => (setChoice(1))} src={goBack} alt="" />
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

export default CreateCoffeNetwork

