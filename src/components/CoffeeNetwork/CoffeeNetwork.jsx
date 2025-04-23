import React, { useEffect, useState } from 'react'
import "./CoffeeNetwork.css" 
import CreateCoffeNetwork from './CreateCoffeNetwork/CreateCoffeNetwork'
import JoinCoffeNetwork from './JoinCoffeNetwork/JoinCoffeNetwork'
import { db } from '../../firebase'
import { doc, getDoc } from "firebase/firestore";
import AdminNetwork from './AdminNetwork/AdminNetwork'
import SubLoader from '../loader/SubLoader'

const CoffeeNetwork = () => {
    const [choice, setChoice] = useState(null)
    const [superAdmin, setSuperAdmin] = useState(false)
    const [loading, setLoading] = useState(false);
    const loadInfo = async() => {
      setLoading(true)
      try {
        const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
        const cafeRef = doc(db, "cafe", selectedCafe.id); 
        const cafeSnap = await getDoc(cafeRef);
        const cafeData = cafeSnap.data();     
        if(cafeData.network) {
            if(cafeData.network?.isCreator === true) {
              setLoading(false)
               setSuperAdmin(true)
               return 
            } else {
            
            }
        }
        setChoice(1)
      } catch(e) {
        console.log(e)
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      loadInfo()
    }, [])

    if(loading) {
      return <SubLoader/>
    }

    const handleCreateNetwork =  () => {
       setChoice(2)
    }

    const handleJoinNetwork = () => {
       setChoice(3)
    }


    if(superAdmin) {
      return <AdminNetwork/>
    }


  return (
    <>

      {choice === 1 && (
      
     <div className='coffee-network-container'>
        <h1 className="coffee-network-title">
        Choose option
        </h1>

        <div className="coffee-network-buttons">
        <button onClick={handleCreateNetwork} className="coffee-network-button coffee-network-primary">
          Create Network
        </button>

        <button onClick={handleJoinNetwork} className="coffee-network-button coffee-network-secondary">
          Join Network
        </button>
        </div>
        </div>
      )}

      {choice === 2 && (
        <CreateCoffeNetwork setSuperAdmin={setSuperAdmin} setChoice={setChoice}/>
      )}

      {choice === 3 && (
        <JoinCoffeNetwork setChoice={setChoice}/>
      )} 
     

    </>
   
  )
}

export default CoffeeNetwork
