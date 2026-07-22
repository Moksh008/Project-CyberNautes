import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { selectRecommendations, generateCode } from '../../api/remediation';
import type { Recommendation } from '../../api/analyze';

type CodeFormat = 'bash' | 'ansible' | 'git_diff';

interface RemediationState {
  selectedIds: string[];
  selectedRecs: Recommendation[];
  format: CodeFormat;
  generatedCode: string | null;
  loading: boolean;
  error: string | null;
  selectionSaved: boolean;
}

const initialState: RemediationState = {
  selectedIds: [],
  selectedRecs: [],
  format: 'bash',
  generatedCode: null,
  loading: false,
  error: null,
  selectionSaved: false,
};

export const saveSelection = createAsyncThunk(
  'remediation/saveSelection',
  async (
    { twinId, ids, recs }: { twinId: string; ids: string[]; recs: Recommendation[] },
    { rejectWithValue },
  ) => {
    try {
      await selectRecommendations(twinId, ids);
      return { ids, recs };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return rejectWithValue(msg);
    }
  },
);

export const generateRemediationCode = createAsyncThunk(
  'remediation/generate',
  async (
    { twinId, recs, format }: { twinId: string; recs: object[]; format: CodeFormat },
    { rejectWithValue },
  ) => {
    try {
      const res = await generateCode(twinId, recs, format);
      return res.code;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return rejectWithValue(msg);
    }
  },
);

const remediationSlice = createSlice({
  name: 'remediation',
  initialState,
  reducers: {
    toggleId(state, action: PayloadAction<string>) {
      const idx = state.selectedIds.indexOf(action.payload);
      if (idx >= 0) {
        state.selectedIds.splice(idx, 1);
      } else {
        state.selectedIds.push(action.payload);
      }
      state.selectionSaved = false;
    },
    setFormat(state, action: PayloadAction<CodeFormat>) {
      state.format = action.payload;
      state.generatedCode = null;
    },
    clearCode(state) {
      state.generatedCode = null;
    },
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveSelection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveSelection.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedIds = action.payload.ids;
        state.selectedRecs = action.payload.recs;
        state.selectionSaved = true;
      })
      .addCase(saveSelection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(generateRemediationCode.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.generatedCode = null;
      })
      .addCase(generateRemediationCode.fulfilled, (state, action) => {
        state.loading = false;
        state.generatedCode = action.payload;
      })
      .addCase(generateRemediationCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { toggleId, setFormat, clearCode, reset } = remediationSlice.actions;
export default remediationSlice.reducer;
