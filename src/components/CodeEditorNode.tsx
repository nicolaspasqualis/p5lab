import React from 'react';
import { Handle, Position, NodeResizer, useReactFlow, NodeProps, Node } from '@xyflow/react';
import { Editor } from '@monaco-editor/react';
import { Button } from './Button';

type CodeEditorNodeProps = Node <
  { 
    id: string;
    code: string; 
    onAddSandbox: (editorId: string) => void;
  }
>;

const CodeEditorNode: React.FC<NodeProps<CodeEditorNodeProps>> = ({ data, positionAbsoluteX, positionAbsoluteY, width, height  }) => {
  const { updateNodeData, setCenter } = useReactFlow();

  const handleCenterOnNode = () => {
    setCenter(
      positionAbsoluteX + (width || 0) * 0.5, 
      positionAbsoluteY + (height || 0) * 0.5, 
      { zoom: 1, duration:500 }
    )
  }


  return (
    <div className="bg-white border w-full h-full overflow-y-clip">
      <NodeResizer />
      <Handle type="source" id="sandbox" position={Position.Right} className="top-3"isConnectable={false}/>
      <div className="w-full node-drag-handle border-b flex flex-row text-sm">
        
        <span className='flex-grow flex items-center'> 
          <Button onClick={handleCenterOnNode}>○</Button>
          <span className=" text-xs">{data.id}</span>
        </span>
        <Button onClick={() => data.onAddSandbox(data.id)}>▷</Button>
      </div>
      <div className='w-full h-full '>
        <Editor
          width="100%"
          height="100%"
          className='p-0 m-0 mb-6'
          defaultLanguage="javascript"
          value={data.code}
          onChange={(value) => {updateNodeData(data.id, {code: value})}}
          options={{
            minimap: { enabled: false },
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditorNode;