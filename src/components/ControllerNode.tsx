import React, { useState } from 'react';
import { Handle, Position, NodeResizer, useReactFlow, useNodesData, useHandleConnections } from '@xyflow/react';
import { Editor } from '@monaco-editor/react';
import { Button } from './Button';
import { ControlDescriptor, Controller } from '../types/types';
import { Slider } from './controls/Slider';
import * as Switch from '@radix-ui/react-switch';
import { Toggle } from './controls/Toggle';
import { Color } from './controls/Color';
import { Select } from './controls/Select';


interface ControllerNodeProps {
  data: {
    id: string;
    controller: Controller;
  };
}

const ControllerNode: React.FC<ControllerNodeProps> = ({ data }) => {
  const { updateNodeData } = useReactFlow();
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
      default: return null;
    }
  };

  return (
    <div className="bg-white border w-full h-full">
      <NodeResizer minWidth={160}/>
      <Handle type="source" id="sandbox" position={Position.Top} className='left-4' isConnectable={false} />
      <div className="w-full node-drag-handle border-b" >
        <Button onClick={() => console.warn("not implemented")}>↺</Button>
      </div>
      <div className='m-2'>
        {Object.entries(data.controller).map(
          ([key, control]) => <div className="mb-2">
            {renderControl(key, control)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ControllerNode;