import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { performAction } from '../../../actions/slideMenu';

class ItemBtn extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    data: PropTypes.object
  };

  static defaultProps = {
    className: '',
    data: {}
  };

  clickHandler = e => {
    const { data, performAction } = this.props;

    performAction(data);
    e.stopPropagation();
  };

  render() {
    const { children } = this.props;

    return (
      <div onClick={this.clickHandler} className="ecos-sidebar-item__link">
        {children}
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  performAction: data => dispatch(performAction(data))
});

export default connect(
  null,
  mapDispatchToProps
)(ItemBtn);
