import * as Switch from '@radix-ui/react-switch';

interface ToggleProps {
  label: string,
  value: boolean,
  showValue?: boolean
  onChange: (value: boolean) => void,
  className?: string
}

export const Toggle = ({ label, value, onChange, showValue = true, className }: ToggleProps) => (
  <label className={className || "flex items-center flex-row gap-1 text-sm "}>
    <span className="flex-grow">
      {label}{showValue && <>: <span className="text-xs text-right text-gray-500 font-mono">{value.toString()}</span></>}
    </span>
    <div className='h-full pt-[2px] pb-[2px] flex flex-col justify-center'>
      <Switch.Root className="focus:outline-none focus:border-blue-500 flex-grow-0 m-0 w-[20px] h-[12px] p-0 bg-white border border-gray-300 rounded-full relative data-[state=checked]:bg-white outline-none cursor-default"
        checked={value}
        onCheckedChange={(val) => {
          onChange(val);
        }}
      >
        <Switch.Thumb className="block w-[8px] h-[8px] -translate-y-[0] translate-x-[1px] bg-white border border-grey-300 rounded-full transition-transform duration-100 -translate-x-[0] will-change-transform data-[state=checked]:translate-x-[9px] data-[state=checked]:border-black data-[state=checked]:bg-white" />
      </Switch.Root>
    </div>
  </label>
)