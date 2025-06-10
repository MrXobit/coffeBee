import React, { useEffect, useState } from 'react'
import "./JoinNetworksRequests.css"
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import Loader from '../../loader/Loader'
const JoinNetworksRequests = () => {

    const [loading, setLoading] = useState(false)
    const [networks, setNetworks] = useState(false)

    const loadData = async() => {
        setLoading(true)
        try {
            const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
            const cafeRef = doc(db, 'cafe', selectedCafe.id); 
            const cafeDoc = await getDoc(cafeRef);
            const cafeData = cafeDoc.data();
    
            if(cafeData.networkRequests && Array.isArray(cafeData.networkRequests) && cafeData.networkRequests.length > 0) {
                setNetworks(cafeData.networkRequests)
            }
        
        } catch(e) {
            console.log(e)
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        loadData()
    }, [])

  return (
    <div className='JoinNetworksRequests-con'>
       <h1 className='JoinNetworksRequests-title'>You requests</h1>
       {loading ? (
        <div className='loader-con'>
             <Loader/>
        </div>
       
       ) : (
        <>
     {Array.isArray(networks) && networks.length > 0 ? (
  <div className='JoinNetworksRequests-card-main'>
    {networks.map((network) => (
      <div className='JoinNetworksRequests-card-block'  key={network.name}>
        <h1 className='JoinNetworksRequests-card-h1' onClick={() => console.log(network)}>name: {network.name}</h1>
        {network.request === true ? (
            <p className='JoinNetworksRequests-card-p-apply'>Your request has been sent. Please wait for a response</p>
      
        ) : (
            <p className='JoinNetworksRequests-card-p-rejected'>Your request has been rejected</p>
        )}
      </div>
    ))}
  </div>
) : (
  <div className='JoinNetworksRequests-noReq'>You haven't any requests</div>
)}

        </>
       )}
    </div>
  )
}

export default JoinNetworksRequests
