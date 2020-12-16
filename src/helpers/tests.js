import React from 'react';
import { mount } from 'enzyme';

export const mountWithContext = (Component, Context, contextValue) => {
  return mount(<Component />, {
    wrappingComponent: Context.Provider,
    wrappingComponentProps: {
      value: contextValue
    }
  });
};
