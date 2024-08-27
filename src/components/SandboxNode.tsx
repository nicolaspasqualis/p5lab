import React, { useEffect, useRef } from 'react';
import { Handle, Position, NodeResizer, useHandleConnections, useNodesData, useReactFlow } from '@xyflow/react';
import { Button } from './Button';
import { ControlUpdateMessage, Controller } from '../types/types';
import { Toggle } from './controls/Toggle';

export interface SandboxNodeProps {
  data: { 
    id: string;
    onControlUpdate: (key: string, value: number) => void;
    onAddController: (sandboxId: string, controller: Controller) => void;
  };
}

declare global {
  interface Window {
    _sandbox_internals: {
      id: string;
      runId: string;
      controller: Controller;
    }
    control: () => void;
  }
}

const MessageType = {
  CONSOLE_LOG: "console-log",
  CODE_EXECUTED: "code-executed",
  CONTROLLER_REGISTRATION: "controller-registration",
  CONTROLLER_UPDATE: "controller-update"
}

// This needs to be a function without external dependencies 
// besides the window context in which it will be run.
// It expects the window object to be extended with the 
// necessary dependencies as declared in ~global~.
// This function is injected into the iframe sandbox by converting it
// to string (controls.toString()) and then evaluated as a <script/>
function controls(controller: Controller){
  const InternalMessageType: typeof MessageType = {
    CONSOLE_LOG: "console-log",
    CODE_EXECUTED: "code-executed",
    CONTROLLER_REGISTRATION: "controller-registration",
    CONTROLLER_UPDATE: "controller-update"
  }

  /**
   * should set current values from running controller state
   */
  const sketchControls: Controller = {...controller};

  Object.entries(sketchControls).forEach(([key, controlDesc]) => {
    const foundControl = window._sandbox_internals.controller[key];

    //TODO make sure the existing control state is valid for the new definition. 
    //(sanitize values before applying)
    sketchControls[key].currentValue = foundControl?.currentValue || controlDesc.initialValue;
   
  })

  function handleControllerUpdate (update: ControlUpdateMessage) {
    const {source, value} = update;

    const control = sketchControls[source];
    if (control) {
      control.currentValue = value;
    }
  }

  window.addEventListener('message', function(event) {
    console.log('message:', event.data);

    if (event.data.type === InternalMessageType.CONTROLLER_UPDATE) {
        handleControllerUpdate(event.data as ControlUpdateMessage);
        return;
    }

  });

  window.parent.postMessage({
    type: InternalMessageType.CONTROLLER_REGISTRATION, 
    sandboxId: window._sandbox_internals.id, 
    runId: window._sandbox_internals.runId,
    content: {...controller}
  }, '*');

  return sketchControls;
}

