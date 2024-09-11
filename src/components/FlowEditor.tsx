import React, { useState, useCallback, useRef, ChangeEvent, useEffect, DragEvent } from 'react';
import CodeEditorNode from './CodeEditorNode';
import SandboxNode from './SandboxNode';
import ControllerNode from './ControllerNode';
import { Button } from './Button';
import NodeInspector from './NodeInspector';
import ViewportLogger from './ViewportLogger';
import { ControllerDescriptor } from '../types/types';
import defaultScript from '../defaultScript';

import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Controls,
  Connection,
  Edge,
  Node,
  NodeTypes,
  MiniMap,
  Panel,
  SelectionMode,
  ReactFlowInstance,
  ReactFlowJsonObject,
  XYPosition,
  getOutgoers,
  getIncomers
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './../react-flow.css';
import InfoNode from './InfoNode';
import { GlobalConsole } from './GlobalConsole';
import blankState from './../blank.json';
import helloState from './../hello.json';
import moebiusState from './../moebius-mesh.json';
import { Toggle } from './controls/Toggle';
import { useDnD } from '../context/DragAndDropContext';
import { Draggable } from './Draggable';
import { useLocation } from 'react-router-dom';

const nodeTypes: NodeTypes = {
  editor: CodeEditorNode,
  sandbox: SandboxNode,
  controller: ControllerNode,
  info: InfoNode,
};

const nodeTypeIDs = {
  sandbox: "sandbox",
  editor: "editor",
  controller: "controller",
  info: "info",
}

type StoredState = {
  projectName?: string,
  nodeCount: number,
  flow: ReactFlowJsonObject<Node, Edge>
}

const BaseNodeAttributes = {
  dragHandle: '.node-drag-handle',
}

const defaultEditorWidth = 480;
const defaultEditorHeight = 720;
const defaultSandboxWidth = 360;
const defaultSandboxHeight = 360;
const defaultControllerWidth = 180;
const defaultInfoWidth = 480;
const defaultInfoHeight = 180;

const CreateSandboxNode = (
  id: string, onAddController: (sandboxId: string, controller: ControllerDescriptor) => void, 
  position: XYPosition, width?: number, height?: number
) => {
  const node: Node = {
    ...BaseNodeAttributes,
    id,
    type: 'sandbox',
    data: { 
      id,
      loop: true,
      onAddController,
    },
    position,
    width: width || defaultSandboxWidth,
    height: height || defaultSandboxHeight,
  };
  return node;
}

const CreateControllerNode = (id: string, controller: ControllerDescriptor, position: XYPosition) => {
  const node: Node = {
    ...BaseNodeAttributes,
    id,
    type: 'controller',
    data: { 
      id,
      controller,
    },
    position,
    width: defaultControllerWidth,
  };
  return node;
}

const CreateEditorNode = (id:string, onAddSandbox: (editorId: string) => void, position: XYPosition) => {
  const node: Node = {
    ...BaseNodeAttributes,
    id,
    type: 'editor',
    data: { 
      id,
      code: defaultScript, 
      onAddSandbox, 
    },
    position,
    width: defaultEditorWidth,
    height: defaultEditorHeight,
  };
  return node;
}


const CreateInfoNode = (id:string, position: XYPosition) => {
  const node: Node = {
    ...BaseNodeAttributes,
    id,
    type: 'info',
    data: { 
      id,
      markdown: "", 
    },
    position,
    width: defaultInfoWidth,
    height: defaultInfoHeight,
  };
  return node;
}

const CreateEdge = (sourceId: string, sourceType: string, targetId: string, targetType: string) => {
  const edge: Edge = {
    id: `${sourceId}->${targetId}`,
    source: sourceId,
    sourceHandle: targetType,
    target: targetId,
    targetHandle: sourceType,
  }
  return edge;
}

const getPositionAlongSideNodes = (nodes: Node[], orientation: "vertical" | "horizontal", gap: number = 40) => {
  if (!nodes.length) {
    return {x: 0, y: 0};
  }

  const lastNode = nodes[nodes.length - 1];
  const {x: lastNodeX, y: lastNodeY} : XYPosition = lastNode.position;
  const lastNodeW = lastNode.width;
  const lastNodeH = lastNode.height;
  const position: XYPosition = orientation === "horizontal" 
    ? { x: lastNodeX + (lastNodeW || 0) + gap, y: lastNodeY }
    : { x: lastNodeX, y: lastNodeY + (lastNodeH || 0) + gap }

  return position;
}

