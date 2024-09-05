import FlowEditor from './components/FlowEditor'

import '@xyflow/react/dist/style.css';
import './react-flow.css';
import { GlobalConsoleProvider } from './context/GlobalConsoleContext';
import { DragAndDropProvider } from './context/DragAndDropContext';

function App() {
  return (
    <div className="App">
      <DragAndDropProvider>
      <GlobalConsoleProvider>
      <FlowEditor />
      </GlobalConsoleProvider>
      </DragAndDropProvider>
    </div>
  )
}

export default App
