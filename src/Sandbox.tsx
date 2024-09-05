import { ControlType, ControlUpdateMessage, ControlValue, ControllerDescriptor } from "./types/types";

interface SandboxWindow extends Window {
  _sandbox_internals: {
    id: string;
    runId: string;
    controller: ControllerDescriptor;
    loop: (shouldLoop: boolean) => void;
    draw: () => void;
  }
  control: () => void;
}

declare let window: SandboxWindow;

type SandboxControl = {
  value: number | boolean | string,
  type: ControlType,
  min?: number,
  max?: number,
  step?: number,
  options?: string[],
  onChange?: (value: ControlValue) => void,
  onTrigger?: () => void,
}

type SandboxController = {
  [key: string]: SandboxControl,
}

type SandboxControlRelaxed = Omit<SandboxControl, 'type'> & {
  type?: ControlType;
};

type SandboxControllerRelaxed = {
  [key: string]: SandboxControlRelaxed,
}

export const SandboxMessageType = {
  CONSOLE_LOG: "console-log",
  CODE_EXECUTED: "code-executed",
  CONTROLLER_REGISTRATION: "controller-registration",
  CONTROLLER_UPDATE: "controller-update",
  EVAL: "eval",
}

function controls(newSBController: SandboxControllerRelaxed) {
  const InternalMessageType: typeof SandboxMessageType = {
    CONSOLE_LOG: "console-log",
    CODE_EXECUTED: "code-executed",
    CONTROLLER_REGISTRATION: "controller-registration",
    CONTROLLER_UPDATE: "controller-update",
    EVAL: "eval",
  }


  function matchToInputType(control: SandboxControlRelaxed): ControlType {
    if (control.type) return control.type;

    if (typeof control.value === 'string') {
      if (/^#[0-9A-Fa-f]{3,6}$/.test(control.value)) {
        return 'color';
      }
      if (control.options && control.options.includes(control.value)) {
        return 'select';
      }
      return 'text';
    }

    if (typeof control.value === 'boolean') {
      return 'checkbox';
    }

    if (typeof control.value === 'number') {
      if (control.min !== undefined && control.max !== undefined) {
        return 'range';
      }

      /** TODO */    // return 'number';
    }

    if (control.onTrigger) {
      return 'button';
    }

    throw new Error("Unable to determine control type");
  }

  /**
   * should set current values from running controller state
   */
  const sandboxController: SandboxController = Object.fromEntries(
    Object.entries(newSBController).map(([key, control]) => [key, {
      ...control,
      type: matchToInputType(control),
    }]
    ));

  const registeredController: ControllerDescriptor = Object.fromEntries(
    Object.entries(sandboxController).map(
      ([key, control]) => [key, {
        initialValue: control.value,
        currentValue: control.value,
        type: control.type,
        min: control.min,
        max: control.max,
        step: control.step,
        options: control.options
      }]
    )
  )

  Object.entries(sandboxController).forEach(([key, controlDesc]) => {
    const foundControl = (window as SandboxWindow)._sandbox_internals.controller[key];
    //TODO make sure the existing control state is valid for the new definition. 
    //(sanitize values before applying)
    const previousValue = foundControl?.currentValue;
     // TODO validate against new control schema
    const previousValueIsValid = previousValue != null && previousValue != undefined;
    const newValue = previousValueIsValid ? previousValue : controlDesc.value;
    sandboxController[key].value = newValue;
    registeredController[key].currentValue = newValue;
  })

  function handleControllerUpdate(update: ControlUpdateMessage) {
    const { source, value } = update;
    const control = sandboxController[source];

    if (!control) { return; }

    // update value ref
    control.value = value;
    
    if (control.type === 'button') {
      control.onTrigger?.();
    } else {
      control.onChange?.(value);
    }

    window._sandbox_internals.draw();
  }

  window.addEventListener('message', function (event) {
    if (event.data.type === InternalMessageType.CONTROLLER_UPDATE) {
      handleControllerUpdate(event.data as ControlUpdateMessage);
      return;
    }
  });

  window.parent.postMessage({
    type: InternalMessageType.CONTROLLER_REGISTRATION,
    sandboxId: window._sandbox_internals.id,
    runId: window._sandbox_internals.runId,
    content: { ...registeredController }
  }, '*');

  return sandboxController;
}

