import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { EmailReset } from '../../store/userSlice';

const ResetPasword = () => {
      const [email, setEmail] = useState('');
      const [loading, setLoading] = useState(false);
      const [success, setSuccess] = useState(null)
      const [error, setError] = useState(null)
      const dispatch = useDispatch();

      const handleResetEmail = async(e) => {
         e.preventDefault()
         setLoading(true)
         setError(null); 
         setSuccess(null); 
         try {
          const response = await dispatch(EmailReset({ email })).unwrap();
          console.log(email)
          if (response?.status === 'success') {
            setSuccess(`A password reset email has been sent to: `);
          } 
         } catch(e) {
          console.log(e)
          setError("Something went wrong. Please try again.");
         }finally {
          setLoading(false)
         }
      }

  return (
<section className="vh-100 gradient-custom">
  <div className="container py-5 h-100">
    <div className="row d-flex justify-content-center align-items-center h-100">
      <div className="col-12 col-md-8 col-lg-6 col-xl-5">
        <div className="card bg-dark text-white" style={{ borderRadius: '1rem' }}>
          <div className="card-body p-5 text-center">
            <div className="mb-md-5 mt-md-4 pb-5">
              <h2 className="fw-bold mb-2 text-uppercase">Reset Password</h2>
              <p className="text-white-50 mb-5">
                Enter your email to receive a password reset link.
              </p>

              <form onSubmit={handleResetEmail}>
                <div className="form-outline form-white mb-4">
                  <input
                    type="email"
                    id="typeEmailX"
                    className="form-control form-control-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=" "
                    required
                  />
                  <label className="form-label" htmlFor="typeEmailX">Email</label>
                </div>

                {error && <div className="error-block">{error}</div>}
                {success && (
                  <div className="success-block">
                    {success} <strong>{email}</strong>
                  </div>
              )}

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
                    'Send Reset Link'
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

  )
}

export default ResetPasword
