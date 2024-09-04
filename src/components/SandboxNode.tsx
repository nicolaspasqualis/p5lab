import React, { useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeResizer, useHandleConnections, useNodesData, useReactFlow, NodeProps, Node } from '@xyflow/react';
import { Button } from './Button';
import { ControlValue, ControllerDescriptor } from '../types/types';
import { Toggle } from './controls/Toggle';
import { useDebouncedCallback } from 'use-debounce';
import { useGlobalConsole } from '../context/GlobalConsoleContext';
import { getIframeSourceTemplate, SandboxMessageType } from '../Sandbox';
import { ControllerNodeProps } from './ControllerNode';

export type SandboxNodeProps = Node<{
  id: string;
  loop: boolean;
  onControlUpdate: (key: string, value: ControlValue) => void;
  onAddController: (sandboxId: string, controller: ControllerDescriptor) => void;
}>;

const SandboxNode: React.FC<NodeProps<SandboxNodeProps>> = ({ data, positionAbsoluteX, positionAbsoluteY, width, height, dragging }) => {
  const { addLog } = useGlobalConsole();
  const { updateNodeData, setCenter } = useReactFlow();

  const codeConnections = useHandleConnections({ type: 'target', id: "code" });
  const codeNodes = useNodesData(codeConnections.map((connection) => connection.source));
  const codeNode = codeNodes.filter((node: any) => node.type === "editor")[0]
  const code = codeNode?.data.code as string | undefined;

  const controllerConnections = useHandleConnections({ type: 'target', id: "controller" });
  const controllerNodes = useNodesData(controllerConnections.map((connection) => connection.source));
  const controllers = controllerNodes.filter((node: any) => node.type === "controller") as ControllerNodeProps[];
  const tempSingleController = controllers.length > 0 ? controllers[0] : null;

  const [registeredControllers, setRegisteredControllers] = useState<ControllerDescriptor[]>([]) 

  //if (controllerNodes.length >= 2) { console.warn(" 2 CONTROLLERS DETECTED") }

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const runNumber = useRef(0);

  const getRunId = () => String(runNumber.current);

  const runCode = () => {
    runNumber.current++;
    const sandbox = iframeRef.current as HTMLIFrameElement;
    const elem = document.getElementById(data.id) as HTMLIFrameElement;
    // TODO add encoding step to ensure safe javascript output (e.g backticks?)
    // maybe use a function that can convert an object to literal format/representation?
    const controllerState = tempSingleController?.data.controller;

    if (sandbox && elem) {
      const runId = getRunId();
      elem.style.display = 'none';
      const src = getIframeSourceTemplate(runId, code || "", data, controllerState);
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
      elem.contentWindow.postMessage({ type: SandboxMessageType.EVAL, expression: `window._sandbox_internals.loop(${toggledLoop})` }, '*');
    }
  }

  const handleImgDownload = () => {
    const sandbox = iframeRef.current as HTMLIFrameElement;
    const elem = document.getElementById(data.id) as HTMLIFrameElement;
    if (sandbox && elem && elem.contentWindow) {
      elem.contentWindow.postMessage({ type: SandboxMessageType.EVAL, expression: `saveCanvas('${data.id}')` }, '*');
    }
  }

  const handleControlUpdate = (key: string, value: number) => {
    const sandbox = iframeRef.current as HTMLIFrameElement;
    const elem = document.getElementById(data.id) as HTMLIFrameElement;
    if (sandbox && elem && elem.contentWindow) {
      elem.contentWindow.postMessage({ type: SandboxMessageType.CONTROLLER_UPDATE, source: key, value: value }, '*');
    }
  }

  const handleControllerRegistration = (newController: ControllerDescriptor) => {
    if (!data.onControlUpdate) {
      updateNodeData(data.id, { onControlUpdate: handleControlUpdate })
    } 

    if (tempSingleController) {
      updateNodeData(tempSingleController.data.id as string, {
        controller: newController
      })
    } else {
      //setRegisteredControllers(prev => [...prev, newController])
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
        console.debug("Stale message | ", "expected: ", getRunId(), "received: ", event.data.runId)
        return;
      }

      if (event.data.type === SandboxMessageType.CODE_EXECUTED) {
        handleCodeExecuted()
        return;
      }

      if (event.data.type === SandboxMessageType.CONSOLE_LOG) {
        addLog({ sourceId: event.data.sandboxId, method: event.data.method, data: [...event.data.content] });
        return;
      }

      if (event.data.type === SandboxMessageType.CONTROLLER_REGISTRATION) {
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
      <Handle type="target" id="code" position={Position.Left} isConnectable={!codeNode} />
      <Handle type="target" id="controller" position={Position.Bottom} className='left-3 [&not:(.valid)]:bg-red-400' isConnectable={!tempSingleController} />
      <div className="node-drag-handle mx-[1px] mt-[1px] border-b flex flex-row text-sm gap-1 p-0">
        <span className='flex-grow flex items-center'>
          <Button onClick={handleCenterOnNode}>○</Button>
          <span className=" text-xs">{data.id}</span>
        </span>
        <Toggle label={"loop"} value={data.loop} onChange={handleLoopToggle} showValue={false}></Toggle>
        <span className='text-gray-300 mt-[1px]'>|</span>
        <Button onClick={handleImgDownload} className='px-1 text-sm rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50'>img</Button>
        <span className='text-gray-300 mt-[1px]'>|</span>
        <Button onClick={runCode}>↺</Button>
      </div>
      <iframe className={`flex-grow min-h-0 min-w-0 block ${dragging ? "pointer-events-none" : "pointer-events-auto"}`}
        ref={iframeRef}
        id={data.id}
        title={`Sandbox ${data.id}`}
        sandbox="allow-forms allow-modals allow-pointer-lock allow-popups 
         allow-scripts allow-top-navigation-by-user-activation allow-downloads"
      />
    </div>
  );
};

export default SandboxNode;