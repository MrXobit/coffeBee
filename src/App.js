import React, { useEffect } from 'react';
import './App.css';
import Router from './components/Router';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthStatus } from './store/userSlice';



const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuthStatus())
  }, [dispatch]);

  return (
    <div>
      <Router /> 
    </div>
  );  
}

export default App;
