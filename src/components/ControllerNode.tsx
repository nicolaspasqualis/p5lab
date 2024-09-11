import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Handle, Position, NodeResizer, useReactFlow, useNodesData, useHandleConnections, Node, NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import { TriggerButton } from './controls/TriggerButton';
import { Button as UIButton } from './Button';
import { ControlDescriptor, ControllerDescriptor } from '../types/types';
import { Slider } from './controls/Slider';
import { Toggle } from './controls/Toggle';
import { Color } from './controls/Color';
import { Select } from './controls/Select';
import { Textarea } from './controls/Textarea';
import { SandboxNodeProps } from './SandboxNode';
import { NumberInput } from './controls/Number';

export type ControllerNodeProps = Node <{
  id: string;
  controller: ControllerDescriptor;
}>;

const ControllerNode: React.FC<NodeProps<ControllerNodeProps>> = ({ data, positionAbsoluteX, positionAbsoluteY, width, height }) => {
  const { updateNodeData, setCenter } = useReactFlow();

  const updateNodeInternals = useUpdateNodeInternals();
  const connections = useHandleConnections({ type: 'source', id: "sandbox" });
  // ? ↓ unnecessary node-data state?
  const nodesData = useNodesData(connections.map((connection) => connection.target));
  const sandboxNodes = nodesData.filter((node: any) => node.type === "sandbox")as SandboxNodeProps[];

  const [contentHeight, setContentHeight] = useState(height);
  const contentRef = useRef<HTMLDivElement>(null);
  
  useLayoutEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }

  }, [contentRef, data.controller]);

  useEffect(() => {
    updateNodeInternals(data.id)
  }, [contentHeight])

  /**
   * TODO
   * 
   * sanitize controller schema! an invalid controller def-
   * inition coming from a user-script could cause a crash.
   * 
   */


  const handleCenterOnNode = () => {
    setCenter(
      positionAbsoluteX + (width || 0) * 0.5, 
      positionAbsoluteY + (height || 0) * 0.5, 
      { zoom: 1, duration:500 }
    )
  }

  const handleControlUpdate = (key: string, value: number | string | boolean) => {
    sandboxNodes.forEach(sandbox => {
      sandbox.data.onControlUpdate(key, value);
    });

    updateNodeData(data.id, {
      controller: {
        ...data.controller,
        [key]: {
          ...data.controller[key],
          currentValue: value
        }
      }
    })
  }

  const handleReset = () => {
    updateNodeData(data.id, {
      controller: Object.fromEntries(
        Object.entries(data.controller).map(([key, control]) => [key, {
          ...control,
          currentValue: control.initialValue,
        }]
      ))
    })
  }

  const renderControl = (key: string, control: ControlDescriptor) => {
    switch (control.type) {
      case 'range':
        return <Slider 
          label={key}
          key={key}
          value={Number(data.controller[key].currentValue)}
          min={data.controller[key].min || 0}
          max={data.controller[key].max || 1}
          step={data.controller[key].step || 1}
          onChange={(value) => {
            handleControlUpdate(key, value);
          }}
        />
      case 'number':
        return <NumberInput 
          label={key}
          key={key}
          value={Number(data.controller[key].currentValue)}
          min={data.controller[key].min}
          max={data.controller[key].max}
          step={data.controller[key].step}
          onChange={(value) => {
            handleControlUpdate(key, value);
          }}
        />
      case 'checkbox': return <Toggle
        label={key}
        key={key}
        value={Boolean(control.currentValue)}
        onChange={(value) => {
          handleControlUpdate(key, value);
        }}
      />;
      case 'color': return <Color
        label={key}
        key={key}
        value={String(control.currentValue)}
        onChange={(value) => {
          handleControlUpdate(key, value);
        }}
      />
      case 'select': return <Select 
        label={key}
        key={key}
        value={String(control.currentValue)}
        options={control.options || []}
        onChange={(value) => {
          handleControlUpdate(key, value);
        }}
      />
      case 'button': return <TriggerButton
        label={key}
        onClick={()=>{ handleControlUpdate(key, key) }}

      />
      case 'text': return <Textarea
        label={key}
        value={String(control.currentValue)}
        onChange={(value) => {handleControlUpdate(key, value)}}

      />
      default: return null;
    }
  };

  return (
    <div className={`bg-white w-full h-[${contentHeight}px] `} ref={contentRef}>
      <NodeResizer minWidth={160} minHeight={contentHeight} maxHeight={contentHeight}/>
      <Handle type="source" id="sandbox" position={Position.Top} className='left-3' isConnectable={true} />
      <div className='flex flex-col' >
        <div className="w-full mx-[1px] mt-[1px] node-drag-handle border-b flex flex-row text-sm">
          <span className='flex-grow flex items-center'>  
            <UIButton onClick={handleCenterOnNode}>○</UIButton>
            <span className=" text-xs">{data.id}</span>
          </span>
          <UIButton onClick={handleReset}>↺</UIButton>
        </div>
        <div className='m-2 h-full flex-grow overflow-y-scroll flex flex-col gap-2' >
          {Object.entries(data.controller).length > 0 
            ? Object.entries(data.controller).map(
              ([key, control]) => <div key={key} className="">
                {renderControl(key, control)}
              </div>
              )
            : <div className='text-center text-xs'>
                <p className='text-gray-500'>ⓘ empty</p>
              </div>
          }
        </div>
      </div>
    </div>
  );
};

export default ControllerNode;