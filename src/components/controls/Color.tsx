interface ToggleProps {
  label: string,
  value: string,
  onChange: (value: string) => void,
}

export const Color = ({label, value, onChange}: ToggleProps) => (
  <label className="flex flex-row">
    <span className="text-sm flex-grow">{label}: <span className="text-xs text-right text-gray-500 font-mono">{value}</span></span>
    <input
      type="color"
      value={value}
      className='bg-white h-6 p-0 m-0 w-[16px] h-[20px]'
      onChange={(e) => {
        onChange(String(e.target.value));
      }}
    />
  </label>
)