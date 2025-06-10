import React, { useEffect, useRef, useState } from 'react';
import './WorkingHours.css';
import SubLoader from '../../loader/SubLoader';
import axios from 'axios';
import { db } from '../../../firebase'; 
import { doc, getDoc } from 'firebase/firestore';

const WorkingHours = ({cafeData}) => {
    const openRefs = useRef({});
    const closeRefs = useRef({});
    const [data, setData] = useState(null);
    const [workingHours, setWorkingHours] = useState({
        monday: { open: '', close: '', closed: false },
        tuesday: { open: '', close: '', closed: false },
        wednesday: { open: '', close: '', closed: false },
        thursday: { open: '', close: '', closed: false },
        friday: { open: '', close: '', closed: false },
        saturday: { open: '', close: '', closed: false },
        sunday: { open: '', close: '', closed: false }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(''); 

    useEffect(() => {

        if(cafeData) {
            setData(cafeData);
          
            if (cafeData.adminData && cafeData.adminData.workingHours) {
                const formattedWorkingHours = {};

                for (const day in cafeData.adminData.workingHours) {
                    if (cafeData.adminData.workingHours[day] === 'closed') {
                        formattedWorkingHours[day] = { open: '', close: '', closed: true };
                    } else {
                        const { open, close } = cafeData.adminData.workingHours[day];
                        formattedWorkingHours[day] = { open, close, closed: false };
                    }
                }

                setWorkingHours(formattedWorkingHours);
        }

        }
    }, []);

    const focusInput = (day, type) => {
        if (type === 'open') {
            openRefs.current[day]?.showPicker();
        } else {
            closeRefs.current[day]?.showPicker();
        }
    };

    const toggleClosed = (day) => {
        setWorkingHours(prev => {
            const updatedDay = {
                ...prev[day],
                closed: !prev[day].closed,
                open: !prev[day].closed ? '' : prev[day].open, 
                close: !prev[day].closed ? '' : prev[day].close 
            };
            return { ...prev, [day]: updatedDay };
        });
    };

    const handleTimeChange = (day, type, value) => {
        setWorkingHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [type]: value }
        }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError('');

            for (const day in workingHours) {
                const { open, close, closed } = workingHours[day];
                if (!closed && (!open || !close)) {
                    throw new Error(`Please fill in both "Open" and "Close" fields for ${day}`);
                }
            }

            const formattedWorkingHours = Object.keys(workingHours).reduce((acc, day) => {
                const { open, close, closed } = workingHours[day];
                if (closed) {
                    acc[day] = 'closed';
                } else {
                    acc[day] = { open, close };
                }
                return acc;
            }, {});

            const token = localStorage.getItem('token');

            if (!token) {
                console.log('Token not found. Please log in.');
                return;
            }

            const response = await axios.post(
                'https://us-central1-coffee-bee.cloudfunctions.net/updateWorkingHours',
                {
                    cafeId: data.id, 
                    workingHours: formattedWorkingHours
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`, 
                        'Content-Type': 'application/json'
                    }
                }
            );

            const cafeRef = doc(db, 'cafe', data.id); 
            const cafeSnap = await getDoc(cafeRef);    

            if (cafeSnap.exists()) {
                const updatedCafeData = { id: data.id, ...cafeSnap.data() }; 
                setData(updatedCafeData);
                setWorkingHours(updatedCafeData.adminData.workingHours);
                localStorage.setItem('selectedCafe', JSON.stringify(updatedCafeData));
            }  

            if (response.status === 200) {
                console.log('Working hours successfully updated:', response.data);
            } else {
                console.log('Something went wrong:', response.data);
            }

        } catch (e) {
            setError(e.message); // Set error message
            console.log('Error during request:', e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!data) {
        return <SubLoader />;
    }

    return (
        <div className="working-hours-container">
            <h2>Editing Working Hours</h2>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                <div className="day-row" key={day}>
                    <label>{day.charAt(0).toUpperCase() + day.slice(1)}:</label>
                    {workingHours[day].closed ? (
                        <span>Closed</span>
                    ) : (
                        <>
                            <div className="time-input" onClick={() => focusInput(day, 'open')}>
                                <input 
                                    type="time" 
                                    ref={el => openRefs.current[day] = el}
                                    value={workingHours[day].open}
                                    onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                                />
                            </div>
                            <div className="time-input" onClick={() => focusInput(day, 'close')}>
                                <input 
                                    type="time" 
                                    ref={el => closeRefs.current[day] = el}
                                    value={workingHours[day].close}
                                    onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                                />
                            </div>
                        </>
                    )}
                    <button className='or-open-day-or-not' onClick={() => toggleClosed(day)}>
                        {workingHours[day].closed ? 'Open' : 'Closed'}
                    </button>
                </div>
            ))}
            {error && <div className="error-message">{error}</div>} {/* Error message display */}
            <button 
                className="save-button" 
                onClick={handleSubmit} 
                disabled={loading}
            >
                {loading ? 'Loading...' : 'Save'}
            </button>
        </div>
    );
};

export default WorkingHours;
