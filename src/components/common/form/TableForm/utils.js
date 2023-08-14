export const getAllComponents = components => {
  const getComponents = component => {
    if (component.columns) {
      return getAllComponents(component.columns);
    }

    if (component.components) {
      return getAllComponents(component.components);
    }

    return component;
  };

  return components.reduce((result, component) => result.concat(getComponents(component)), []);
};
