import React from 'react';
import PropTypes from 'prop-types';

import { Grid } from '../';

class EmptyGrid extends React.Component {
  constructor(props) {
    super(props);
    this._ref = null;
    this.state = { height: 0 };
  }

  getHeight = () => {
    if (this._ref) {
      return this._ref.offsetHeight + this.props.diff;
    }

    return 0;
  };

  setRef = ref => {
    if (!ref) {
      return;
    }

    this._ref = ref;

    this.setState({ height: ref.offsetHeight + this.props.diff });
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.maxItems !== this.props.maxItems) {
      this.setState({ height: 0 });
    } else if (this.state.height === undefined) {
      this.setState({ height: this.getHeight() });
    }
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
