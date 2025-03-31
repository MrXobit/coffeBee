import React, { useEffect, useState } from 'react';
import { db } from '../../firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import SubLoader from '../loader/SubLoader';
import { ResetFinal } from '../../store/userSlice';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const [load, setLoad] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const storedData = JSON.parse(localStorage.getItem('resetData'));
  console.log("stored Data: ", storedData);

  const fetchData = async () => {
    try {
      setLoad(true);
      
      if (!storedData || !storedData.uid) {
        navigate('/reset-password');
        return;
      }

      const userRef = doc(db, 'users', storedData.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        navigate('/reset-password');
        return;
      }

      const userData = userSnap.data();

      if (userData.resetIsActivated !== true) {
        navigate('/reset-password');
        return;
      }

    } catch (e) {
      console.log("Error fetching data:", e);
    } finally {
      setLoad(false);
    }
  };

  useEffect(() => {
    if (!storedData) {
      navigate('/reset-password');
      return;
    }

    fetchData();
  }, []);

  if (load) {
    return <SubLoader />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await dispatch(ResetFinal({ password, uid: storedData.uid })).unwrap();
      navigate('/login')
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="vh-100 gradient-custom">
      <div className="container py-5 h-100">
        <div className="row d-flex justify-content-center align-items-center h-100">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div className="card bg-dark text-white" style={{ borderRadius: '1rem' }}>
              <div className="card-body p-5 text-center">
                <div className="mb-md-5 mt-md-4 pb-5">
                  <h2 className="fw-bold mb-2 text-uppercase">Set Your New Password</h2>
                  <p className="text-white-50 mb-5">Please enter your new password to complete the process.</p>

                  <form onSubmit={handleSubmit}>
                    <div className="form-outline form-white mb-4">
                      <input
                        type="password"
                        id="newPassword"
                        className="form-control form-control-lg"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder=" "
                      />
                      <label className="form-label" htmlFor="newPassword">New Password</label>
                    </div>

                    <div className="form-outline form-white mb-4">
                      <input
                        type="password"
                        id="confirmPassword"
                        className="form-control form-control-lg"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder=" "
                      />
                      <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                    </div>

                    <button
                      className="btn btn-outline-light btn-lg px-5"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="spinner-border spinner-border-sm text-light" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </span>
                      ) : (
                        'Set New Password'
                      )}
                    </button>
                  </form>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UpdatePassword;