const SandboxNode: React.FC<SandboxNodeProps> = ({ data }) => {
  const { updateNodeData } = useReactFlow();

  const codeConnections = useHandleConnections({  type: 'target', id: "code" });
  const codeNodes = useNodesData(codeConnections.map((connection) => connection.source));
  const code = codeNodes.filter((node: any) => node.type === "codeEditor")[0]?.data.code;

  const controllerConnections = useHandleConnections({  type: 'target', id: "controller" });
  const controllerNodes = useNodesData(controllerConnections.map((connection) => connection.source));
  const controllerNode = controllerNodes.filter((node: any) => node.type === "controller")[0];

  if(controllerNodes.length >= 2) {console.warn(" 2 CONTROLLERS DETECTED")}

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const runNumber = useRef(0);

  const getRunId = () => String(runNumber.current);


  const runCode = () => {
    runNumber.current++;
    const sandbox = iframeRef.current as HTMLIFrameElement;
    const elem = document.getElementById(data.id)as HTMLIFrameElement;
    console.log("CONTROLLER STATE", JSON.stringify(controllerNode?.data.controller as Controller || {}))

    // TODO add encoding step to ensure safe javascript output (e.g backticks)
    // maybe use a function that can convert an object to literal format/representation
    const UNSAFE_STATE_ENCODING = JSON.stringify((controllerNode?.data.controller as Controller || {})); 

    if (sandbox && elem) {
      const runId = getRunId();
      console.log(runId);
      elem.style.display = 'none';
      const src = `
        <html>
          <head>
            <script defer src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.6.0/p5.js"></script>
            <script defer>
              const console = {
                log: function(...args) {
                    window.parent.postMessage({type: '${MessageType.CONSOLE_LOG}', sandboxId: "${data.id}", runId: "${runId}", content: args}, '*');
                }
              };
              window._sandbox_internals = {
                id: "${data.id}",
                runId: "${runId}",
                controller: JSON.parse(\`${UNSAFE_STATE_ENCODING}\`),
              };
            </script>
            <script defer> 
              {
               
                window.p5lab = {
                  controls:  ${controls.toString()}
                }
                
              }
            </script>
            <script defer> ${code}</script>
            
            <script defer>
              window.parent.postMessage({type: '${MessageType.CODE_EXECUTED}', sandboxId: "${data.id}", runId: "${runId}"}, '*');
            </script>
          </head>
          <body style="padding: 0; margin: 0;">
          </body>
        </html>
      `
      elem.srcdoc = src;
    }
  }

  const handleCodeExecuted = () => {
    console.log(`${data.id}: EXECUTED`);
    const elem = document.getElementById(data.id)as HTMLIFrameElement;
    if(elem){
      elem.style.display = 'block';
    }
  } 
  const handleResizingStart = () => {
    const elem = document.getElementById(data.id)as HTMLIFrameElement;
    if(elem){
      elem.style.pointerEvents = 'none';
    }
  }
  const handleResizingEnd = () => {
    const elem = document.getElementById(data.id)as HTMLIFrameElement;
    if(elem){
      elem.style.pointerEvents = 'auto';
    }
  }

  const handleControlUpdate = (key: string, value: number) => {
    const sandbox = iframeRef.current as HTMLIFrameElement;
    const elem = document.getElementById(data.id)as HTMLIFrameElement;
    if (sandbox && elem && elem.contentWindow){
      elem.contentWindow.postMessage({type: MessageType.CONTROLLER_UPDATE, source: key, value: value}, '*');
    }
  }

  const handleControllerRegistration = (newController: Controller) => {
    // esto podria pasarse al onAddController como un targetUpdateHandler?
    if(!data.onControlUpdate) {
      updateNodeData(data.id, {onControlUpdate: handleControlUpdate})
    }

    console.log(newController)
    if(controllerNode) {
      console.log("updating controller", controllerNode.data.id, newController)
      updateNodeData(controllerNode.data.id as string, { 
        controller: newController 
      })
    } else {
      console.log("adding controller", newController)
      data.onAddController(data.id, newController);
    }
  }

  useEffect(() => {
    console.log("RUN CODE EFFECT TRIGGER")
   runCode();
  }, [code, data]);

  
  useEffect(()=>{
    const handleMessage = (event: MessageEvent) => {
      if(event.data.sandboxId !== data.id) { return; }
      if(event.data.runId !== getRunId()) {
        console.log("Stale message | ", "expected: ", getRunId(), "received: ", event.data.runId)
        return;
      }

      if (event.data.type === MessageType.CODE_EXECUTED) {
        handleCodeExecuted()
        return;
      }

      if (event.data.type === 'console') {
        console.log(`Sandbox ${event.data.sandboxId}:`, ...event.data.content);
        return
      }

      if(event.data.type === MessageType.CONTROLLER_REGISTRATION) {
        console.log(`Sandbox ${event.data.sandboxId}:`, event.data.type);
        handleControllerRegistration(event.data.content);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => window.removeEventListener('message', handleMessage);
  }, )
  
  return (
    <div className="bg-white border w-full h-full flex flex-col">
      <NodeResizer minWidth={50} minHeight={50} onResizeStart={handleResizingStart} onResizeEnd={handleResizingEnd} />
      <Handle type="target" id="code" position={Position.Left} isConnectable={false}/>
      <Handle type="target" id="controller" position={Position.Bottom} className='left-4' isConnectable={false}/>
      <div className="w-full node-drag-handle border-b flex flex-row text-sm">
        <span className='flex-grow mx-1'> <span className=" text-xs">{data.id}</span></span>
        <Toggle label={"loop"} value={false} onChange={()=>{}} showValue={false}></Toggle>
        <Button onClick={runCode}>↺</Button>
      </div>
      <iframe
        ref={iframeRef}
        id={data.id}
        title={`Sandbox ${data.id}`}
        sandbox="allow-scripts"
        className={'h-full w-full object-contain block p-1'}
      />

    {/* <span className='h-1 absolute right-2 bottom-0'>asd</span> */}
    </div>
  );
};

export default SandboxNode;