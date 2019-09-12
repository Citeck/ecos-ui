import React from 'react';

export default class PageHeight extends React.Component {
  state = { height: 0 };

  _ref = React.createRef();

  componentDidUpdate() {
    this.calculateHeight();
  }

  updateHeight = height => this.setState({ height });

  calculateHeight = () => {
    const currentElement = this._ref.current;

    if (currentElement) {
      const parent = currentElement.parentNode;

      if (parent) {
        const parentHeight = parent.clientHeight;

        let nextHeight = 0;
        let next = currentElement.nextSibling;
        while (next) {
          nextHeight = nextHeight + next.clientHeight;
          next = next.nextSibling;
        }

        let previousHeight = 0;
        let previous = currentElement.previousSibling;
        while (previous) {
          previousHeight = previousHeight + previous.clientHeight;
          previous = previous.previousSibling;
        }

        if (parentHeight && this.state.height === 0) {
          this.updateHeight(parentHeight - previousHeight - nextHeight - 1);
        }
      }
    }
  };

  render() {
    return <div ref={this._ref}>{this.props.children(this.state.height)}</div>;
  }
}
