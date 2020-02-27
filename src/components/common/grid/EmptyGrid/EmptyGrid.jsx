import React from 'react';
import PropTypes from 'prop-types';

import { Grid } from '../';

class EmptyGrid extends React.Component {
  constructor(props) {
    super(props);
    this._ref = React.createRef();
    this.state = { height: 0 };
  }

  getHeight = () => {
    if (this._ref.current) {
      return (this._ref.current || {}).offsetHeight + this.props.diff;
    }

    return 0;
  };

  componentDidMount() {
    this.setState({ height: this.getHeight() });
  }

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
    const { maxItems } = this.props;
    const { height } = this.state;
    const fakeData = Array.from(Array(maxItems), (e, i) => ({ id: i }));

    return maxItems ? (
      <div ref={this._ref} style={{ height: height || 'auto' }}>
        {height ? (
          this.getChild(height)
        ) : (
          <Grid data={fakeData} columns={[{ dataField: '_', text: ' ' }]} className="ecos-grid_transparent" scrollable={false} />
        )}
      </div>
    ) : (
      this.getChild(height)
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
