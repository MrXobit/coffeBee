import React, { useEffect } from 'react';
import './App.css';
import Router from './components/Router';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthStatus } from './store/userSlice';
import AdminRouter from './components/AdminRouter';
import { ToastContainer } from 'react-toastify';
import RoasterRouter from './components/RoasterRouter';
import MainPage from './components/roasterDashboard/roasterMainPage/MainPage';
import { getRoasterData } from './store/roasterSlice';


const App = () => {
  const dispatch = useDispatch();
  const { privileges, isAuth } = useSelector((state) => state.user);


  useEffect(() => {
    dispatch(checkAuthStatus())
  }, [dispatch]);

  useEffect(() => {
    if (isAuth && privileges === 'roaster') {
      dispatch(getRoasterData());
    }
  }, [isAuth, privileges, dispatch]);

  return (
    <div>
{isAuth && privileges === 'superAdmin' ? (
  <AdminRouter />
) : isAuth && privileges === 'roaster' ? (
  <RoasterRouter />
) : (
  <Router />
)}
    
      <ToastContainer />
    </div>
  );  
}

export default App;
