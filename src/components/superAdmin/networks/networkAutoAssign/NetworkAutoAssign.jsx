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
    const netNames = await getNetworkNames();
    console.log('📌 Мережі в системі:', netNames);

    const cafeCollectionRef = collection(db, 'cafe');
    const querySnapshot = await getDocs(cafeCollectionRef);

    const initialCafeList = [];
    for (const docSnap of querySnapshot.docs) {
      const cafeData = docSnap.data();

      // Пропускаємо, якщо вже є мережа
      if (cafeData.network?.name) continue;

      if (!cafeData.name) {
        console.warn(`⚠️ У кафе без place_id=${cafeData.place_id} немає назви`, cafeData);
        continue;
      }

      initialCafeList.push({
        id: cafeData.place_id,
        cafeName: cafeData.name
      });
    }

    console.log('📌 Кафе без мережі:', initialCafeList);

    const clearArray = [];

    // ---- Перевірка на існуючі мережі ----
    for (let i = 0; i < initialCafeList.length; i++) {
      const cafe = initialCafeList[i];

      if (!cafe.cafeName) {
        console.warn(`⚠️ Пропущено кафе без назви:`, cafe);
        continue;
      }

      console.log(`👉 Обробка кафе:`, cafe);

      const parts = cafe.cafeName.split(' -');
      const baseName = parts[0].trim();
      const docId = baseName.replace(/\//g, '-');
      const fullName = findFullMatch(docId, netNames);

      if (fullName) {
        console.log(`✅ Знайдено повний матч для: ${cafe.cafeName} -> ${fullName}`);

        const cafeRef = doc(db, 'cafe', cafe.id);
        await updateDoc(cafeRef, {
          network: {
            isCreator: false,
            name: fullName
          }
        });

        const netRef = doc(db, 'coffeeChain', fullName.replace(/\//g, '-'));
        await updateDoc(netRef, {
          cafeIds: arrayUnion(cafe.id),
        });

        clearArray.push(cafe.id);
      }
    }

    // ---- Групування по назвах ----
    const cafeArray = initialCafeList.filter(cafe => !clearArray.includes(cafe.id));
    const networkMap = {};

    for (const cafe of cafeArray) {
      if (!cafe.cafeName) {
        console.warn(`⚠️ Пропущено кафе без назви при групуванні:`, cafe);
        continue;
      }

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

    const result = Object.values(networkMap).filter(group => group.cafeIds.length > 1);
    console.log('📌 Групи для створення мереж:', result);

    // ---- Створення нових мереж ----
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
        console.log(`🆕 Створено нову мережу: ${item.networkName}`);
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

    loadData();

  } catch (e) {
    console.error('❌ Помилка при автоприсвоєнні мереж:', e);
    notifyError('Помилка при автоприсвоєнні мереж');
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
       {loading ? 'Loading...' : 'Auto-assign Chains'}
      </button>
      <ToastContainer />
    </div>
  );
};

export default NetworkAutoAssign;


