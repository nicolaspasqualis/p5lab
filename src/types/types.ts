export type Controller = {
  [key: string]: ControlDescriptor
}

type InputType = 'range' | 'checkbox' | 'color' | 'select';

// i can think about two types of controllers; ones for state and ones for 
// trigger/events like buttons, metronome, react to messages, etc
// hmm might be better to think in terms of more generic inputs-outputs
// ! separate interfaces for each type

export interface ControlDescriptor {
  initialValue: number | boolean | string,
  currentValue: number | boolean | string,
  type: InputType,
  min?: number,
  max?: number,
  step?: number,
  options?: string[];
}

export interface ControlUpdateMessage {
  source: string,
  value: number;
}