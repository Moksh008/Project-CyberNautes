import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { verifyCVE, type SandboxResult } from '../../api/remediation';

interface SandboxState {
  loading: boolean;
  error: string | null;
  results: Record<string, SandboxResult>;
}

const initialState: SandboxState = {
  loading: false,
  error: null,
  results: {},
};

export const runSandboxVerify = createAsyncThunk(
  'sandbox/verify',
  async ({ cve_id, twin_id }: { cve_id: string; twin_id?: string }, { rejectWithValue }) => {
    try {
      return await verifyCVE(cve_id, twin_id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return rejectWithValue(msg);
    }
  },
);

const sandboxSlice = createSlice({
  name: 'sandbox',
  initialState,
  reducers: {
    clearResults: (state) => {
      state.results = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runSandboxVerify.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(runSandboxVerify.fulfilled, (state, action) => {
        state.loading = false;
        state.results[action.payload.cve_id] = action.payload;
      })
      .addCase(runSandboxVerify.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearResults } = sandboxSlice.actions;
export default sandboxSlice.reducer;
