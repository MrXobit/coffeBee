import React, { useEffect, useState } from 'react';
import { db } from '../../firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import SubLoader from '../loader/SubLoader';
import { ResetFinal } from '../../store/userSlice';

const UpdatePassword = () => {
  const { uid } = useParams();  // читаємо uid з URL
  console.log('useParams uid:', uid);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const [load, setLoad] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const fetchData = async () => {
    try {
      console.log('fetchData started');
      setLoad(true);

      if (!uid) {
        console.log('No uid found, redirecting');
        navigate('/reset-password');
        return;
      }

      console.log('Fetching user document from Firestore for uid:', uid);
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log('User doc does not exist in Firestore, redirecting');
        navigate('/reset-password');
        return;
      }

      const userData = userSnap.data();
      console.log('User data fetched:', userData);

      if (userData.resetIsActivated !== true) {
        console.log('resetIsActivated !== true, redirecting');
        navigate('/reset-password');
        return;
      }

      console.log('User passed all checks');

    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoad(false);
      console.log('fetchData finished, load set to false');
    }
  };

  useEffect(() => {
    console.log('useEffect called');
    if (!uid) {
      console.log('No uid in useEffect, redirecting');
      navigate('/reset-password');
      return;
    }
    fetchData();
  }, [uid, navigate]);

  if (load) {
    console.log('Loading... showing loader');
    return <SubLoader />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit called');

    if (password !== confirmPassword) {
      console.log('Passwords do not match');
      alert('Passwords do not match.');
      return;
    }

    if (!uid) {
      console.log('No uid during submit, redirecting');
      alert('User ID not found, please request password reset again.');
      navigate('/reset-password');
      return;
    }

    setLoading(true);
    try {
      console.log('Dispatching ResetFinal with:', { password, uid });
      await dispatch(ResetFinal({ password, uid })).unwrap();
      console.log('Password reset successful, navigating to login');
      navigate('/login');
    } catch (e) {
      console.error('Error during password reset dispatch:', e);
    } finally {
      setLoading(false);
      console.log('handleSubmit finished, loading set to false');
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
                        onChange={(e) => {
                          console.log('New password input changed:', e.target.value);
                          setPassword(e.target.value);
                        }}
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
                        onChange={(e) => {
                          console.log('Confirm password input changed:', e.target.value);
                          setConfirmPassword(e.target.value);
                        }}
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
