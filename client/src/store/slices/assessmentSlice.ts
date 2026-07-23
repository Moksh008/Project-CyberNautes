import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { ingestInfrastructure, ingestGithubRepo, type InfrastructurePayload, type GithubScanSummary } from '../../api/ingest';
import { triggerAnalysis, recomputeRisk, type AnalyzeResponse, type AttackPath, type Recommendation, type OffenseAnalysis, type ReportOutput, type AgentPhase } from '../../api/analyze';

export type AssessmentStatus =
  | 'idle'
  | 'ingesting'
  | 'analyzing'
  | 'done'
  | 'error';

interface AssessmentState {
  status: AssessmentStatus;
  error: string | null;
  twinId: string | null;
  twinName: string | null;
  assets: object[];
  connections: object[];
  riskScore: number;
  riskScoreBefore: number;
  attackPaths: AttackPath[];
  offenseAnalysis: OffenseAnalysis | null;
  recommendations: Recommendation[];
  report: ReportOutput | null;
  verifiedCves: string[];
  scanSummary: GithubScanSummary | null;
  agentPhases: AgentPhase[];
}

const initialState: AssessmentState = {
  status: 'idle',
  error: null,
  twinId: null,
  twinName: null,
  assets: [],
  connections: [],
  riskScore: 0,
  riskScoreBefore: 0,
  attackPaths: [],
  offenseAnalysis: null,
  recommendations: [],
  report: null,
  verifiedCves: [],
  scanSummary: null,
  agentPhases: [],
};

export const ingestAndAnalyze = createAsyncThunk(
  'assessment/ingestAndAnalyze',
  async (payload: InfrastructurePayload, { rejectWithValue }) => {
    try {
      const { twin_id } = await ingestInfrastructure(payload);
      const analysis: AnalyzeResponse = await triggerAnalysis(twin_id);
      return { twin_id, payload, analysis };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return rejectWithValue(msg);
    }
  },
);

export const ingestGithubAndAnalyze = createAsyncThunk(
  'assessment/ingestGithubAndAnalyze',
  async (repoUrl: string, { rejectWithValue }) => {
    try {
      const { twin_id, payload, scan_summary } = await ingestGithubRepo(repoUrl);
      const analysis: AnalyzeResponse = await triggerAnalysis(twin_id);
      return { twin_id, payload, analysis, scan_summary };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return rejectWithValue(msg);
    }
  },
);

export const recomputeAfterPatch = createAsyncThunk(
  'assessment/recompute',
  async ({ twinId, excludedCves }: { twinId: string; excludedCves: string[] }, { rejectWithValue }) => {
    try {
      return await recomputeRisk(twinId, excludedCves);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return rejectWithValue(msg);
    }
  },
);

const assessmentSlice = createSlice({
  name: 'assessment',
  initialState,
  reducers: {
    reset: () => initialState,
    addVerifiedCve(state, action: PayloadAction<string>) {
      if (!state.verifiedCves.includes(action.payload)) {
        state.verifiedCves.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ingestAndAnalyze
      .addCase(ingestAndAnalyze.pending, (state) => {
        state.status = 'ingesting';
        state.error = null;
      })
      .addCase(ingestAndAnalyze.fulfilled, (state, action) => {
        const { twin_id, payload, analysis } = action.payload;
        state.status = 'done';
        state.twinId = twin_id;
        state.twinName = payload.name;
        state.assets = payload.assets;
        state.connections = payload.connections;
        state.riskScore = analysis.risk_score;
        state.riskScoreBefore = analysis.risk_score;
        state.attackPaths = analysis.attack_paths;
        state.offenseAnalysis = analysis.offense_analysis;
        state.recommendations = analysis.recommendations;
        state.report = analysis.report;
        state.verifiedCves = [];
        state.scanSummary = null;
        state.agentPhases = analysis.agent_phases ?? [];
      })
      .addCase(ingestAndAnalyze.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      })
      // ingestGithubAndAnalyze
      .addCase(ingestGithubAndAnalyze.pending, (state) => {
        state.status = 'ingesting';
        state.error = null;
      })
      .addCase(ingestGithubAndAnalyze.fulfilled, (state, action) => {
        const { twin_id, payload, analysis, scan_summary } = action.payload;
        state.status = 'done';
        state.twinId = twin_id;
        state.twinName = payload.name;
        state.assets = payload.assets;
        state.connections = payload.connections;
        state.riskScore = analysis.risk_score;
        state.riskScoreBefore = analysis.risk_score;
        state.attackPaths = analysis.attack_paths;
        state.offenseAnalysis = analysis.offense_analysis;
        state.recommendations = analysis.recommendations;
        state.report = analysis.report;
        state.verifiedCves = [];
        state.scanSummary = scan_summary;
        state.agentPhases = analysis.agent_phases ?? [];
      })
      .addCase(ingestGithubAndAnalyze.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      })
      // recomputeAfterPatch
      .addCase(recomputeAfterPatch.pending, (state) => {
        state.status = 'analyzing';
      })
      .addCase(recomputeAfterPatch.fulfilled, (state, action) => {
        state.status = 'done';
        state.riskScore = action.payload.risk_score;
        state.attackPaths = action.payload.attack_paths;
      })
      .addCase(recomputeAfterPatch.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload as string;
      });
  },
});

export const { reset, addVerifiedCve } = assessmentSlice.actions;
export default assessmentSlice.reducer;
