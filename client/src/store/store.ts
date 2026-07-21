import { configureStore } from '@reduxjs/toolkit';

const dummyReducer = (state = { initialized: true }) => {
  return state;
};

export const store = configureStore({
  reducer: {
    app: dummyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