function interceptConsole(console: Console, sandboxId: string, runId: string) {
  const InternalMessageType: typeof SandboxMessageType = {
    CONSOLE_LOG: "console-log",
    CODE_EXECUTED: "code-executed",
    CONTROLLER_REGISTRATION: "controller-registration",
    CONTROLLER_UPDATE: "controller-update",
    EVAL: "eval",
  }

  const methodsToIntercept: (keyof Console)[] = ['log', 'info', 'warn', 'debug', 'error']

  methodsToIntercept.forEach(method => {
    console[method] = (...args) => {
      window.parent.postMessage({
        type: InternalMessageType.CONSOLE_LOG,
        sandboxId,
        runId,
        method,
        content: args
      }, '*');
    }
  })

  window.addEventListener("error", (event) => {
    event.preventDefault();

    window.parent.postMessage({
      type: InternalMessageType.CONSOLE_LOG,
      sandboxId,
      runId,
      method: 'unhandled_error',
      content: [event.message],
    }, '*');
  });

  window.addEventListener("unhandledrejection", (event) => {
    event.preventDefault();

    window.parent.postMessage({
      type: InternalMessageType.CONSOLE_LOG,
      sandboxId,
      runId,
      method: 'unhandled_error',
      content: [event.reason],
    }, '*');
  });
}

// This needs to be a function without external dependencies 
// besides the window context in which it will be run.
// It expects the window object to be extended with the 
// necessary dependencies as declared in ~global~.
// This function is injected into the iframe sandbox by converting it
// to string (controls.toString()) and then evaluated as a <script/>
function initScript() {
  const InternalMessageType: typeof SandboxMessageType = {
    CONSOLE_LOG: "console-log",
    CODE_EXECUTED: "code-executed",
    CONTROLLER_REGISTRATION: "controller-registration",
    CONTROLLER_UPDATE: "controller-update",
    EVAL: "eval",
  }

  window.addEventListener('message', function (event) {
    if (event.data.type === InternalMessageType.EVAL) {
      eval(event.data.expression);
      return;
    }
  });
}

export const getIframeSourceTemplate = (runId: string, code: string, data: any, controllerState: any) => {
  const encodedControllerState = encodeURIComponent(JSON.stringify((controllerState || {})));

  const src = `<html>
  <head>
    <style>
      html, body {
        margin: 0;
        padding: 0;
      }
      canvas {
        display: block;
      }
    </style>
    <script defer src="./libs/p5.min.js"></script>
    <script defer>
      (${interceptConsole.toString()})(window.console, "${data.id}", "${runId}")
    </script>
    <script defer>
      window._sandbox_internals = {
        id: "${data.id}",
        runId: "${runId}",
        controller: JSON.parse(
          decodeURIComponent("${encodedControllerState}")
        ),
        loop: (shouldLoop) => {
          if(shouldLoop && !isLooping()){
            loop()
          } else {
            noLoop()
          }
        },
        draw: () => {
          if (!isLooping()) {
            redraw();
          }
        }
      };
    </script>
    <script defer>
      (${initScript.toString()})()
    </script>
    <script defer>{
      window.p5lab = {
        controls: ${controls.toString()}
      }
    }</script>
    <script defer>
      function windowResized() {
        resizeCanvas(Math.round(windowWidth), Math.round(windowHeight))
      }
    </script>
    <script defer>
      ${code}
    </script>
    <script>
      if (window.setup) {
        const original = window.setup
        window.setup = () => { 
          original(); 
          if(${!data.loop}) {
            noLoop();
          }
        }
      }
    </script>
    <script defer>
      window.parent.postMessage({type: '${SandboxMessageType.CODE_EXECUTED}', sandboxId: "${data.id}", runId: "${runId}"}, '*');
    </script>
  </head>
  <body style="padding: 0; margin: 0;">
  </body>
</html>
`
  return src
}