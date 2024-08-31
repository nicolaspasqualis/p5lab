import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LogEntry } from '../types/types';

interface GlobalConsoleContextType {
  logs: LogEntry[];
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  errors: number; 
  warnings: number;
  others: number;
}

const GlobalConsoleContext = createContext<GlobalConsoleContextType | undefined>(undefined);

interface GlobalConsoleProviderProps {
  children: ReactNode;
}

export const GlobalConsoleProvider: React.FC<GlobalConsoleProviderProps> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errors, setErrors] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [others, setOthers] = useState(0);

  const addLog = useCallback((log: LogEntry) => {
    if(log.method === 'error' || log.method === 'unhandled_error') {
      setErrors((prev) => prev+1);
    } else if (log.method === 'warning') {
      setWarnings((prev) => prev+1);
    } else {
      setOthers((prev) => prev+1);
    }

    setLogs((prevLogs) => [...prevLogs, log]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setErrors(0);
    setWarnings(0);
    setOthers(0);
  }, []);

  const value = { logs, addLog, clearLogs, errors, warnings, others };

  return (
    <GlobalConsoleContext.Provider value={value}>
      {children}
    </GlobalConsoleContext.Provider>
  );
};

export const useGlobalConsole = (): GlobalConsoleContextType => {
  const context = useContext(GlobalConsoleContext);
  if (context === undefined) {
    throw new Error('useGlobalConsole must be used within a GlobalConsoleProvider');
  }
  return context;
};