import { useState, FC, ChangeEvent } from 'react';
import { NodeResizer, useReactFlow, NodeProps, Node } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import { Button } from './Button';
import { Link } from 'react-router-dom';

export type InfoNodeProps = Node <{
  id: string;
  markdown: string;
}>;

const InfoNode: FC<NodeProps<InfoNodeProps>> = ({ data, positionAbsoluteX, positionAbsoluteY, width, height }) => {
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

  const handleViewClick = (event: React.MouseEvent | React.FocusEvent) => {
    const target = event.target as HTMLElement;
    const tag = target.tagName.toLowerCase();

    // ignore if it comes from an interactive markdown target 
    // (e.g anchors)
    if (tag === 'a') {
      return;
    }

    setIsEditing(true);
  };  

  const handleBlur = () => {
    setIsEditing(false);
  };

  return (
    <div className="bg-white w-full h-full overflow-y-clip">
      <NodeResizer />
      <div className="w-full mx-[1px] mt-[1px] node-drag-handle border-b flex flex-row text-sm">
        <span className='flex-grow flex items-center'> 
          <Button onClick={handleCenterOnNode}>○</Button>
          <span className=" text-xs">{data.id}</span>
        </span>
      </div>
    <div className="w-full h-full cursor-text text-lg p-4 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500">
      {isEditing ? (
        <textarea
          className="w-full flex h-full p-0 m-0 border-none outline-none resize-none leading-tight"
          value={data.markdown}
          onChange={handleContentChange}
          onBlur={handleBlur}
          autoFocus
        />
      ) : (
        <div
          className="w-full h-full flex flex-col gap-4 leading-tight"
          onClick={handleViewClick}
          tabIndex={0}
          onFocus={handleViewClick}
        >
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => (
                <Link {...props} to={props.href || ""} onClick={(e) => e.stopPropagation()} target="_blank" rel="noopener noreferrer" />
              ),
              pre: ({ node, ...props }) => (
                <pre {...props} className='p-2 bg-neutral-50 text-sm overflow-x-scroll'/>
              ),
          }}
          >{data.markdown}</ReactMarkdown>
        </div>
      )}
    </div>
    </div>
  );
};

export default InfoNode;