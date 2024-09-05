import { Panel } from "@xyflow/react";
import { useGlobalConsole } from "../context/GlobalConsoleContext";
import { LogEntry } from "../types/types";
import React, { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, ChevronRightIcon, ChevronLeftIcon } from '@radix-ui/react-icons';
import { Button } from "./Button";



interface LogEntryVisualizerProps {
  log: LogEntry;
}

const getLogColor = (method: string) => {
  switch (method) {
    case 'error': return 'text-red-600';
    case 'warn': return 'text-yellow-600';
    case 'info': return 'text-blue-600';
    default: return 'text-gray-700';
  }
};

const getLogIcon = (method: string) => {
  switch (method) {
    case 'error': return 'ⓧ';
    case 'unhendled_error': return 'ⓧ';
    default: return 'ⓘ';
  }
};

const LogEntryVisualizer: React.FC<LogEntryVisualizerProps> = ({ log }) => {
  const [expanded, setExpanded] = useState(true);

  const renderValue = (value: any): JSX.Element => {
    if (value === null) return <span className="text-gray-500">null</span>;
    if (value === undefined) return <span className="text-gray-500">undefined</span>;
    if (typeof value === 'string') return <span className="text-green-500">"{value}"</span>;
    if (typeof value === 'number') return <span className="text-blue-500">{value}</span>;
    if (typeof value === 'boolean') return <span className="text-purple-500">{value.toString()}</span>;
    if (Array.isArray(value)) {
      return (
        <div>
          <span className="text-gray-700">[</span>
          <div className="pl-4">
            {value.map((item, index) => (
              <div key={index}>{renderValue(item)}{index < value.length - 1 ? ',' : ''}</div>
            ))}
          </div>
          <span className="text-gray-700">]</span>
        </div>
      );
    }
    if (typeof value === 'object') {
      return (
        <div>
          <span className="text-gray-400">{'{'}</span>
          <div className="pl-4">
            {Object.entries(value).map(([key, val], index, arr) => (
              <div key={key}>
                <span className="text-purple-500">"{key}"</span>: {renderValue(val)}
                {index < arr.length - 1 ? ',' : ''}
              </div>
            ))}
          </div>
          <span className="text-gray-400">{'}'}</span>
        </div>
      );
    }
    return <span>{String(value)}</span>;
  };

  return (
    <div className="mb-2 rounded w-full bg-white ">
      <div 
        className={`flex flex-row items-center cursor-pointer mb-1 text-xs`}
        onClick={() => setExpanded(!expanded)}
      > 
        <span className="flex-grow flex flex-row gap-1">
          <span className={getLogColor(log.method)}>{getLogIcon(log.method)}</span> 
          {log.sourceId}
          <span className='text-gray-300'>|</span>
          {log.method}
        </span>
       {expanded ? <ChevronUpIcon/>:<ChevronDownIcon/>}
      </div>
      {expanded && (
        <div className="font-mono text-xs w-full">
          {log.data.map((item, index) => (
            <div key={index} className="mb-1">
              {renderValue(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const GlobalConsole = () => {
  const { logs, errors, warnings, others, clearLogs } = useGlobalConsole();

  const [expanded, setExpanded] = useState(true);
console.log(errors, others, warnings)
  return (<Panel position="top-right" className={`max-w-72 m-0 p-3 max-h-[100vh] flex flex-col ${expanded ? 'w-full' : 'w-auto'}`}>
    
    <div className="flex bg-white flex-row gap-2 cursor-pointer mb-2 text-right content-center" onClick={() => setExpanded(!expanded)} >
      <div className="flex-grow justify-end flex content-center flex-wrap">{expanded ? <ChevronRightIcon/>: <ChevronLeftIcon/>}</div>
      <div className="flex flex-row gap-2">
        {errors > 0 && <span className={getLogColor('error')}>{getLogIcon('error')} {errors}</span> }
        {warnings > 0 && <span className={getLogColor('warning')}>{getLogIcon('warning')} {warnings}</span> }
        {others > 0 && <span className={getLogColor('log')}>{getLogIcon('log')} {others}</span> }
        {(errors + warnings + others === 0) && <span className='text-gray-300'>_</span>}
      </div>
    </div>
    {expanded && <div className="text-sm w-full pl-1 h-full overflow-y-scroll w-full bg-white ">
    {logs.length > 0 && <span className="flex flex-row items-center p-0 border-b mb-2">
        <span className=" px-0 text-gray-500 p-0">
          logs <span className="font-mono" >({logs.length})</span>
        </span>
        <Button onClick={()=> {clearLogs()} }>clear all</Button>
      </span>
}
      {logs.map((l, i) => <LogEntryVisualizer key={i} log={l}/>)}
    </div>}
  </Panel>)
}

