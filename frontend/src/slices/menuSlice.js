import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/menu`;

export const fetchMenu = createAsyncThunk('menu/fetchAll', async () => {
    const [menuRes, catRes] = await Promise.all([
        axios.get(`${API_URL}`, { withCredentials: true }),
        axios.get(`${API_URL}/categories`, { withCredentials: true }),
    ]);
    return { dishes: menuRes.data, categories: catRes.data };
});

export const fetchPublicMenu = createAsyncThunk('menu/fetchPublic', async (adminId) => {
    const res = await axios.get(`${API_URL}/public/${adminId}`);
    return { dishes: res.data.menu || [], categories: res.data.categories || [] };
});

const menuSlice = createSlice({
    name: 'menu',
    initialState: { dishes: [], categories: [], loading: false, error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMenu.pending, (state) => { state.loading = true; })
            .addCase(fetchMenu.fulfilled, (state, action) => {
                state.loading = false;
                state.dishes = action.payload.dishes || [];
                state.categories = action.payload.categories || [];
            })
            .addCase(fetchPublicMenu.pending, (state) => { state.loading = true; })
            .addCase(fetchPublicMenu.fulfilled, (state, action) => {
                state.loading = false;
                state.dishes = action.payload.dishes || [];
                state.categories = action.payload.categories || [];
            })
            .addCase(fetchMenu.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    }
});

export default menuSlice.reducer;
