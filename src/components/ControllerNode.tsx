import React from 'react';
import { Handle, Position, NodeResizer, useReactFlow, useNodesData, useHandleConnections, Node, NodeProps } from '@xyflow/react';
import { Button } from './controls/Button';
import { Button as UIButton } from './Button';
import { ControlDescriptor, ControllerDescriptor } from '../types/types';
import { Slider } from './controls/Slider';
import { Toggle } from './controls/Toggle';
import { Color } from './controls/Color';
import { Select } from './controls/Select';
import { TextControl } from './controls/TextControl';



type ControllerNodeProps = Node <
  {
    id: string;
    controller: ControllerDescriptor;
  }
>;

const ControllerNode: React.FC<NodeProps<ControllerNodeProps>> = ({ data, positionAbsoluteX, positionAbsoluteY, width, height }) => {
  const { updateNodeData, setCenter } = useReactFlow();
  const connections = useHandleConnections({ type: 'source', id: "sandbox" });
  // ? ↓ unnecessary node-data state?
  const nodesData = useNodesData(connections.map((connection) => connection.target));
  const sandboxNode = nodesData.filter((node: any) => node.type === "sandbox")[0]?.data;


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
    console.log("controller triggering update:", key, value)
    if (sandboxNode) {
      (sandboxNode.onControlUpdate as (key: string, value: number | string | boolean) => void)(key, value);
    }

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
      case 'button': return <Button
        label={key}
        onClick={()=>{ handleControlUpdate(key, key) }}

      />
      case 'text': return <TextControl
        label={key}
        value={String(control.currentValue)}
        onChange={(value) => {handleControlUpdate(key, value)}}

      />
      default: return null;
    }
  };

  return (
    <div className="bg-white w-full h-full">
      <NodeResizer minWidth={160}/>
      <Handle type="source" id="sandbox" position={Position.Top} className='left-3' isConnectable={false} />
      <div className="w-full node-drag-handle border-b flex flex-row text-sm">
        
        <span className='flex-grow flex items-center'>  
          <UIButton onClick={handleCenterOnNode}>○</UIButton>
          <span className=" text-xs">{data.id}</span>
        </span>
        <UIButton onClick={() => console.warn("not implemented")}>↺</UIButton>
      </div>
      <div className='m-2'>
        {Object.entries(data.controller).map(
          ([key, control]) => <div key={key} className="mb-2">
            {renderControl(key, control)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ControllerNode;