import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase'; 
import { signOut } from 'firebase/auth';
import axios from 'axios';
import { db } from '../firebase'; 
import { doc, getDoc } from 'firebase/firestore';


const initialState = {
  uid: null,
  email: "",
  privileges: null,
  registrationMethod: "",
  error: null,
  isLoading: false,
  isAuth: false,
};


export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
     
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();
      localStorage.setItem('token', token);
      return { 
        uid: user.uid, 
        email: user.email
      };  
    } catch (error) {
      return rejectWithValue(error.message); 
    }
  }
);


// export const checkAuthStatus = createAsyncThunk(
//   'auth/checkAuthStatus',
//   async (_, { rejectWithValue }) => {
//     return new Promise((resolve, reject) => {
   
//       const unsubscribe = onAuthStateChanged(auth, async (user) => {
//         if (user) {
     
//           try {
//             const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/superUser'
//               , {uid: user.uid}
//             )
//             localStorage.setItem('token', response.data.token);
//             resolve({ uid: user.uid, email: user.email,
//               privileges: response.data.isSuperAdmin,
//              });
//           } catch (error) {
//             reject(rejectWithValue('Error fetching token'));
//           }
//         } else {
//           reject(rejectWithValue('User is not authenticated'));
//         }
//       });

//       return unsubscribe;
//     });
//   }
// );

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const user = await new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe(); 
          if (user) {
            resolve(user);
          } else {
            reject(new Error('User not authenticated'));
          }
        });
      });

      const token = await user.getIdToken(true);
      localStorage.setItem('token', token);
     
      const interfaceType = localStorage.getItem('interfaceType');

      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);
      console.log(user.uid)
      if (!snapshot.exists()) {
        throw new Error('User data not found in Firestore');
      }

      const userData = snapshot.data();

      return {
        uid: user.uid,
        email: user.email,
        privileges:
          userData.privileges === 'superAdmin'
            ? 'superAdmin'
            : interfaceType === 'roaster'
              ? 'roaster'
              : interfaceType === 'cafe'
                ? 'cafe'
                : null,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth); 
      localStorage.removeItem('token');
      if (localStorage.getItem('selectedCafe')) {
        localStorage.removeItem('selectedCafe');
      }
      if(localStorage.getItem('activeTab')) {
        localStorage.removeItem('activeTab');
      }
      return {}; 
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const EmailReset = createAsyncThunk (
  'auth/emailreset',
  async({email}, {rejectWithValue}) => {
    try {
      const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/resetPasswordEmail', {
        email
      })
      const resetData = {
        resetPasswordLink: response.data.resetPasswordLink,
        resetIsActivated: response.data.resetIsActivated,
        resetPasswordExpiry: response.data.resetPasswordExpiry,
        uid: response.data.uid
      };
      localStorage.setItem('resetData', JSON.stringify(resetData));
      console.log(resetData)
      return { status: 'success'};
    } catch (error) {
      return rejectWithValue(error.message); 
    }
  }
)


export const ResetFinal = createAsyncThunk (
  'auth/resetfinal',
  async({password, uid}, {rejectWithValue}) => {
    try {
      const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/resetPasswordFinal', {
        password, 
        uid
      })
      localStorage.removeItem('resetData');
      return;
    } catch (error) {
      return rejectWithValue(error.message); 
    }
  }
)


const userSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPrivileges(state, action) {
      state.privileges = action.payload;
    },

    setRegistrationMethod(state, action) {
      state.registrationMethod = action.payload;
    },

    setError(state, action) {
      state.error = action.payload;
    },

    setLoading(state, action) {
      state.isLoading = action.payload;
    },

    setIsAuth(state, action) {
      state.isAuth = action.payload;
    },

    setPrivileges(state, action) {
      const privileges = action.payload;
      if (privileges === 'superAdmin' || privileges === 'roaster' || privileges === 'cafe') {
        state.privileges = privileges;
      } else {
        state.privileges = null;
      }
    },
    


    clearUser(state) {
      state.uid = null;
      state.email = "";
      state.privileges = null;
      state.registrationMethod = "";
      state.error = null;
      state.isAuth = false;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.isAuth = true;
        state.uid = action.payload.uid;
        state.email = action.payload.email;
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
    

      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuth = true;
        state.uid = action.payload.uid;
        state.email = action.payload.email;

        state.privileges = action.payload.privileges; 
        
      })

      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuth = false;
      })

      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuth = false;
        state.uid = null;
        state.email = "";
        state.privileges = null;
        state.registrationMethod = "";
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

  },
});

export const {
  setPrivileges,
  setRegistrationMethod,
  setError,
  setLoading,
  setIsAuth,
  clearUser
} = userSlice.actions;

export default userSlice.reducer;
