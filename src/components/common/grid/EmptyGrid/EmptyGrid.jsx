import React from 'react';
import PropTypes from 'prop-types';

import Grid from '../Grid';

class EmptyGrid extends React.Component {
  constructor(props) {
    super(props);
    this._ref = null;
    this._resizeObserver = null;
    this.state = { height: 0 };
  }

  getHeight = () => {
    if (this._ref && this._ref.offsetHeight > 0) {
      return this._ref.offsetHeight + this.props.diff;
    }

    return 0;
  };

  setRef = ref => {
    if (!ref) {
      this.disconnectObserver();
      return;
    }

    this._ref = ref;

    const height = this.getHeight();

    if (height) {
      this.setState({ height });
      return;
    }

    this.observeUntilVisible();
  };

  observeUntilVisible = () => {
    if (this._resizeObserver || typeof ResizeObserver === 'undefined' || !this._ref) {
      return;
    }

    this._resizeObserver = new ResizeObserver(() => {
      const height = this.getHeight();

      if (height) {
        this.disconnectObserver();
        this.setState({ height });
      }
    });

    this._resizeObserver.observe(this._ref);
  };

  disconnectObserver = () => {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.maxItems !== this.props.maxItems) {
      this.setState({ height: 0 });
    } else if (this.state.height === undefined) {
      this.setState({ height: this.getHeight() });
    }
  }

  componentWillUnmount() {
    this.disconnectObserver();
  }

  getChild = height => {
    return React.Children.map(this.props.children, child => {
      return React.cloneElement(child, {
        minHeight: height
      });
    });
  };

  render() {
    const { maxItems, minHeight, maxHeight } = this.props;
    const { height } = this.state;
    const fakeData = Array.from(Array(maxItems), (e, i) => ({ id: i }));

    if (height) {
      return this.getChild(height);
    }

    return (
      <div ref={this.setRef} style={{ height: height || 'auto', minHeight, maxHeight }}>
        <Grid data={fakeData} columns={[{ dataField: '_', text: ' ' }]} className="ecos-grid_transparent" scrollable={false} />
      </div>
    );
  }
}

EmptyGrid.propTypes = {
  maxItems: PropTypes.number,
  diff: PropTypes.number,
  children: PropTypes.object
};

EmptyGrid.defaultProps = {
  diff: 10
};

export default EmptyGrid;
