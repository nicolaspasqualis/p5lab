export type ControllerDescriptor = {
  [key: string]: ControlDescriptor
}

export type ControlType = 'range' | 'checkbox' | 'color' | 'select' | 'button' | 'text';
export type ControlValue = number | boolean | string;

// i can think about two types of controllers; ones for state and ones for 
// trigger/events like buttons, metronome, react to messages, etc
// hmm might be better to think in terms of more generic inputs-outputs
// ! separate interfaces for each type

export interface ControlDescriptor {
  initialValue: ControlValue,
  currentValue: ControlValue,
  type: ControlType,
  min?: number,
  max?: number,
  step?: number,
  options?: string[];
}


export interface ControlUpdateMessage {
  source: string,
  value: number;
}