import React, { useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeResizer, useHandleConnections, useNodesData, useReactFlow, XYPosition, NodeProps, Node } from '@xyflow/react';
import { Button } from './Button';
import { ControlType, ControlUpdateMessage, ControlValue, ControllerDescriptor, LogMethods } from '../types/types';
import { Toggle } from './controls/Toggle';
import { useDebouncedCallback } from 'use-debounce';
import { useGlobalConsole } from '../context/GlobalConsoleContext';
import { CircleIcon } from '@radix-ui/react-icons';

export type SandboxNodeProps = Node<
  {
    id: string;
    loop: boolean;
    onControlUpdate: (key: string, value: number) => void;
    onAddController: (sandboxId: string, controller: ControllerDescriptor) => void;
  }
>;

declare global {
  interface Window {
    _sandbox_internals: {
      id: string;
      runId: string;
      controller: ControllerDescriptor;
      loop: (shouldLoop: boolean) => void;
      draw: () => void;
    }
    control: () => void;
  }
}

const MessageType = {
  CONSOLE_LOG: "console-log",
  CODE_EXECUTED: "code-executed",
  CONTROLLER_REGISTRATION: "controller-registration",
  CONTROLLER_UPDATE: "controller-update",
  EVAL: "eval",
}

// This needs to be a function without external dependencies 
// besides the window context in which it will be run.
// It expects the window object to be extended with the 
// necessary dependencies as declared in ~global~.
// This function is injected into the iframe sandbox by converting it
// to string (controls.toString()) and then evaluated as a <script/>
function initScript() {
  const InternalMessageType: typeof MessageType = {
    CONSOLE_LOG: "console-log",
    CODE_EXECUTED: "code-executed",
    CONTROLLER_REGISTRATION: "controller-registration",
    CONTROLLER_UPDATE: "controller-update",
    EVAL: "eval",
  }

  window.addEventListener('message', function (event) {
    if (event.data.type === InternalMessageType.EVAL) {
      eval(event.data.expression);
      return;
    }
  });
}

type SandboxControl = {
  value: number | boolean | string,
  type: ControlType,
  min?: number,
  max?: number,
  step?: number,
  options?: string[],
  onChange?: (value: ControlValue) => void,
  onTrigger?: () => void,
}

type SandboxController = {
  [key: string]: SandboxControl,
}

type SandboxControlRelaxed = Omit<SandboxControl, 'type'> & {
  type?: ControlType;
};

type SandboxControllerRelaxed = {
  [key: string]: SandboxControlRelaxed,
}


function controls(newSBController: SandboxControllerRelaxed) {
  const InternalMessageType: typeof MessageType = {
    CONSOLE_LOG: "console-log",
    CODE_EXECUTED: "code-executed",
    CONTROLLER_REGISTRATION: "controller-registration",
    CONTROLLER_UPDATE: "controller-update",
    EVAL: "eval",
  }


  function matchToInputType(control: SandboxControlRelaxed): ControlType {
    if (control.type) return control.type;

    if (typeof control.value === 'string') {
      if (/^#[0-9A-Fa-f]{3,6}$/.test(control.value)) {
        return 'color';
      }
      if (control.options && control.options.includes(control.value)) {
        return 'select';
      }
      return 'text';
    }

    if (typeof control.value === 'boolean') {
      return 'checkbox';
    }

    if (typeof control.value === 'number') {
      if (control.min !== undefined && control.max !== undefined) {
        return 'range';
      }
      /** TODO
       * 
       */
      //return 'number';
    }

    if (control.onTrigger) {
      return 'button';
    }

    throw new Error("Unable to determine control type");
  }

  /**
   * should set current values from running controller state
   */
  const sandboxController: SandboxController = Object.fromEntries(
    Object.entries(newSBController).map(([key, control]) => [key, {
      ...control,
      type: matchToInputType(control),
    }]
    ));

  const registeredController: ControllerDescriptor = Object.fromEntries(
    Object.entries(sandboxController).map(
      ([key, control]) => [key, {
        initialValue: control.value,
        currentValue: control.value,
        type: control.type,
        min: control.min,
        max: control.max,
        step: control.step,
        options: control.options
      }]
    )
  )

  Object.entries(sandboxController).forEach(([key, controlDesc]) => {
    const foundControl = window._sandbox_internals.controller[key];
    //TODO make sure the existing control state is valid for the new definition. 
    //(sanitize values before applying)
    const currentValue = foundControl?.currentValue || controlDesc.value;
    sandboxController[key].value = currentValue;
    registeredController[key].currentValue = currentValue;
  })

  function handleControllerUpdate(update: ControlUpdateMessage) {
    const { source, value } = update;
    const control = sandboxController[source];

    if (!control) { return; }

    // update value ref
    control.value = value;
    
    if (control.type === 'button') {
      control.onTrigger?.();
    } else {
      control.onChange?.(value);
    }

    window._sandbox_internals.draw();
  }

  window.addEventListener('message', function (event) {
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
    content: { ...registeredController }
  }, '*');

  return sandboxController;
}


