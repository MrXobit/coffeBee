import React, { useEffect, useState } from 'react'
import goBack from '../../../assets/back.png'
import './JoinCoffeNetwork.css'
import debounce from 'lodash.debounce'
import axios from 'axios'
import Loader from '../../loader/Loader'
import { db } from '../../../firebase'
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import ToggleSwitch from '../../toggleSwitch/ToggleSwitch'
import JoinNetworksRequests from '../JoinNetworksRequests/JoinNetworksRequests'


const JoinCoffeNetwork = ({setChoice}) => {
const [network, setNetwork] = useState([])
const [loading, setLoading] = useState(false)
const [success, setSuccess] = useState(false)
const [localLoading, setLoacalLoading] = useState({disabled: false, name: ''})
const [sended, setSended] = useState([])
const [toggleValue, setToggleValue] = useState(true)


    const notifySuccess = (message) => toast.success(message);
    const notifyError = (message) => toast.error(message);

    useEffect(() => {
      loadData()
     }, [])

    const loadData = async() => {
      setLoading(true);
      try {
        const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
        const cafeRef = doc(db, 'cafe', selectedCafe.id); 
        const cafeDoc = await getDoc(cafeRef);
        const cafeData = cafeDoc.data();
        const networkRequestsArray = [];
        
        if (cafeData.networkRequests) {
          cafeData.networkRequests.map(boo => 
            boo.request === true && networkRequestsArray.push(boo.name)
          );
        }
        
        setSended(networkRequestsArray);
      } catch(e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    
    



const handleSearch = debounce(async(e) => {
  setSuccess(false);
  if (!e.target.value.trim()) {
    setNetwork([])
    setLoading(false)
    return;
  }
    try {
    
       const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/getNetworkByInput', {
        networkName: e.target.value,
       })
       if(Array.isArray(response.data) && response.data.length === 0) {
        setSuccess(true)
        setNetwork([]);
       } else {
        setNetwork(response.data)
        setSuccess(false)
       }
    } catch (error) {
       console.log(error.response.data)
    }finally {
      setLoading(false)
    }
},500)

const handleSearchMain = (e) => {
  setLoading(true)
  handleSearch(e)
}



const handleSendJoinRequest = async(name) => {
  setLoacalLoading({disabled: true, name: name});
  try {

    const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
    

    if (!selectedCafe) {
      notifyError("Selected cafe not found.");
      return;
    }


    const cafeRef = doc(db, 'cafe', selectedCafe.id); 
    

    const cafeDoc = await getDoc(cafeRef);
    const cafeData = cafeDoc.data();

    let canSendRequest = true;


    if (cafeData.networkRequests && Array.isArray(cafeData.networkRequests)) {
      const alreadyRequested = cafeData.networkRequests.some(
        (req) => req.name === name && req.request === true
      );
      
      if (alreadyRequested) {
        canSendRequest = false;
      }
    }

    if (!canSendRequest) {
      notifyError("You've already sent a join request to this network. Please wait for a response.");
      return;
    }


    const networkRef = doc(db, 'networks', name);


    await updateDoc(networkRef, {
       requestsCafes : arrayUnion(selectedCafe.id) 
    });

    let updatedRequests = [];

    
    if (Array.isArray(cafeData.networkRequests)) {
      const existingIndex = cafeData.networkRequests.findIndex(
        (req) => req.name === name
      );
      
      if (existingIndex !== -1) {
        updatedRequests = [...cafeData.networkRequests];
        updatedRequests[existingIndex].request = true; 
      } else {
        updatedRequests = [
          ...cafeData.networkRequests,
          { name: name, request: true }
        ];
      }
    } else {
      updatedRequests = [{ name: name, request: true }];
    }


    await updateDoc(cafeRef, {
      networkRequests: updatedRequests
    });
    notifySuccess('Join request sent successfully!');

  } catch (e) {
    console.log(e);
  } finally {
    setLoacalLoading({disabled: false, name: ''});
  }
};

const handleToggle = (isAllBeans) => {
  setToggleValue(isAllBeans);
  localStorage.setItem('roasterPage', JSON.stringify(isAllBeans))
};



  return (
    <div className='JoinCoffeNetwork-con'>
    <img className='createCoffeNetwork-imgBack'  onClick={() => (setChoice(1))} src={goBack} alt="" />
    <ToggleSwitch toggleValue={toggleValue} onToggle={handleToggle} words={['Networks', 'Requests']} />
   
      {toggleValue ? (
<>
<h1 className="joinCoffeNetwork-title" >Find network</h1>

<input onChange={handleSearchMain} placeholder='find network'/>
{loading ? (
  <Loader />
) : network.length === 0 ? (
  success ? (
    <div className="roasters-notFound-results">
      <p>No results. Please try another search</p>
    </div>
  ) : null
) : (
  network.map((network) => (
    <div key={network.name} className="JoinCoffeNetwork-network-con">
      <h1>Network name: <strong>{network.name}</strong></h1>
      <p>members: {network.cafeIds.length}</p>
      <button 
      disabled={localLoading?.disabled || sended.includes(network.name)} 
      onClick={() => handleSendJoinRequest(network.name)} 
      className="JoinCoffeNetwork-join-network-button"
    >
      {sended.includes(network.name) 
        ? "You already sent a request" 
        : (localLoading.name === network.name 
          ? "Loading..." 
          : "Join Network")}
    </button>
    </div>
  ))

)}
</>
      ) : (
         <JoinNetworksRequests/>
      )}
   
    <ToastContainer />
    </div>
  )
}

export default JoinCoffeNetwork




