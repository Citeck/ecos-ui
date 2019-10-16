import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import queryString from 'query-string/index';
import { t } from '../../../helpers/util';
import { getIconClassMenu, getSpecialClassByState } from '../../../helpers/menu';
import handleControl from '../../../helpers/handleControl';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../../constants/pageTabs';

const mapDispatchToProps = dispatch => ({
  dispatch
});

class DropdownMenuItem extends React.Component {
  static propTypes = {
    key: PropTypes.string,
    data: PropTypes.PropTypes.shape({
      id: PropTypes.string,
      img: PropTypes.string,
      targetUrl: PropTypes.string,
      label: PropTypes.string,
      target: PropTypes.string,
      control: PropTypes.object
    }).isRequired,
    dispatch: PropTypes.func,
    onClick: PropTypes.func,
    iconRight: PropTypes.string
  };

  static defaultProps = {
    data: {},
    iconRight: ''
  };

  get iconLeft() {
    const { id, targetUrl } = this.props.data || {};

    const paramsUrl = queryString.parse(targetUrl);
    const iconSpecialClass = getSpecialClassByState(id, paramsUrl);
    const icon = getIconClassMenu(id, iconSpecialClass);

    return icon ? `ecos-dropdown-menu__icon ${icon}` : '';
  }

  handlerClick = event => {
    const {
      data,
      data: { control },
      dispatch,
      onClick
    } = this.props;

    if (control && control.type) {
      event.preventDefault();
      handleControl(control.type, control.payload, dispatch);
    } else if (onClick) {
      event.preventDefault();
      onClick(data);
    }
  };

  renderImg() {
    const { data } = this.props;
    const { img, label } = data;

    return <img className="ecos-dropdown-menu__img" src={img} alt={label} />;
  }

  render() {
    const { data, iconRight } = this.props;
    const { id, img, targetUrl, label, target } = data;

    return (
      <li>
        <a href={targetUrl} target={target} id={id} onClick={this.handlerClick} {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}>
          {this.iconLeft && <i className={this.iconLeft} />}
          {img && this.renderImg()}
          {label && t(label)}
          {iconRight && <i className={iconRight} />}
        </a>
      </li>
    );
  }
}

export default connect(
  null,
  mapDispatchToProps
)(DropdownMenuItem);
