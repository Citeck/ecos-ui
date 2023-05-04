export const __components = {};

export const getComponents = () => ({ ...__components });

export const addToComponents = (key, component) => {
  __components[key] = component;
};

export const removeFromComponents = key => {
  delete __components[key];
};
