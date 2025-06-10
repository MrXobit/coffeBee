import React from 'react'
import { useSelector } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom'; 
import { authRoutes, publicRoutes } from '../routes';
import SubLoader from './loader/SubLoader';
import MainPage from './superAdmin/mainPage/MainPage';
import AddNewRoaster from './superAdmin/roasters/addNewRoaster/AddNewRoaster';
import EditRoaster from './superAdmin/roasters/editRoaster/EditRoaster';
import CafeInfoAdmin from './superAdmin/cafes/сafeInfo/CafeInfoAdmin';
import AddBeans from './beans/AddBeans';
import CafeInfo from './cafeInfo/CafeInfo';
import NetworkDetails from './superAdmin/networks/networkDetails/NetworkDetails';
import AddNet from './superAdmin/networks/addNet/AddNet';


const AdminRouter = () => {
    const { isAuth, isLoading, privileges} = useSelector((state) => state.user);


    if (isLoading) {
      return <SubLoader />;
    }
  
    return (
        <div>
          <Routes>
            {isAuth && privileges === 'superAdmin' && (
              <>
                <Route path="/super-admin" element={<MainPage />} />
                <Route path="*" element={<MainPage />} />
                <Route path="/add-new-roaster" element={<AddNewRoaster />} />
                <Route path="/edit-roaster" element={<EditRoaster />} />
                <Route path="/cafe-info/:id" element={<CafeInfoAdmin/>} />
                <Route path="/add-coffee-bean" element={<AddBeans/>} />
                <Route path="/edit-coffeeInfo" element={<CafeInfo/>} />
                <Route path="/network-info/:id" element={<NetworkDetails/>} />
                <Route path="/add-network" element={<AddNet/>} />
              </>
            )}
          </Routes>
        </div>
      );
    }      

export default AdminRouter

