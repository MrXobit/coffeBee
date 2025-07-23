import React, { useState } from 'react'
import './RoasteryDetails.css';
import { useLocation, useParams } from 'react-router-dom';
import { AiFillFacebook, AiFillInstagram, AiFillLinkedin } from 'react-icons/ai';
import { SiTiktok, SiReddit } from 'react-icons/si';
import { FaWhatsapp, FaYoutube, FaSnapchat } from 'react-icons/fa';
import { BsDiscord } from 'react-icons/bs';
import { FaTelegram } from "react-icons/fa";
import { RiWechatFill } from 'react-icons/ri';
import { db} from '../../../firebase'; 
import { arrayRemove, collection, doc, getDoc, getDocs, query, updateDoc, where} from 'firebase/firestore';
import Loader from '../../loader/Loader';
import noImage from '../../../assets/noImage.jpeg'

const RoasteryDetails = () => {
      const {id} = useParams()
      const [beans, setBeans] = useState([])
      const [loading, setLoading] = useState(false)
      const location = useLocation();
      const [cafeRoaster, setCafeRoaster] = useState([])
      const [isEmpty, setIsEmpty] = useState(true)
      const [loadingBeans, setLoadingBeans] = useState({});
      const roaster = location.state?.roaster;
      const [beansImages, setBeansImages] = useState({});


      const popularSocials = {
        'facebook': <AiFillFacebook size={24}/>,
        'instagram': <AiFillInstagram size={24}/>,
        'linkedin': <AiFillLinkedin size={24}/>,
        'tiktok': <SiTiktok  size={24}/>,
        'reddit': <SiReddit size={24}/>,
        'whatsapp': <FaWhatsapp size={24}/>,
        'youtube': <FaYoutube size={24}/>,
        'snapchat': <FaSnapchat size={24}/>,
        'discord': <BsDiscord size={24}/>,
        'telegram': <FaTelegram size={24}/>,
        'wechat': <RiWechatFill size={24}/>
      };

      const getBeans = async() => {
        setLoading(true)
        try {
          const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
          const beanDataArray = [];

          const productsRef = collection(db, 'roasters', roaster.id, 'products'); 
          const snapshot = await getDocs(productsRef);
          const result = {};

          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.beansId && data.pack_image_url) {
              result[data.beansId] = data.pack_image_url;
            }
          });
  
          setBeansImages(result);
      
          console.log('resultttttttt', result)
          const beansQuery = query(
            collection(db, 'beans'),
            where('roaster', '==', roaster.id)
          )

          const querySnapshot = await getDocs(beansQuery)
          querySnapshot.forEach((doc) => {
            beanDataArray.push({ id: doc.id, ...doc.data() });
          })

           if(!selectedCafe.roasterBeans) {
            setIsEmpty(false)
           } else {
            if (Array.isArray(selectedCafe.roasterBeans)) {
              const found = selectedCafe.roasterBeans.flatMap(bean => bean.id);
              setCafeRoaster(found);
              console.log('cafeRoasterssss', found);
          } else {
              setCafeRoaster([]); 
              console.log('roasterBeans не є масивом, або його немає');
          }
          
           }
           
           console.log(beanDataArray)
           setBeans(beanDataArray)
        } catch(e) {
           console.log(e)
        } finally {
          setLoading(false)
        }
      }
      
      useState(() => {
        getBeans()
      }, [id])

      const getIcon = (platform) => {
        return popularSocials[platform.toLowerCase()] || null;
      }



    const handleAddBean = async(beanId) => {
      setLoadingBeans((prev) => ({ ...prev, [beanId]: true }));
      try {
        const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
        const cafeRef = doc(db, 'cafe', selectedCafe.id);
        const cafeDoc = await getDoc(cafeRef);
    
        if (cafeDoc.exists()) {
          const cafeData = cafeDoc.data();
    
          let updatedBeans = [...(cafeData.roasterBeans || [])];
    
          const roasterIndex = updatedBeans.findIndex((bean) => bean.roaster === roaster.id);
    
          if (roasterIndex !== -1) {
            updatedBeans[roasterIndex].id = [...new Set([...updatedBeans[roasterIndex].id, beanId])];
          } else {
     
            updatedBeans.push({
              id: [beanId],
              roaster: roaster.id,
            });
          }
    
           
          await updateDoc(cafeRef, { roasterBeans: updatedBeans });
    
          setCafeRoaster((prev) => [...prev, beanId]);


              const cafeReff = doc(db, 'cafe', selectedCafe.id); 
              const cafeSnap = await getDoc(cafeReff);    
        
              if (cafeSnap.exists()) {
                  const updatedCafeData = { id: selectedCafe.id, ...cafeSnap.data() }; 
                  localStorage.setItem('selectedCafe', JSON.stringify(updatedCafeData));
                  console.log(updatedCafeData)
              } 
          }
      } catch(e) {
          console.error("Error adding bean to cafe:", e);
      }finally {
        setLoadingBeans((prev) => ({ ...prev, [beanId]: false }));
      }
  }





    const handleDelete = async (beanId) => {
      setLoadingBeans((prev) => ({ ...prev, [beanId]: true }));
      try {
        const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
        const cafeRef = doc(db, 'cafe', selectedCafe.id);
        const cafeDoc = await getDoc(cafeRef);
        const roasterRef = doc(db, 'roasters', roaster.id);
        const roasterGet = await getDoc(roasterRef);
    
        if (cafeDoc.exists() && roasterGet.exists()) {
          const cafeData = cafeDoc.data();
          const roasterData = roasterGet.data();
    
     
          let updatedBeans = cafeData.roasterBeans.map((bean) => {
            if (bean.roaster === roaster.id) {
              return {
                ...bean,
                id: bean.id.filter((id) => id !== beanId), 
              };
            }
            return bean;
          });
    
          const remainingBeansFromRoaster = updatedBeans.filter(
            (bean) => bean.roaster === roaster.id && bean.id.length > 0
          );
    
          if (remainingBeansFromRoaster.length === 0) {
            updatedBeans = updatedBeans.filter((bean) => bean.roaster !== roaster.id);
          }
    
          await updateDoc(cafeRef, {
            roasterBeans: updatedBeans,
          });
          await updateDoc(cafeRef, {
            disabledBeans: arrayRemove(beanId)
          })
    
          setCafeRoaster(cafeRoaster.filter(id => id !== beanId));
          const cafeSnap = await getDoc(cafeRef);
    
          if (cafeSnap.exists()) {
            const updatedCafeData = { id: selectedCafe.id, ...cafeSnap.data() };
            localStorage.setItem('selectedCafe', JSON.stringify(updatedCafeData));
            console.log(updatedCafeData);
          }
        }
      } catch (e) {
        console.error('Error removing bean:', e);
      } finally {
        setLoadingBeans((prev) => ({ ...prev, [beanId]: false }));
      }
    };
    
    

    

  return (
    <div className='roasterDetails-main-con'>
          <div className="con-for-roaster-and-foter">
          
    <div className='roaster-block-main-info'>
         <img src={roaster.logo} alt="roaster logo" className="roaster-detail-img" />
        <div className='roasterDetail-name'>{roaster.name}</div>
        <div className='roasterDetail-description'>{roaster.description}</div>
        <div className='roasterDetail-countryId'>Country ID: {roaster.countryId}</div>
        <div className='roasterDetail-website'><a href={roaster.website} target='_blank' rel='noopener noreferrer'>Website</a></div>
        <div className='roasterDetail-shop'><a href={roaster.shop} target='_blank' rel='noopener noreferrer'>Shop</a></div>
    </div>


    <div className='roaster-block-shipping'>
        <div className='roasterDetail-shipping-available'>Shipping Available: {roaster.shipping_available ? 'Yes' : 'No'}</div>
    </div>

    <div className="roaster-detail-coffe-beans">
        <div className="roasterdetail-bean-main-title">
        Coffee Beans by Our Roaster
        </div>
        {loading ? (
          <div className="roasterDetail-loader-con">
             <Loader/>
          </div>
        ) : (
          <div className="roasterDeatail-main-con-for-cards">
          {beans?.length > 0 ? (
          beans.map((bean) => (
            <div key={bean.id} className='roasterDetail-main-main-card-block'>
              <img src={beansImages[bean.id]|| noImage} alt={bean.name} className="roasterDetail-image-card" />
              <div className="roasterDetail-main-con-for-cards">
                <div className="roasterDetail-details-card">
                  <h2 className="roasterDetail-name-card">{bean.name}</h2>
                  <p className="roasterDetail-country-card">Country: {bean.country}</p>
                  <p className="roasterDetail-altitude-card">Altitude: {bean.altitude} meters</p>
                  <p className="roasterDetail-sca-score-card">SCA Score: {bean.scaScore}</p>
                  <p className="roasterDetail-flavours-card">Flavours by Roaster: {bean.flavoursByRoaster}</p>
                  <p className="roasterDetail-process-card">Process: {bean.process}</p>
                  <p className="roasterDetail-variety-card">Variety: {bean.variety}</p>
                  <p className="roasterDetail-harvest-year-card">Harvest Year: {bean.harvestYear}</p>
                  <p className="roasterDetail-producer-card">Producer: {bean.producer}</p>
                  {cafeRoaster.includes(bean.id) ? (
  <button 
    onClick={() => handleDelete(bean.id)} 
    className='roaster-detail-btn-remove'
    disabled={loadingBeans[bean.id]}
  >
    {loadingBeans[bean.id] ? "Loading..." : "Remove this coffee bean from your café's menu"}
  </button>
) : (
  <button 
    onClick={() => handleAddBean(bean.id)} 
    className='roaster-detail-btn-add'
    disabled={loadingBeans[bean.id]}
  >
    {loadingBeans[bean.id] ? "Loading..." : "Add this coffee bean to your café's menu"}
  </button>
)}

                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="roaster-detail-no-beans-message">No coffee beans available at the moment</p>
        )}
  </div>
        )}

    
        </div>
        </div>
      <div className="roaster-detail-foter-con">
      <div className='roaster-block-socials'>
        <h3>Socials</h3>
        {Object.entries(roaster.socials).map(([platform, link]) => (
    <div key={platform} className='roasterDetail-icon'>
          {getIcon(platform)}
        <a href={link} target='_blank' rel='noopener noreferrer'>{platform}</a>
    </div>
))}

    </div>

    <div className='roaster-block-contact'>
        <h3>Contact</h3>
        <div className='roasterDetail-email'>Email: {roaster.contact.email}</div>
        <div className='roasterDetail-phone'>Phone: {roaster.contact.phone}</div>
    </div>
      </div>
    

</div>
  )
}

export default RoasteryDetails
