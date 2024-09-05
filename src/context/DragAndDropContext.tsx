import { ReactNode, createContext, useContext, useState } from 'react';

const DradAndDropContext = createContext([null, (_: any) => { }]);

interface DragAndDropProviderProps {
  children: ReactNode;
}

export const DragAndDropProvider: React.FC<DragAndDropProviderProps> = ({ children }) => {
  const [data, setData] = useState(null);

  return (
    <DradAndDropContext.Provider value={[data, setData]}>
      {children}
    </DradAndDropContext.Provider>
  );
}

export default DradAndDropContext;

export const useDnD = () => {
  return useContext(DradAndDropContext);
}