
import * as RadixSlider from '@radix-ui/react-slider';

interface SliderProps {
  label: string, 
  value: number,
  min: number, 
  max: number, 
  step: number,
  onChange: (value: number) => void,
}

export const Slider = ({label, value, min, max, step, onChange}: SliderProps) => (
  <label className="flex flex-col">
    <span className="text-sm flex-grow mb-0.5">{label}: <span className="text-xs text-right text-gray-500 font-mono">{value}</span></span>
    <RadixSlider.Root className="relative flex items-center w-full h-2"
      value={[value]}
      onValueChange={(value) => {
        onChange(Number(value[0]));
      }}
      min={min}
      max={max}
      step={step}
    >
      <RadixSlider.Track className="bg-gray-200 relative grow rounded-full h-1" >
        <RadixSlider.Range className="absolute bg-gray-200 rounded-full h-full" />
      </RadixSlider.Track>
      <RadixSlider.Thumb aria-label={label} className="block w-2 h-2 bg-white border-black border rounded-full focus:outline-none focus:ring-2 focus:border-black hover:bg-gray-800 transition-colors" />
    </RadixSlider.Root>
  </label>
)