import React, { useState } from 'react';
import './Signup.css';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase'; // Оновлений шлях до firebase-config
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { loginUser } from '../../store/userSlice';
import { useDispatch } from 'react-redux';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Локальний стан завантаження
  const navigate = useNavigate();
  const dispatch = useDispatch();


  const handleSignup = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in both fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);

      if (signInMethods.length > 0) {
        setError('A user with this email already exists. Please try another email.');
        return;
      }

    
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

     
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        privileges: 'admin',
        resetPasswordLink: null,
        resetIsActivated: false,
        resetPasswordExpiry: null,
        registrationMethod: 'email',
      });

       await dispatch(loginUser({ email, password })).unwrap();
     
        
           navigate('/chooseAccount');

    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('A user with this email already exists. Please try another email.');
      }
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
                  <h2 className="fw-bold mb-2 text-uppercase">Sign Up</h2>
                  <p className="text-white-50 mb-5">Please enter your email and password to create an account!</p>

                  <form onSubmit={handleSignup}>
                    <div className="form-outline form-white mb-4">
                      <input
                        type="email"
                        id="typeEmailX"
                        className="form-control form-control-lg"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder=" "
                      />
                      <label className="form-label" htmlFor="typeEmailX">Email</label>
                    </div>

                    <div className="form-outline form-white mb-4">
                      <input
                        type="password"
                        id="typePasswordX"
                        className="form-control form-control-lg"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder=" "
                      />
                      <label className="form-label" htmlFor="typePasswordX">Password</label>
                    </div>

                    {error && <div className="error-block">{error}</div>}

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
                        'Sign Up'
                      )}
                    </button>
                  </form>
                </div>

                <div>
                  <p className="mb-0">
                    Already have an account? <Link to="/login" className="text-white-50 fw-bold">Log In</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signup;
