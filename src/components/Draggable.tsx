import React from 'react';

interface DraggableProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Draggable: React.FC<DraggableProps> = ({ children, ...props }) => {
  return (
    <button
      className="px-1 py-0 cursor-move text-black bg-white rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50"
      {...props}
      draggable
    >
      {children}
    </button>
  );
};