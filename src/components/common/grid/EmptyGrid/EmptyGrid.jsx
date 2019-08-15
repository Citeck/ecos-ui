import React, { Component } from 'react';
import { Grid } from '../';

export default class EmptyGrid extends Component {
  constructor(props) {
    super(props);
    this._ref = React.createRef();
    this.state = { height: 0 };
  }

  getHeight = () => {
    return (this._ref.current || {}).offsetHeight + (this.props.diff || 15);
  };

  componentDidMount() {
    this.setState({ height: this.getHeight() });
  }

  componentDidUpdate = prevProps => {
    if (prevProps.maxItems !== this.props.maxItems) {
      this.setState({ height: 0 });
    } else if (!this.state.height) {
      this.setState({ height: this.getHeight() });
    }
  };

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

    return maxItems ? (
      <div ref={this._ref} style={{ height: height || 'auto' }}>
        {height ? (
          this.getChild(height)
        ) : (
          <Grid
            data={Array.from(Array(maxItems), (e, i) => ({ id: i }))}
            columns={[{ dataField: '_', text: ' ' }]}
            className={'ecos-grid_transparent'}
            scrollable={false}
          />
        )}
      </div>
    ) : (
      this.getChild(height)
    );
  }
}
