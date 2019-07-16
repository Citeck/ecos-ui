import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import queryString from 'query-string/index';
import { t } from '../../../../../helpers/util';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../../../../constants/pageTabs';
import handleControl from '../../../../../helpers/handleControl';
import { getIconClassMenu, getSpecialClassByState } from '../../../../Header/utils';

const mapDispatchToProps = dispatch => ({
  dispatch
});

class DropdownMenuItem extends React.Component {
  static propTypes = {
    key: PropTypes.string,
    data: PropTypes.PropTypes.shape({
      id: PropTypes.string,
      targetUrl: PropTypes.string,
      label: PropTypes.string,
      target: PropTypes.string,
      control: PropTypes.object
    }).isRequired,
    dispatch: PropTypes.func,
    onClick: PropTypes.func
  };

  static defaultProps = {
    data: {}
  };

  get iconClass() {
    const { id, targetUrl } = this.props.data || {};

    const paramsUrl = queryString.parse(targetUrl);
    const iconSpecialClass = getSpecialClassByState(id, paramsUrl);

    return `ecos-header-dropdown__icon ${getIconClassMenu(id, iconSpecialClass)}`;
  }

  handlerClick = () => {
    const {
      data,
      data: { control },
      dispatch,
      onClick
    } = this.props;

    let handler = () => {};

    if (control && control.type) {
      handler = event => {
        event.preventDefault();
        handleControl(control.type, control.payload, dispatch);
      };
    } else if (onClick) {
      handler = event => {
        event.preventDefault();
        onClick(data);
      };
    }

    return handler;
  };

  render() {
    const { data } = this.props;
    const { id, targetUrl, label, target } = data;

    return (
      <li>
        <a href={targetUrl} target={target} id={id} onClick={this.handlerClick} {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}>
          <i className={this.iconClass} />
          {label && t(label)}
        </a>
      </li>
    );
  }
}

export default connect(
  null,
  mapDispatchToProps
)(DropdownMenuItem);
