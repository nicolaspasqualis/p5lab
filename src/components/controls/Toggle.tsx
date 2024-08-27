import * as Switch from '@radix-ui/react-switch';

interface ToggleProps {
  label: string,
  value: boolean,
  showValue?: boolean
  onChange: (value: boolean) => void,
}

export const Toggle = ({ label, value, onChange, showValue=true }: ToggleProps) => (
  <label className="flex flex-row gap-2">
    <span className="text-sm flex-grow">
      {label}{showValue && <>: <span className="text-xs text-right text-gray-500 font-mono">{value.toString()}</span></>}
    </span>
    <div className='h-[20px] pt-[2px] pb-[2px] flex flex-col items-center'>
      <Switch.Root className="flex-grow-0 m-0 w-[27px] h-[14px] p-0 bg-gray-200 rounded-full relative focus:shadow-black data-[state=checked]:bg-black outline-none cursor-default"
        checked={value}
        onCheckedChange={(val) => {
          onChange(val);
        }}
      >
        <Switch.Thumb className="block w-[12px] h-[12px] -translate-y-[0] bg-white rounded-full transition-transform duration-100 -translate-x-[0] will-change-transform data-[state=checked]:translate-x-[13px]" />
      </Switch.Root>
    </div>
  </label>
)