
interface NumberProps {
  label: string,
  value: number,
  min?: number,
  max?: number,
  step?: number,
  onChange: (value: number) => void,
}

export const NumberInput = ({ label, value, min, max, step, onChange }: NumberProps) => (
  <label className="flex flex-row gap-3 ">
    <span className="text-sm ">{label}</span>
    <div className='h-full flex flex-col flex-grow justify-center'>
      <input className="flex-grow-0 placeholder:text-grey-200 text-right w-full text-sm m-0 border-gray-300 text-black bg-white rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50"
        type="number"
        value={value}
        onChange={(e) => {
          onChange(Number(e.target.value));
        }}
        {... min && {min}}
        {... max && {max}}
        {... step && {step}}
      />
    </div>
      
  </label>
)