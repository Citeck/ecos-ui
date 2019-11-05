import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import handleControl, { HandleControlTypes } from '../../../helpers/handleControl';

const mapDispatchToProps = dispatch => ({
  dispatch
});

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
    const { dispatch } = this.props;

    handleControl(HandleControlTypes.ALF_CREATE_SITE, null, dispatch);
    e.stopPropagation();
  };

  render() {
    const { children, data } = this.props;

    return (
      <div onClick={this.clickHandler} className="ecos-sidebar-item__link">
        {children}
      </div>
    );
  }
}

export default connect(
  null,
  mapDispatchToProps
)(ItemBtn);
