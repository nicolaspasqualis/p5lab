import React from 'react';

interface TextareaProps {
  label: string,
  value: string,
  onChange: (value: string) => void;
}

export const Textarea: React.FC<TextareaProps> = ({ label, value, onChange }) => (
  <label className="flex flex-row gap-3 ">
    <span className="text-sm ">
      {label}
    </span>
    <div className='h-full flex flex-col flex-grow justify-center'>
      <input
        type='text'
        placeholder='empty'
        className="flex-grow-0 placeholder:text-grey-200 text-right w-full text-sm m-0 border-gray-300 text-black bg-white rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </label>
)
