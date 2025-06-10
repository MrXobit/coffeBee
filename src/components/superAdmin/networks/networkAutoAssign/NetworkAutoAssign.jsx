import React, { useState } from 'react';
import '../networkDetails/NetworkDetails.css';
import { arrayUnion, collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
const NetworkAutoAssign = ({loadData}) => {
  const [loading, setLoading] = useState(false);
  


       const notifySuccess = (message) => toast.success(message);
          const notifyError = (message) => toast.error(message);


          const getNetworkNames = async () => {
            const netNames = {};
          
            try {
              const netCollectionsRef = collection(db, 'coffeeChain');
              const querySnapshot = await getDocs(netCollectionsRef); 
          
              querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.name) {
                  netNames[data.name] = true;
                }
              });
          
              return netNames;
            } catch (error) {
              console.error('Помилка при отриманні мереж:', error);
              return {}; 
            }
          };

  const handleNetworkAutoAssign = async () => {
    setLoading(true);
    try {
      const netNames = await getNetworkNames()
      console.log(netNames)

      const cafeCollectionRef = collection(db, 'cafe');
      const querySnapshot = await getDocs(cafeCollectionRef);

      const initialCafeList = [];
      for (const docSnap of querySnapshot.docs) {
        const cafeData = docSnap.data();
        if (cafeData.network?.name) continue;
        initialCafeList.push({ id: cafeData.place_id, cafeName: cafeData.name });
      }
      
      console.log('Кафе без мережі:', initialCafeList);
      const clearArray = []
      for (let i = 0; i < initialCafeList.length; i++) {
        const parts = initialCafeList[i].cafeName.split(' -');
        const baseName = parts[0].trim();
        const docId = baseName.replace(/\//g, '-');
        const fullName = findFullMatch(docId, netNames);
      
        if (fullName) {
          const cafeRef = doc(db, 'cafe', initialCafeList[i].id);
          await updateDoc(cafeRef, {
            network: {
              isCreator: false,
              name: fullName
            }
          }); 
      
          const netRef = doc(db, 'coffeeChain', fullName.replace(/\//g, '-'));
          await updateDoc(netRef, {
            cafeIds: arrayUnion(initialCafeList[i].id),
          });
      
          clearArray.push(initialCafeList[i].id) 
        }
      }
      
      const cafeArray = initialCafeList.filter(cafe => !clearArray.includes(cafe.id));

      const networkMap = {};

      for (const cafe of cafeArray) {
        const parts = cafe.cafeName.split(' -');
        const baseName = parts[0].trim();

        if (!networkMap[baseName]) {
          networkMap[baseName] = {
            networkName: baseName,
            cafeIds: [],
            cafeNames: [],
          };
        }

        networkMap[baseName].cafeIds.push(cafe.id);
        networkMap[baseName].cafeNames.push(cafe.cafeName);
      }

      const result = Object.values(networkMap).filter(group => group.cafeIds.length > 1); // тільки групи з 2+ кафе


      for (let i = 0; i < result.length; i++) {
        const item = result[i];
        const docId = item.networkName.replace(/\//g, '-');
      
        const netObj = {
          cafeIds: item.cafeIds,
          creatorId: 'void-inside',
          name: item.networkName,
          requestsCafes: []
        };
      
        const netRef = doc(db, 'coffeeChain', docId);
        const existingNet = await getDoc(netRef);
        
        if (!existingNet.exists()) {
          await setDoc(netRef, netObj);
        }
        for (let l = 0; l < item.cafeIds.length; l++) {
          const cafeRef = doc(db, 'cafe', item.cafeIds[l]); 
          await updateDoc(cafeRef, {
            network: {
              isCreator: false,
              name: item.networkName
            }
          });
        }
        notifySuccess(`Successfully created network: ${item.networkName}`);
      }

      loadData()

    } catch (e) {
      console.error('Помилка при автоприсвоєнні мереж:', e);
    } finally {
      setLoading(false);
    }
  };

  const findFullMatch = (docId, netNames) => {
    return netNames[docId] ? docId : null;
  };

  return (
    <div className='NetworkAutoAssign-con'>
      <button
        onClick={handleNetworkAutoAssign}
        className='NetworkAutoAssign-btn'
        disabled={loading}
      >
       {loading ? 'Loading...' : 'Auto-assign Networks'}
      </button>
      <ToastContainer />
    </div>
  );
};

export default NetworkAutoAssign;


