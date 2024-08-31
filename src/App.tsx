import FlowEditor from './components/FlowEditor'

import '@xyflow/react/dist/style.css';
import './react-flow.css';
import { GlobalConsoleProvider } from './context/GlobalConsoleContext';

function App() {
  return (
    <div className="App">
      <GlobalConsoleProvider>
      <FlowEditor />
      </GlobalConsoleProvider>
    </div>
  )
}

export default App
