import { useEffect, useRef, useState } from 'react';
import {
  NodeChange,
  OnNodesChange,
  Panel,
  useStore,
  useStoreApi,
} from '@xyflow/react';

type ChangeLoggerProps = {
  color?: string;
  limit?: number;
};

type ChangeInfoProps = {
  change: NodeChange;
};

function ChangeInfo({ change }: ChangeInfoProps) {
  const id = 'id' in change ? change.id : '-';
  const { type } = change;

  return (
    <div>
      <div>{id}</div>
      <div>
        <span>
        {type === 'add' && <>
          <span>├ + add</span>
          <pre className='text-wrap'>{JSON.stringify(change.item, null, 2)}</pre>
        </>}
        {type === 'dimensions' && <>
          <span>├ ⇲ dimensions</span>
          <pre>└── {`${change.dimensions?.width} × ${change.dimensions?.height}`}</pre>
        </>}
        {type === 'position' && <>
          <span>├ position</span>
          <pre>└── {`${change.position?.x.toFixed(1)}, ${change.position?.y.toFixed(1)}`}</pre>
        </>}
        {type === 'remove' && '└ × remove'}
        {type === 'select' && (change.selected ? '└ ● select' : '└ ○ unselect')}
        </span>
      </div>
    </div>
  );
}

export default function ChangeLogger({ limit = 20 }: ChangeLoggerProps) {
  const [changes, setChanges] = useState<NodeChange[]>([]);
  const onNodesChangeIntercepted = useRef(false);
  const onNodesChange = useStore((s) => s.onNodesChange);
  const store = useStoreApi();

  useEffect(() => {
    if (!onNodesChange || onNodesChangeIntercepted.current) {
      return;
    }

    onNodesChangeIntercepted.current = true;
    const userOnNodesChange = onNodesChange;

    const onNodesChangeLogger: OnNodesChange = (changes) => {
      userOnNodesChange(changes);
      setChanges((oldChanges) => [...changes, ...oldChanges].slice(0, limit));
    };

    store.setState({ onNodesChange: onNodesChangeLogger });
  }, [onNodesChange, limit]);

  return (
    <Panel position="top-left">
      <div className="react-flow__devtools-changelogger">
        {changes.length === 0 
          ? <>no changes triggered</> 
          : changes.map((change, index) => <ChangeInfo key={index} change={change} />)
        }
      </div>
    </Panel>
  );
}
