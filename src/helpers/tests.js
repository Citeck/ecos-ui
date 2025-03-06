import React, { cloneElement } from 'react';
import { render, fireEvent } from '@testing-library/react';
import isEmpty from 'lodash/isEmpty';

/**
 * A class that wraps RTL's render and supplies it with Enzyme-like methods
 * @class EnzymeWrapper
 * @param {node} Component - Component to be mounted
 * @method find - finds an element by string using querySelector
 * @method setProps - merges old props with new props and rerenders the Component
 * @method setSelection - sets additional properties and methods on a selection
 * @method simulate - simulates a fireEvent by type with passed in options
 * @returns {object} - an Enzyme-like wrapper
 */
class EnzymeWrapper {
  constructor(Component) {
    this.Component = Component;
    this.props = Component.props;
    this.wrapper = render(Component);
    this.find = this.find.bind(this);
    this.setProps = this.setProps.bind(this);

    return {
      ...this.wrapper,
      find: this.find,
      setProps: this.setProps,
    };
  }

  find(byString) {
    const elements = this.wrapper.container.querySelectorAll(byString);
    let selection = this.wrapper.container.querySelector(byString);

    selection = this.setSelection(elements, selection);

    return selection;
  }

  setProps(props) {
    this.props = { ...this.props, ...props };

    this.wrapper.rerender(cloneElement(this.Component, this.props));
  }

  setSelection(elements, selection) {
    selection.simulate = (eventType, opts) => this.simulate(selection, eventType, opts);
    selection.length = !isEmpty(elements) ? elements.length : 0;
    selection.exists = selection.length >= 1;
    selection.at = (pos) => {
      if (!elements || elements[pos] === undefined) throw Error('wrapper::at(): Unable to locate an element at that position.');

      let nextSelection = elements[pos];
      nextSelection = this.setSelection(nextSelection, nextSelection);

      return nextSelection;
    };

    return selection;
  }

  simulate(element, eventType, opts) {
    if (isEmpty(element)) {
      throw Error(`wrapper::simulate(): unable to locate any elements to simulate an event.`);
    }
    if (!eventType) {
      throw Error(`wrapper::simulate(): unable to call simulate without an event type.`);
    }

    fireEvent[eventType](element, opts);

    return element;
  }
}

/**
 * Factory function to initialize a RTL rendered React component with an Enzyme-like class
 * @function mount
 * @param {node} Component - Component to be mounted
 * @returns {object} - an Enzyme-like wrapper
 */
export const mount = (Component) => new EnzymeWrapper(Component);

export const mountWithContext = (Component, Context, contextValue) => {
  return render(
    <Context.Provider value={contextValue}>
      <Component />
    </Context.Provider>,
  );
};
