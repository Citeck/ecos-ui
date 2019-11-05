import React from 'react';
import throttle from 'lodash/throttle';

export default class EcosModalHeight extends React.Component {
  state = { height: 0 };

  _ref = React.createRef();

  componentDidMount() {
    window.addEventListener('resize', this.getHeightThrottled);

    this.calculateHeight();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.getHeightThrottled);
  }

  updateHeight = height => this.setState({ height });

  getHeightThrottled = () => throttle(this.calculateHeight, 300);

  calculateHeight = () => {
    const currentElement = this._ref.current;

    if (currentElement) {
      const modalElement = currentElement.closest('.ecos-modal');

      if (modalElement) {
        let height = document.documentElement.clientHeight - 200;
        const modalLevel = parseInt(modalElement.dataset.level, 10);

        if (modalLevel > 0 && modalLevel < 5) {
          const modalLevelOffset = 60;
          height -= modalLevel * modalLevelOffset - modalLevelOffset;
        }

        currentElement.closest('.tab-content') && (height -= 62);

        this.updateHeight(height);
      }
    }
  };

  render() {
    return <div ref={this._ref}>{this.props.children(this.state.height)}</div>;
  }
}
