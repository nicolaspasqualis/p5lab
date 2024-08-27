import * as SelectRadix from '@radix-ui/react-select';
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';

interface ToggleProps {
  label: string,
  value: string,
  options: string[],
  onChange: (value: string) => void,
}

export const Select = ({label, value, options, onChange}: ToggleProps) => (
  <label className="flex flex-row">
    <span className="text-sm flex-grow">{label}</span>
    <SelectRadix.Root
      value={value}
      onValueChange={(val) => {
        const newValue = String(val)
        onChange(newValue);
      }}
    >
      <SelectRadix.Trigger className="p-0 inline-flex items-center justify-center rounded text-sm font-normal leading-none gap-[5px] bg-white hover:bg-mauve3 data-[placeholder]:text-violet9 outline-none">
        <SelectRadix.Value className="p-0" placeholder="Select an option" />
        <SelectRadix.Icon>
          <ChevronDownIcon className="h-4 w-4" />
        </SelectRadix.Icon>
      </SelectRadix.Trigger>
      <SelectRadix.Portal>
        <SelectRadix.Content className="overflow-hidden bg-white rounded-md shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]">
          <SelectRadix.ScrollUpButton className="flex items-center justify-center  bg-white text-violet11 cursor-default">
            <ChevronUpIcon />
          </SelectRadix.ScrollUpButton>
          <SelectRadix.Viewport className="p-[0px]">
            {options.map(option => (
              <SelectRadix.Item key={option} value={option} className="text-sm leading-none text-black rounded flex items-center h-6 pr-4 pl-4 relative select-none data-[highlighted]:outline-none data-[highlighted]:bg-gray-300 transition-colors">
                <SelectRadix.ItemText>{option}</SelectRadix.ItemText>
              </SelectRadix.Item>
            ))}
          </SelectRadix.Viewport>
          <SelectRadix.ScrollDownButton className="flex items-center justify-center  bg-white text-violet11 cursor-default">
            <ChevronDownIcon />
          </SelectRadix.ScrollDownButton>
        </SelectRadix.Content>
      </SelectRadix.Portal>
    </SelectRadix.Root>
  </label>
)