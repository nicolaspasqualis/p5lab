import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Button } from './Button';

const desktopWarningAckKey = 'p5lab/user-settings/desktopWarningAcknowledged';

const DesktopWarningModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasAcknowledged = localStorage.getItem(desktopWarningAckKey);
    
    if (!hasAcknowledged) {
      const checkScreenSize = () => {
        const isDesktop = window.innerWidth >= 1024;
        setIsOpen(!isDesktop);
      };

      checkScreenSize();
    }
  }, []);

  const handleAcknowledge = () => {
    localStorage.setItem(desktopWarningAckKey, 'true');
    setIsOpen(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50 fixed inset-0" />
        <Dialog.Content className="text-center fixed top-1/2 left-1/2 max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded bg-white p-5  focus:outline-none">
          <Dialog.Title className="text-xl">
            Desktop Recommended
          </Dialog.Title>
          <Dialog.Description className="mt-[10px] mb-5 text-[15px] leading-normal">
            <p>This application is built mainly for desktop use and has not been tested on smaller screens yet.</p>
          </Dialog.Description>
          <div className="mt-[25px] flex justify-end">
            <Dialog.Close asChild>
              <Button className='px-1 py-0 text-black bg-white border-black rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50'
                onClick={handleAcknowledge}
              >
                OK
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Close asChild>
            <button className="text-violet11 hover:bg-violet4 focus:shadow-violet7 absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
              aria-label="Close"
            >
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default DesktopWarningModal;