const exportJSON = (fileName: string, jsonString: string) => {
    const blob = new Blob([jsonString], {type : 'application/json'});
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${fileName}-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

const FlowEditor: React.FC = () => {
  const [projectName, setProjectName] = useState<string | undefined>();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { setViewport, getNode, getNodes, getEdges, screenToFlowPosition } = useReactFlow();
  const [showInfo, setShowInfo] = useState(false);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<Node, Edge>>();
  const nodeCount = useRef<number>(0);
  const [dndData, setDndData] = useDnD() as [string | undefined, (value: string) => void]; 
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    console.log(location)
    // only loads preset flows for the following hash paths:
    // home
    if (path === '/') {
      loadState(helloState);
      return;
    }
    // examples
    if (path === '/examples/moebius') {
      loadState(moebiusState);
      return; 
    }
    if (path === '/blank') {
      loadState(blankState);
      return;
    }

    return;

  }, [location]);
  
  useEffect(() => {
    document.title = projectName + ' — p5lab';
  }, [projectName]);

  useEffect(() => {
    const safeExitDialogTrigger = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = true;
    }
    window.addEventListener('beforeunload', safeExitDialogTrigger);
    return () => {
      window.removeEventListener('beforeunload', safeExitDialogTrigger);
    };
  }, []);

  const generateId = (nodeType: string) => {
    const id = `${nodeType}-${nodeCount.current}`;
    nodeCount.current++
    return id;
  }

  const onConnect = useCallback((params: Edge | Connection) => {
    setEdges((eds) => addEdge(params, eds))
  }, [setEdges]);

  const onExport = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      const storedState: StoredState = {
        projectName: projectName,
        nodeCount: nodeCount.current,
        flow: flow,
      }
      exportJSON(projectName || 'untitled', JSON.stringify(storedState))
    }
  }, [rfInstance, projectName]);

  const onImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target?.files && event.target?.files[0];
    if (!file) { return; }
    
    console.log(file);

    const reader = new FileReader();
    reader.onload = function(event) {
      const result = event?.target?.result;
      if (!result) { return }
        try {
            const state = JSON.parse(String(result));
            loadState(state);
        } catch (error) {
            console.error("Error parsing the imported file", error);
            alert("Failed to parse the state file.");
        }
    };
    reader.readAsText(file);
  }

  const loadState = (state: StoredState) => {
    const restoreFlow = async () => {
      setProjectName(state.projectName);

      if (state?.nodeCount){
        nodeCount.current = state.nodeCount;
      }
      if (state?.flow) {
        const { flow } = state
        const { x = 0, y = 0, zoom = 1 } = flow.viewport;
        setNodes((flow.nodes || []).map((node: Node) =>({
          ...node,
          data: { 
            ...node.data,
            ...node.type === "editor" && {onAddSandbox: addSandbox},
            ...node.type === "sandbox" && {onAddController: addController},
          }
        })));
        setEdges(flow.edges || []);
        setViewport({ x, y, zoom });
      }
    };

    restoreFlow();
  }

  const addSandbox = useCallback((editorId: string) => {
    const editorNode = getNode(editorId);
    if (!editorNode) {
      console.warn("sandbox created for a non-existent editor");
      return;
    }
    
    const sandboxSiblings = getOutgoers(editorNode, getNodes(), getEdges()).filter((n)=> n.type === 'sandbox');
    const position = getPositionAlongSideNodes([editorNode].concat(sandboxSiblings), "horizontal");
    const lastSibling = sandboxSiblings.length > 0 ? sandboxSiblings[sandboxSiblings.length - 1] : null;

    const id = generateId('sandbox');
    const newNode: Node = CreateSandboxNode(id, addController, position, lastSibling?.width, lastSibling?.height);
    const newEdge: Edge = CreateEdge(editorId, "code", id, "sandbox");

    setNodes((nds) => nds.concat(newNode));
    setEdges((eds) => eds.concat(newEdge));
  }, [setNodes, setEdges]);


  const addEmptySandbox = useCallback((position?: XYPosition) => {
    const id = generateId('sandbox');
    const newNode: Node = CreateSandboxNode(id, addController, 
      position || screenToFlowPosition({x: 100, y:100})
    );

    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const addController = useCallback((sandboxId: string, controller: ControllerDescriptor) => {
    const sandboxNode = getNode(sandboxId);
    if (!sandboxNode) {
      console.warn("controller created for a non-existent sandbox");
      return;
    }

    const controllerSiblings = getIncomers(sandboxNode, getNodes(), getEdges()).filter((n)=> n.type === 'controller');
    const position = getPositionAlongSideNodes([sandboxNode].concat(controllerSiblings), "vertical", 90);

    const id = generateId('controller');
    const newNode: Node = CreateControllerNode(id, controller, position);
    const newEdge: Edge = CreateEdge(id, "controller", sandboxId, "sandbox");

    setNodes((nds) => nds.concat(newNode));
    setEdges((eds) => eds.concat(newEdge));
  }, [setNodes, setEdges]);


  const addEmptyController = useCallback((position?: XYPosition) => {
    const id = generateId('controller');

    const newNode: Node = CreateControllerNode(id, {}, 
      position || screenToFlowPosition({x: 100, y:100})
    );

    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const addEditor = useCallback((position?: XYPosition) => {
    const id = generateId('editor');
    const {x, y} = position || screenToFlowPosition({x: 100, y:100});
    const newNode: Node = CreateEditorNode(id, addSandbox, {x, y});

    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);


  const addInfo = useCallback((position?: XYPosition) => {
    const id = generateId('info');
    const {x, y} = position || screenToFlowPosition({x: 100, y:100});
    const newNode: Node = CreateInfoNode(id, {x, y});

    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const toggleInfo = () => {
    setShowInfo(prev => !prev);
  }


  const onDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      
      if (!dndData) { return; }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      

      switch(dndData) {
        case nodeTypeIDs.editor: 
          addEditor(position);
          break;
        case nodeTypeIDs.sandbox: 
          addEmptySandbox(position);
          break;
        case nodeTypeIDs.controller: 
          addEmptyController(position);
          break;
        case nodeTypeIDs.info: 
          addInfo(position);
          break;
      }
     },
    [screenToFlowPosition, dndData],
  );

  const onDragStart = (event: DragEvent<HTMLElement>, nodeTypeId: string) => {
    setDndData(nodeTypeId);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="h-screen w-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setRfInstance}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        panOnScroll={true}
        selectionOnDrag={true}
        panOnDrag={[1,2]}
        selectionMode={SelectionMode.Partial}
        panOnScrollSpeed={1.25}
        minZoom={0.2}
        snapToGrid={true}
        snapGrid={[1,1]}
        fitView
        fitViewOptions={{padding: 0.05}}
      >
        <Panel position={'top-left'} className='m-2'>
          <div className='flex flex-row gap-1 items-center'>
            {window.location.hash 
              ? <label className='m-[1px] px-1 py-0 text-black bg-white w-auto rounded'>
                  <span>project:</span>
                  <input name="project-name" 
                    className='pl-1 pr-1 w-auto rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50'
                    placeholder='untitled'
                    value={projectName}
                    onChange={e => {setProjectName(e.target.value)}}
                  ></input>
                </label>
              : <Button onClick={()=> {loadState(blankState)}}>new project</Button>
            }
            
            <span className='text-gray-300'>|</span>

            <Button onClick={onExport}>export</Button>
            <label className='m-[1px] px-1 py-0 text-black bg-white rounded hover:bg-gray-200 focus:outline-none hover:ring-1 hover:ring-blue-500 hover:ring-opacity-50 cursor-pointer'>
              <span>import</span>
              <input
                className=''
                type="file"
                accept=".json"
                onChange={(e) => onImport(e)}
                style={{ display: 'none' }}
                id="json-file-input"
              />
            </label>
            <span className='text-gray-300'>|</span>
            
            <span className='text-gray-400'>nodes: </span>
            <Draggable onDragStart={(e) => onDragStart(e, "editor")}>editor</Draggable>
            <Draggable onDragStart={(e) => onDragStart(e, "sandbox")}>sandbox</Draggable>
            <Draggable onDragStart={(e) => onDragStart(e, "controller")}>controller</Draggable>
            <Draggable onDragStart={(e) => onDragStart(e, "info")}>info</Draggable>
            <span className='text-gray-300'>|</span>
            <Toggle label={"metadata"} value={showInfo} showValue={false} onChange={toggleInfo} className={'px-1 flex items-center flex-row gap-2 text-md rounded bg-white'}></Toggle>
            {/* <Button onClick={toggleInfo}>show metadata</Button>  */}
          </div>
        </Panel>
        <Controls className='shadow-none'
          fitViewOptions={{padding: 0.05}}
        />
        <MiniMap pannable zoomable 
          maskColor='transparent' 
          maskStrokeWidth={1} 
          maskStrokeColor='#00000030'
          nodeColor={'transparent'}
          nodeStrokeColor={'black'}
          className='m-4 bg-transparent'
          offsetScale={0}
        />
        {showInfo && <>
          <NodeInspector/>
          <ViewportLogger/>
        </>}
        <GlobalConsole/>
      </ReactFlow>
    </div>
  );
};

export default () => (
  <ReactFlowProvider>
    <FlowEditor/>
  </ReactFlowProvider>
);