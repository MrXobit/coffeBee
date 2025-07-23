import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const initialState = {
  roasterData: {
    bank_details: {},
    business_info: {},
    contact: {},
    country: null,
    countryId: null,
    description: null,
    id: null,
    logo: null,
    name: null,
    shipping_available: false,
    shop: null,
    socials: {},
    website: null,
  },
  isLoading: false,
  error: null,
};


export const getRoasterData = createAsyncThunk(
    'roast/getRoasterData',
    async (_, { rejectWithValue }) => {
      try {
        const roasterId = localStorage.getItem('selectedRoasterId');
        if (!roasterId) {
          return rejectWithValue('Roaster ID is not set in localStorage');
        }
  
        const roasterRef = doc(db, 'roasters', roasterId);
        const roasterDoc = await getDoc(roasterRef);
  
        if (!roasterDoc.exists()) {
          return rejectWithValue('Roaster data not found');
        }
  
        const roasterData = roasterDoc.data();
  
        return roasterData;
      } catch (error) {
        return rejectWithValue(error.message);
      }
    }
  );

  const roasterSlice = createSlice({
    name: 'roast',
    initialState,
    reducers: {   
      setRoasterData: (state, action) => {
        state.roasterData = action.payload.roasterData;
      },
  
      clearRoasterData: (state) => {
        state.roasterData = {
          bank_details: {},
          business_info: {},
          contact: {},
          country: null,
          countryId: null,
          description: null,
          id: null,
          logo: null,
          name: null,
          shipping_available: false,
          shop: null,
          socials: {},
          website: null,
        };
        state.isLoading = false;
        state.error = null;
      },
  
      updateName: (state, action) => {
        state.roasterData.name = action.payload;
      },


      updateLogo: (state, action) => {
        state.roasterData.logo = action.payload;
      },
  
      updateDescription: (state, action) => {
        state.roasterData.description = action.payload;
      },

      updateCountry: (state, action) => {
        state.roasterData.country = action.payload;
      },
  
      updateBankDetails: (state, action) => {
        state.roasterData.bank_details = {
          ...state.roasterData.bank_details,
          ...action.payload,
        };
      },
  
      updateBusinessInfo: (state, action) => {
        state.roasterData.business_info = {
          ...state.roasterData.business_info,
          ...action.payload,
        };
      },
    },
  
    extraReducers: (builder) => {
      builder
        .addCase(getRoasterData.pending, (state) => {
          state.isLoading = true;
          state.error = null;
        })
        .addCase(getRoasterData.fulfilled, (state, action) => {
          state.roasterData = action.payload;
          state.isLoading = false;
        })
        .addCase(getRoasterData.rejected, (state, action) => {
          state.isLoading = false;
          state.error = action.payload || 'Failed to fetch roaster data';
        });
    }
  });
  
  


  export const {
    setRoasterData,
    clearRoasterData,
    updateName,
    updateDescription,
    updateBankDetails,
    updateBusinessInfo,
    updateCountry,
    updateLogo
  } = roasterSlice.actions;

export default roasterSlice.reducer;
