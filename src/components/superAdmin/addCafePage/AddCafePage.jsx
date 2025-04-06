import React, { useState } from 'react';
import axios from 'axios';
import './AddCafePage.css';
import Loader from '../../loader/Loader';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  
import { db } from '../../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AddCafePage = () => {
    const [inputValue, setInputValue] = useState('');
    const [cafeData, setCafeData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingAdd, setLoadingAdd] = useState(false);
    
    const notifySuccess = (message) => toast.success(message);
    const notifyError = (message) => toast.error(message);

    const handleGetInfo = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {

            if(inputValue.trim() === '') {
                setCafeData(null)
                notifyError('The URL is not valid');
                return 
            }

            const isValidMapUrl = (url) => {
                const regex = /@(-?\d+(\.\d+)?),(-?\d+(\.\d+)?),\d+z/;
                return regex.test(url);
            };

            if (!isValidMapUrl(inputValue)) {
                setCafeData(null)
                notifyError('The URL is not valid');
                return 
            }

            const response = await axios.post(
                `https://us-central1-coffee-bee.cloudfunctions.net/getCafeDataByUrl`,
                {
                    url: inputValue
                }
            );

            setCafeData(response.data);
            console.log(response.data);
        } catch (error) {
            console.log(error)
            notifyError('Error fetching cafe data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNewCoffe = async (e) => {
        e.preventDefault();
        setLoadingAdd(true);
        try {
            const cafeDocRef = doc(db, 'cafe', cafeData.place_id);
            const cafeDocSnap = await getDoc(cafeDocRef);

            if (cafeDocSnap.exists()) {
                return notifyError('This cafe already exists');
            }

            const cafe = {
                admin_data: {},
                google_info: {
                    cafeData
                },
            };

            const cafeRef = doc(db, 'cafe', cafeData.place_id);
            await setDoc(cafeRef, cafe);
            notifySuccess('Cafe added successfully');
            setCafeData(null);
            setInputValue('');
        } catch (e) {
            notifyError('Error adding cafe');
        } finally {
            setLoadingAdd(false);
        }
    };


    return (
        <div className="AddCafePage">
            <h1 className="AddCafePage-main-title">Search for a cafe and add it to the database</h1>
            <div className="AddCafePage-btn-input-con">
                <input
                    type="text"
                    placeholder="Paste link from Google Maps"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="AddCafePage-inputField"
                />
                <button onClick={handleGetInfo}  disabled={loading} className="AddCafePage-getInfoBtn">
                    {loading ? 'loading...' : 'get info'}
                </button>
            </div>

            {loading ? (
                <div className='AddCafePage-loader-con'>
                    <Loader />
                </div>
            ) : (
                <>
                    {cafeData && (
                        <div className="AddCafePage-cafeInfo">
                            <h2>Cafe Information:</h2>
                            <div className="AddCafePage-infoItem">
                                <strong>Name:</strong> {cafeData.name}
                            </div>
                            <div className="AddCafePage-infoItem">
                                <strong>Address:</strong> {cafeData.formatted_address}
                            </div>
                            <div className="AddCafePage-infoItem">
                                <strong>Coordinates:</strong>
                                <div>Latitude: {cafeData.geometry.location.lat}</div>
                                <div>Longitude: {cafeData.geometry.location.lng}</div>
                            </div>
                            <button onClick={handleAddNewCoffe} disabled={loadingAdd} className='AddCafePage-infoItem-btn-addBd'>{loadingAdd ? 'loading' : "Add coffee to the database"}</button>
                        </div>
                    )}
                </>
            )}
            <ToastContainer />
        </div>
    );
};

export default AddCafePage;
