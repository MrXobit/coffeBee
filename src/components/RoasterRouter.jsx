import React from 'react';
import { useSelector } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import SubLoader from './loader/SubLoader';
import MainPage from './roasterDashboard/roasterMainPage/MainPage';
import ChooseAccount from './сhooseAccount/ChooseAccount';
import ProductDetails from './roasterDashboard/Products/ProductDetails/ProductDetails';

const RoasterRouter = () => {
  const { isAuth, isLoading, privileges } = useSelector((state) => state.user);

  if (isLoading) {
    return <SubLoader />;
  }

  return (
    <div>
      <Routes>
        {isAuth && privileges === 'roaster' ? (
        <> <Route path="/" element={<MainPage />} />
        <Route path="/roaster-dashboard" element={<MainPage />} />
        <Route path="/chooseAccount" element={<ChooseAccount />} />
        <Route path="/product/:id" element={<ProductDetails />} />

      </>
        ) : (
            <Route path="*" element={<MainPage/>} />
        )}
      </Routes>
    </div>
  );
};

export default RoasterRouter;
