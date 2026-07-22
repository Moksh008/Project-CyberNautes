import { configureStore } from '@reduxjs/toolkit';
import assessmentReducer from './slices/assessmentSlice';
import sandboxReducer from './slices/sandboxSlice';
import remediationReducer from './slices/remediationSlice';

export const store = configureStore({
  reducer: {
    assessment: assessmentReducer,
    sandbox: sandboxReducer,
    remediation: remediationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
