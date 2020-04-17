import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import queryString from 'query-string/index';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
import { getIconClassMenu, getSpecialClassByState } from '../../../helpers/menu';
import handleControl from '../../../helpers/handleControl';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../../constants/pageTabs';
import { URL } from '../../../constants';
import { getSearchParams, SearchKeys } from '../../../helpers/urls';
import pageTabList from '../../../services/pageTabs/PageTabList';

const mapStateToProps = state => ({
  dashboardId: get(state, `dashboard[${pageTabList.activeTabId}].identification.id`, '')
});
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
    iconRight: PropTypes.string,
    dashboardId: PropTypes.string
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

  get url() {
    const {
      data: { targetUrl = '' },
      dashboardId
    } = this.props;
    const { recordRef, dashboardKey } = getSearchParams();
    const params = [];
    let link = targetUrl;

    if (targetUrl === URL.DASHBOARD_SETTINGS) {
      if (dashboardId) {
        params.push(`${SearchKeys.DASHBOARD_ID}=${dashboardId}`);
      }

      if (recordRef) {
        params.push(`${SearchKeys.RECORD_REF}=${recordRef}`);
      }

      if (dashboardKey) {
        params.push(`${SearchKeys.DASHBOARD_KEY}=${dashboardKey}`);
      }

      link += `?${params.join('&')}`;
    }

    return link;
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
    const { id, img, label, target } = data;

    return (
      <li>
        <a href={this.url} target={target} id={id} onClick={this.handlerClick} {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}>
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
  mapStateToProps,
  mapDispatchToProps
)(DropdownMenuItem);
