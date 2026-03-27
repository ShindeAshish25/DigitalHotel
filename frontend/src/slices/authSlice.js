import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/auth`;
axios.defaults.withCredentials = true;

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  isInitializing: true,
  error: null,
  tempToken: null,
};

export const requestOtp = createAsyncThunk('auth/requestOtp', async (userData) => {
  const response = await axios.post(`${API_URL}/request-otp`, userData);
  return response.data; // { message, tempToken }
});

export const verifyOTP = createAsyncThunk('auth/verifyOTP', async (otpData) => {
  const response = await axios.post(`${API_URL}/verify-otp`, otpData);
  return response.data;
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
    await axios.post(`${API_URL}/logout`);
});

export const loadUser = createAsyncThunk('auth/loadUser', async () => {
    const response = await axios.get(`${API_URL}/me`);
    return response.data;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.tempToken = action.payload.tempToken || null;
      })
      .addCase(requestOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
        state.tempToken = null;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(loadUser.pending, (state) => {
          state.isInitializing = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.isInitializing = false;
      })
      .addCase(loadUser.rejected, (state) => {
          state.isInitializing = false;
          state.isAuthenticated = false;
          state.user = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.tempToken = null;
      });
  },
});

export const { loginSuccess } = authSlice.actions;

export default authSlice.reducer;
