import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthStatus, loginUser } from '../../store/userSlice'; 
import './Login.css'


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.user);
  const { privileges } = useSelector((state) => state.user);


  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('')
    if (!email || !password) {
      setErrorMessage("Please fill in both fields.");
      return;
    }

    try {
     
      await dispatch(loginUser({ email, password })).unwrap();
      const isAdmin =  await dispatch(checkAuthStatus()).unwrap();

      if (isAdmin.privileges === true) {
        navigate('/super-admin');
      }
      if(isAdmin.privileges === 'roaster') {
        navigate('/chooseAccount');
      }
       else {
        navigate('/chooseAccount');
      }
     

    } catch (error) {
      setErrorMessage('Email or password is invalid. Please try again.')
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
                  <h2 className="fw-bold mb-2 text-uppercase">Login</h2>
                  <p className="text-white-50 mb-5">Please enter your login and password!</p>

                  <form onSubmit={handleLogin}>
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

                    <p className="small mb-5 pb-lg-2">
                      <Link className="text-white-50" to="/reset-password">Forgot password?</Link>
                    </p>

                    <button
                      className="btn btn-outline-light btn-lg px-5"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="spinner-border spinner-border-sm text-light" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </span>
                      ) : (
                        'Login'
                      )}
                    </button>
                  </form>
                </div>

                {errorMessage && <div className="error-block">{errorMessage}</div>}

                <div>
                  <p className="mb-0">
                    Don't have an account? <Link to="/sign-up" className="text-white-50 fw-bold">Sign Up</Link>
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

export default Login;
