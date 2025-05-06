import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { db } from '../../firebase'; // підключення до Firestore
import { doc, getDoc } from 'firebase/firestore';
import './ChooseAccount.css';
import Loader from '../loader/Loader';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../store/userSlice';

const ChooseAccount = () => {
    const { email } = useSelector((state) => state.user);
    const [cafes, setCafes] = useState([]);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (!email) {
            return;
        }

        const fetchCafes = async () => {
            try {
                setLoading(true);
                const accessRef = doc(db, 'accessAdmin', email);
                const accessSnap = await getDoc(accessRef);

                if (!accessSnap.exists()) {
                    return;
                }

                const accessData = accessSnap.data();
                const allowedCafeIds = accessData.allowedCafeIds || [];

                if (allowedCafeIds.length === 0) {
                    return;
                }

                const cafePromises = allowedCafeIds.map(async (cafeId) => {
                    const cafeRef = doc(db, 'cafe', cafeId);
                    const cafeSnap = await getDoc(cafeRef);
                    return cafeSnap.exists() ? { id: cafeId, ...cafeSnap.data() } : null;
                });

                const cafesData = (await Promise.all(cafePromises)).filter(Boolean);
                setCafes(cafesData);
            } catch (error) {
                console.error('Error fetching cafes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCafes();
    }, [email]);

    const handleChangeCofe = (cafe) => {
        localStorage.setItem('selectedCafe', JSON.stringify(cafe));
        console.log(cafe)
        if(localStorage.getItem('activeTab')) {
            localStorage.removeItem('activeTab');
          }
        navigate('/admin');
    };

    return (
        <div className='main-container-chooseAcc'>
            <h2 className="choose-account-title">Choose an Account</h2>
            {loading ? (
                <Loader />
            ) : cafes.length === 0 ? ( 
                <div className='noAccses-acount'>
                <p className='noAccses-acount-main-text'>You do not have access to any cafes. To gain access, please contact us at: </p>
                <p className='noAccses-acount-main-number'>Phone: +1 (555) 123-4567</p>
                <p className='noAccses-acount-main-tg'>Telegram: @fakeusername</p>
                <button className="logout-button" onClick={() => dispatch(logoutUser())}>Logout</button>
              </div>
            ) : (
                <div className="acc-main-choose-con">
                    {cafes.map((cafe) => (
                        <div key={cafe.place_id} onClick={() => handleChangeCofe(cafe)} className="account-card">
                            <img src={cafe.icon} alt="logo" className="account-logo" />
                            <p className="account-text">{cafe.name}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChooseAccount;
