import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import get from 'lodash/get';

import handleControl, { HandleControlTypes } from '../../../helpers/handleControl';
import { MenuSettings } from '../../../constants/menu';

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
    const { dispatch, data } = this.props;

    if (data.type === MenuSettings.ItemTypes.LINK_CREATE_CASE) {
      handleControl(HandleControlTypes.ECOS_CREATE_VARIANT, get(data, 'params.createVariant'), dispatch);
    } else {
      handleControl(HandleControlTypes.ALF_CREATE_SITE, null, dispatch);
    }

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

export default connect(
  null,
  mapDispatchToProps
)(ItemBtn);