function interceptConsole(console: Console, sandboxId: string, runId: string) {
  const InternalMessageType: typeof MessageType = {
    CONSOLE_LOG: "console-log",
    CODE_EXECUTED: "code-executed",
    CONTROLLER_REGISTRATION: "controller-registration",
    CONTROLLER_UPDATE: "controller-update",
    EVAL: "eval",
  }

  const methodsToIntercept: (keyof Console)[] = ['log', 'info', 'warn', 'debug', 'error']

  methodsToIntercept.forEach(method => {
    console[method] = (...args) => {
      window.parent.postMessage({
        type: InternalMessageType.CONSOLE_LOG,
        sandboxId,
        runId,
        method,
        content: args
      }, '*');
    }
  })

  window.addEventListener("error", (event) => {
    event.preventDefault();

    window.parent.postMessage({
      type: InternalMessageType.CONSOLE_LOG,
      sandboxId,
      runId,
      method: 'unhandled_error',
      content: [event.message],
    }, '*');
  });

  window.addEventListener("unhandledrejection", (event) => {
    event.preventDefault();

    window.parent.postMessage({
      type: InternalMessageType.CONSOLE_LOG,
      sandboxId,
      runId,
      method: 'unhandled_error',
      content: [event.reason],
    }, '*');
  });
}

