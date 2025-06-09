export function wrapArgs<T>(stateId: string) {
  return (args: T): { _args: T; stateId: string } => ({ _args: args, stateId });
}

export function getStateId({ tabId = '', id = '' }) {
  return `[${tabId}]-[${id}]`;
}
