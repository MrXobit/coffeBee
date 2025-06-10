import axios from 'axios';
import debounce from 'lodash.debounce';
import React, { useState } from 'react'
import Loader from '../../../loader/Loader';
import { Link } from 'react-router-dom';
import ToggleSwitch from '../../../toggleSwitch/ToggleSwitch';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';

const NetworkAddCoffeForNet = ({networkName, setNetworkKafes}) => {

        const [roasters, setRoasters] = useState([]);
        const [loading, setLoading] = useState(false);
        const [success, setSuccess] = useState(false);
        const [localLoading, setLocalLoading] = useState({loading: false, cafeId: null})

  const notifySuccess = (message) => toast.success(message);
  const notifyError = (message) => toast.error(message);
    const handleSearch = debounce(async (e) => {
  
        setSuccess(false);
        setRoasters([])
    
        if (!e.target.value.trim()) {
          setLoading(false);
          return;
        }
        try {
        
    
          const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/getCoffeByInput', {
              coffeName: e.target.value,
          });
          
          if (Array.isArray(response.data) && response.data.length === 0) {
            setSuccess(true);
            setRoasters([]);
          } else {
            setRoasters(response.data);
            console.log(response.data)
            setSuccess(false);
          }
        } catch (error) {
          console.log(error.response.data)
        } finally {
          setLoading(false);
        }
      }, 500);
    
      const handleSearchMain = (e) => {
        setLoading(true);
        handleSearch(e);
      };
    

      const handleAdd = async(cafeId) => {
        setLocalLoading({loading: true, cafeId: cafeId})
        try {
          const networkRef = doc(db, 'coffeeChain', networkName)
        

          const cafeRef = doc(db, "cafe", cafeId);
          const cafeSnap = await getDoc(cafeRef);
          const cafeData = cafeSnap.data();
          
  
          if(cafeData?.network?.name) {
              await updateDoc(networkRef, {
                requestsCafes: arrayRemove(cafeId)
              });
              notifyError('This cafe is already associated with another network');
              return;
          }
  
          await updateDoc(cafeRef, {
              network: {name: networkName, isCreator: false}
          })
  
          await updateDoc(networkRef, {
              cafeIds: arrayUnion(cafeId),
              requestsCafes: arrayRemove(cafeId)
            });  

            setNetworkKafes(prev => [...prev, { id: cafeSnap.id, ...cafeData }])
            notifySuccess('Cafe has been successfully added to the network');
        }catch(e) {
          console.log(e)
          notifyError('Something went wrong. Please try again later.');
        }finally {
          setLocalLoading({loading: false, cafeId: null})
        }
      }


      return (
        <div className='NetworkAddCoffeForNet-con'>
          <h1 className="mainAdmin-roasters-main-title">Find Cafe</h1>
      
          <input
            type="text"
            className="main-adminroasters-main-input-search"
            onChange={handleSearchMain}
            placeholder="Search for cafes"
          />
      
          {loading ? (
            <div className="roaster-con-forLoading">
              <Loader />
            </div>
          ) : roasters.length === 0 ? (
            success ? (
              <div className="roasters-notFound-results">
                <p>No results. Please try another search</p>
              </div>
            ) : null
          ) : (
            <div className="activeRoasters-maincard-for-cards">
              {roasters.map((roaster) => (
                <Link key={roaster.id}>
                  <div className="activeRoasters-card-con">
                    <img
                      src={Object.values(roaster.adminData.photos)[0]}
                      alt="Roaster Logo"
                      className="activeRoasters-card-img"
                    />
                    <div className="activeRoasters-card-name">{roaster.name}</div>
                    <div className="activeRoasters-card-description">
                      {roaster.vicinity}
                    </div>
                    <div className="activeRoastersAdmin-roaster-actions">
                      {roaster?.network?.name ? (
                       <div className='NetworkAddCoffeForNet-olredyIs'>This cafe is already in the network: <span>{roaster.network.name}</span></div>
                      ) : (
                        <button disabled={localLoading.loading && localLoading.cafeId === roaster.id} className='NetworkAddCoffeForNet-addCafe-forNet' 
                        onClick={() => handleAdd(roaster.id)}>
                          {(localLoading.loading && localLoading.cafeId === roaster.id) ? "loading..." : "Add Cafe to Network"}</button>
                      )}
                  
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <ToastContainer />
        </div>
      );
      
}

export default NetworkAddCoffeForNet
