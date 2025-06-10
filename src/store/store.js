import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';


const store = configureStore({
  reducer: {
    user: userReducer, 
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(), // додаємо redux-thunk, він уже є за замовчуванням
});

export default store;
