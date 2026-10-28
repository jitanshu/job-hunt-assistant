import { createContext, type PropsWithChildren, useContext, useMemo, useState } from 'react';

type JobContextValue = {
  jobDescription: string;
  setJobDescription: (value: string) => void;
};

const JobContext = createContext<JobContextValue | null>(null);

export function JobProvider({ children }: PropsWithChildren) {
  const [jobDescription, setJobDescription] = useState('');
  const value = useMemo(() => ({ jobDescription, setJobDescription }), [jobDescription]);

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
}

export function useJobContext() {
  const context = useContext(JobContext);

  if (!context) {
    throw new Error('useJobContext must be used inside JobProvider');
  }

  return context;
}