const SandboxNode: React.FC<NodeProps<SandboxNodeProps>> = ({ data, positionAbsoluteX, positionAbsoluteY, width, height }) => {
  const { addLog } = useGlobalConsole();
  const { updateNodeData, setCenter } = useReactFlow();

  const codeConnections = useHandleConnections({ type: 'target', id: "code" });
  const codeNodes = useNodesData(codeConnections.map((connection) => connection.source));
  const code = codeNodes.filter((node: any) => node.type === "codeEditor")[0]?.data.code;

  const controllerConnections = useHandleConnections({ type: 'target', id: "controller" });
  const controllerNodes = useNodesData(controllerConnections.map((connection) => connection.source));
  const controllerNode = controllerNodes.filter((node: any) => node.type === "controller")[0];

  //const [loop, setLoop] = useState(false);

  if (controllerNodes.length >= 2) { console.warn(" 2 CONTROLLERS DETECTED") }

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const runNumber = useRef(0);

  const getRunId = () => String(runNumber.current);



  const runCode = () => {
    runNumber.current++;
    const sandbox = iframeRef.current as HTMLIFrameElement;
    const elem = document.getElementById(data.id) as HTMLIFrameElement;
    console.log("CONTROLLER STATE", JSON.stringify(controllerNode?.data.controller as ControllerDescriptor || {}))

    // TODO add encoding step to ensure safe javascript output (e.g backticks)
    // maybe use a function that can convert an object to literal format/representation
    const UNSAFE_STATE_ENCODING = JSON.stringify((controllerNode?.data.controller as ControllerDescriptor || {}));

    if (sandbox && elem) {
      const runId = getRunId();
      console.log(runId);
      elem.style.display = 'none';
      const src = `
        <html>
          <head>
            <script defer src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.6.0/p5.js"></script>
            <script defer>
              (${interceptConsole.toString()})(window.console, "${data.id}", "${runId}")
            </script>
            <script defer>
              
              window._sandbox_internals = {
                id: "${data.id}",
                runId: "${runId}",
                controller: JSON.parse(\`${UNSAFE_STATE_ENCODING}\`),
                loop: (shouldLoop) => {
                  if(shouldLoop && !isLooping()){
                    loop()
                  } else {
                    noLoop()
                  }
                },
                draw: () => {
                  if (!isLooping()) {
                    redraw();
                  }
                }
              };
            </script>
            <script defer>
              (${initScript.toString()})()
            </script>
            <script defer>{
              window.p5lab = {
                controls: ${controls.toString()}
              }
            }</script>
            <script defer>
              function windowResized() {
                resizeCanvas(windowWidth, windowHeight)
              }
            </script>
            <script defer>
              ${code}
            </script>
            <script>
              if (window.setup) {
                const original = window.setup
                window.setup = () => { 
                  original(); 
                  if(${!data.loop}) {
                    noLoop();
                  }
                }
              }
            </script>
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

  const runCodeDebounced = useDebouncedCallback(runCode, 1000);

  const handleCenterOnNode = () => {
    setCenter(
      positionAbsoluteX + (width || 0) * 0.5,
      positionAbsoluteY + (height || 0) * 0.5,
      { zoom: 1, duration: 500 }
    )
  }

  const handleCodeExecuted = () => {
    console.log(`${data.id}: EXECUTED`);
    const elem = document.getElementById(data.id) as HTMLIFrameElement;
    if (elem) {
      elem.style.display = 'block';
    }
  }
  const handleResizingStart = () => {
    const elem = document.getElementById(data.id) as HTMLIFrameElement;
    if (elem) {
      elem.style.pointerEvents = 'none';
    }
  }
  const handleResizingEnd = () => {
    const elem = document.getElementById(data.id) as HTMLIFrameElement;
    if (elem) {
      elem.style.pointerEvents = 'auto';
    }
  }

  const handleLoopToggle = () => {
    const toggledLoop = !data.loop;
    updateNodeData(data.id, { loop: toggledLoop })
    const sandbox = iframeRef.current as HTMLIFrameElement;
    const elem = document.getElementById(data.id) as HTMLIFrameElement;
    if (sandbox && elem && elem.contentWindow) {
      elem.contentWindow.postMessage({ type: MessageType.EVAL, expression: `window._sandbox_internals.loop(${toggledLoop})` }, '*');
    }
  }

  const handleImgDownload = () => {
    const sandbox = iframeRef.current as HTMLIFrameElement;
    const elem = document.getElementById(data.id) as HTMLIFrameElement;
    if (sandbox && elem && elem.contentWindow) {
      elem.contentWindow.postMessage({ type: MessageType.EVAL, expression: `saveCanvas('${data.id}')` }, '*');
    }
  }

  const handleControlUpdate = (key: string, value: number) => {
    const sandbox = iframeRef.current as HTMLIFrameElement;
    const elem = document.getElementById(data.id) as HTMLIFrameElement;
    if (sandbox && elem && elem.contentWindow) {
      elem.contentWindow.postMessage({ type: MessageType.CONTROLLER_UPDATE, source: key, value: value }, '*');
    }
  }

  const handleControllerRegistration = (newController: ControllerDescriptor) => {
    if (!data.onControlUpdate) {
      updateNodeData(data.id, { onControlUpdate: handleControlUpdate })
    }

    if (controllerNode) {
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
    runCodeDebounced();
  }, [code]);


  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.sandboxId !== data.id) { return; }
      if (event.data.runId !== getRunId()) {
        console.log("Stale message | ", "expected: ", getRunId(), "received: ", event.data.runId)
        return;
      }

      if (event.data.type === MessageType.CODE_EXECUTED) {
        handleCodeExecuted()
        return;
      }

      if (event.data.type === MessageType.CONSOLE_LOG) {
        addLog({ sourceId: event.data.sandboxId, method: event.data.method, data: [...event.data.content] });
        return;
      }

      if (event.data.type === MessageType.CONTROLLER_REGISTRATION) {
        handleControllerRegistration(event.data.content);
        return;
      }
    };

    window.addEventListener('message', handleMessage);

    return () => window.removeEventListener('message', handleMessage);
  },)

  return (
    <div className="bg-white w-full h-full flex flex-col">
      <NodeResizer minWidth={50} minHeight={50} onResizeStart={handleResizingStart} onResizeEnd={handleResizingEnd} />
      <Handle type="target" id="code" position={Position.Left} isConnectable={false} />
      <Handle type="target" id="controller" position={Position.Bottom} className='left-3' isConnectable={false} />
      <div className="w-full node-drag-handle border-b flex flex-row text-sm gap-1 p-0">

        <span className='flex-grow flex items-center'>
          <Button onClick={handleCenterOnNode}>○</Button>
          <span className=" text-xs">{data.id}</span>
        </span>
        <Toggle label={"loop"} value={data.loop} onChange={handleLoopToggle} showValue={false}></Toggle>
        <span className='text-gray-300'>|</span>
        <Button onClick={handleImgDownload} className='px-1 text-sm rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50'>img</Button>
        <span className='text-gray-300'>|</span>
        <Button onClick={runCode}>↺</Button>
      </div>
      <iframe
        ref={iframeRef}
        id={data.id}
        title={`Sandbox ${data.id}`}
        sandbox="allow-forms allow-modals allow-pointer-lock allow-popups 
         allow-scripts allow-top-navigation-by-user-activation allow-downloads"

        className={'h-full w-full object-contain block p-1'}
      />
    </div>
  );
};

export default SandboxNode;