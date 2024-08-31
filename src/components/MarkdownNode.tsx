import React, { useState, FC, ChangeEvent, MouseEvent, FocusEvent } from 'react';
import { Handle, Position, NodeResizer, useReactFlow, NodeProps, Node } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import { Button } from './Button';

export type MarkdownNodeProps = Node <
  {
    id: string;
    markdown: string;
  }
>;

const MarkdownNode: FC<NodeProps<MarkdownNodeProps>> = ({ data, positionAbsoluteX, positionAbsoluteY, width, height }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const { updateNodeData, setCenter } = useReactFlow();

  const handleCenterOnNode = () => {
    setCenter(
      positionAbsoluteX + (width || 0) * 0.5, 
      positionAbsoluteY + (height || 0) * 0.5, 
      { zoom: 1, duration:500 }
    )
  }

  const handleContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(data.id, {markdown: event.target.value})
  };

  const handleViewClick = () => {
    setIsEditing(true);
  };  

  const handleBlur = () => {
    setIsEditing(false);
  };

  return (
    <div className="bg-white w-full h-full overflow-y-clip">
      <NodeResizer />
      <Handle type="source" id="sandbox" position={Position.Right} className="top-3"isConnectable={false}/>
      <div className="w-full node-drag-handle border-b flex flex-row text-sm">
        
        
        <span className='flex-grow flex items-center'> 
        <Button onClick={handleCenterOnNode}>○</Button>
          <span className=" text-xs">{data.id}</span>
          </span>
      </div>
    <div className="w-full h-full text-lg p-4 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500">
      {isEditing ? (
        <textarea
          className="w-full flex h-full p-0 m-0 border-none outline-none resize-none"
          value={data.markdown}
          onChange={handleContentChange}
          onBlur={handleBlur}
          autoFocus
        />
      ) : (
        <div
          className="w-full h-full"
          onClick={handleViewClick}
          tabIndex={0}
          onFocus={handleViewClick}
        >
          <ReactMarkdown>{data.markdown}</ReactMarkdown>
        </div>
      )}
    </div>
    </div>
  );
};

export default MarkdownNode;