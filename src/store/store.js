import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import roasterReducer from './roasterSlice';


const store = configureStore({
  reducer: {
    user: userReducer, 
    roaster: roasterReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(), // додаємо redux-thunk, він уже є за замовчуванням
});

export default store;
