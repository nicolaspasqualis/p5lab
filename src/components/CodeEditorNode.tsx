import React from 'react';
import { Handle, Position, NodeResizer, NodeToolbar, useReactFlow } from '@xyflow/react';
import { Editor } from '@monaco-editor/react';
import { Button } from './Button';

interface CodeEditorNodeProps {
  data: { 
    id: string;
    code: string; 
    onAddSandbox: (editorId: string) => void;
  };
}

const CodeEditorNode: React.FC<CodeEditorNodeProps> = ({ data }) => {
  const { updateNodeData } = useReactFlow();

  return (
    <div className="bg-white border w-full h-full">
      <NodeResizer />
      <Handle type="source" id="sandbox" position={Position.Right} className="top-4"isConnectable={false}/>
      <div className="w-full node-drag-handle border-b" >
        <Button onClick={() => data.onAddSandbox(data.id)}>▷</Button>
      </div>
      <div className='w-full h-full '>
        <Editor
          width="100%"
          height="100%"
          className='p-0 m-0 mb-8'
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