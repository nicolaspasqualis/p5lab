import React from 'react';

interface ButtonProps {
    label: string,
    onClick: () => void,
}

export const Button: React.FC<ButtonProps> = ({label, onClick }) => (
    <label className="flex flex-row gap-1">
    <span className="text-sm flex-grow">
      {label}
    </span>
    <div className='h-full pt-[2px] pb-[2px] flex flex-col justify-center'>
    <button
      className="flex-grow-0 m-0 w-[32px] h-[16px] p-0 border-gray-300 text-black bg-white rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50"
      onClick={onClick}
    />
    </div>
  </label>
)
