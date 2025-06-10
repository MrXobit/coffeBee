import React, { useEffect, useState } from 'react'
import './ModerationCafe.css'
import axios from 'axios'
import { db } from '../../../firebase'
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import Loader from '../../loader/Loader';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
const ModerationCafe = () => {

       const notifySuccess = (message) => toast.success(message);
        const notifyError = (message) => toast.error(message);

    const [cafe, setCafe] = useState([])
    const [loading, setLoading] = useState(false)
    const [localLoading, setLocalLoading] = useState({loading: false, step: 0})
    const loadData = async () => {
        try {
          setLoading(true);
      
          const token = localStorage.getItem('token');
          const response = await axios.post(
            'https://us-central1-coffee-bee.cloudfunctions.net/validAccesAdmin',
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
      
          if (!response.data.access) {
            return;
          }
      
          const cafeRef = collection(db, 'moderationCafe');
          const snapshot = await getDocs(cafeRef);
          
          const cafeList = [];
          
          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
          
            if ('rejected' in data) continue;
          
            cafeList.push({
              id: docSnap.id,
              ...data,
            });
          }
          
          setCafe(cafeList);


          console.log(cafeList);
        } catch (e) {
          console.log(e);
        } finally {
          setLoading(false);
        }
      };


       const handleReject = async(cafeItem) => {
        setLoading(true);
         try  {
            
            const cafeRef = doc(db, 'moderationCafe', cafeItem.id);
            await updateDoc(cafeRef, {
              rejected: true,
            });    
            setCafe(prev => prev.filter(item => item.id !== cafeItem.id));

            notifySuccess('Successfully rejected!');

         }catch(e) {
            console.log(e)
         }finally {
            setLoading(false);
         }
       }

    
       const handleAdd = async(cafeItem) => {
        setLoading(true)
        try {
           const cafeRef = doc(db, 'cafe', cafeItem.id)
           const cafeSnap = await getDoc(cafeRef);

           if (cafeSnap.exists()) {
            await updateDoc(cafeRef, {
                rejected: true,
              }); 
              setCafe(prev => prev.filter(item => item.id !== cafeItem.id));
              setLoading(false)
              notifyError('A cafe with this ID already exists.');
              return
           }

           await setDoc(cafeRef, {
            adminData: cafeItem.adminData,
            ...cafeItem.google_info,    
          });


           await deleteDoc(doc(db, 'moderationCafe', cafeItem.id));

           setCafe(prev => prev.filter(item => item.id !== cafeItem.id));
           
           notifySuccess('Added to the main database successfully!');

        }catch(e) {
          console.log(e)
        } finally {
            setLoading(false)
        }
       }



      


    useEffect(() => {
        loadData()
    }, [])
    return (
        <div className="ModerationCafe-con">
          <h1 className='ModerationCafe-title'>Moderation Cafe</h1>
          {loading ? (
            <div className='ModerationCafe-loader-con'>
               <Loader />
            </div>
          ) : cafe.length > 0 ? (
            <div className="activeRoasters-maincard-for-cards">
             {cafe.map((item) => (
  <div key={item.id} className="activeRoasters-card-con">
    <img
       src={Object.values(item.adminData.photos)[0]}
      alt="Cafe Logo"
      className="activeRoasters-card-img"
    />
    <div className="activeRoasters-card-name">{item.google_info.name}</div>
    <div className="activeRoasters-card-description">
      {item.google_info.vicinity}
    </div>

  <a href={item.google_info.url} target="_blank" rel="noopener noreferrer" className="activeRoasters-card">
  Link to Google Maps
</a>

    <div className="AdminNetworkRequests-ModerationCafe-actions">
      <button onClick={() => handleAdd(item)} className="ModerationCafe-apply">Apply</button>
      <button onClick={() => handleReject(item)} className="ModerationCafe-reject">Reject</button>
    </div>
  </div>
))}

            </div>
          ) : (
            <div className="ModerationCafe-noRequests">No moderation requests available</div>
          )}
           <ToastContainer />     
        </div>
      );
}      

export default ModerationCafe
