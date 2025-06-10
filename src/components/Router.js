import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom'; 
import { authRoutes, publicRoutes } from '../routes';
import SubLoader from './loader/SubLoader';


const Router = () => {
  const { isAuth, isLoading } = useSelector((state) => state.user);

 
  if (isLoading) {
    return <SubLoader />;
  }

 
  return (
    <Routes>
     
      {isAuth ? (
        <>
          {authRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </>
      ) : (
        
        <>
          {publicRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </>
      )}
    </Routes>
  );
};

export default Router;
