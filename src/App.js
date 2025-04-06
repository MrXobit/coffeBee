import React, { useEffect } from 'react';
import './App.css';
import Router from './components/Router';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthStatus } from './store/userSlice';
import AdminRouter from './components/AdminRouter';



const App = () => {
  const dispatch = useDispatch();
  const { privileges, isAuth } = useSelector((state) => state.user);

  console.log('privileges' + privileges)
  useEffect(() => {
    dispatch(checkAuthStatus())
  }, [dispatch]);

  return (
    <div>
      {isAuth && privileges === 'superAdmin' ? (
        <AdminRouter /> 
      ) : (
        <>
         <Router/>
        </>
      )}
    </div>
  );  
}

export default App;
