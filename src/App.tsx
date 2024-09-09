import FlowEditor from './components/FlowEditor'

import '@xyflow/react/dist/style.css';
import './react-flow.css';
import { GlobalConsoleProvider } from './context/GlobalConsoleContext';
import { DragAndDropProvider } from './context/DragAndDropContext';
import DesktopWarningModal from './components/DesktopWarningModal';

function App() {
  return (
    <div className="App">
      <DragAndDropProvider>
        <GlobalConsoleProvider>
          <DesktopWarningModal/>
          <FlowEditor />
        </GlobalConsoleProvider>
      </DragAndDropProvider>
    </div>
  )
}

export default App
