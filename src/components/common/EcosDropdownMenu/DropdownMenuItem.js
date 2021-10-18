import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import get from 'lodash/get';

import { extractLabel } from '../../../helpers/util';
import { getIconClassMenu, getSpecialClassByState } from '../../../helpers/menu';
import handleControl from '../../../helpers/handleControl';
import { getSearchParams, isNewVersionPage, SearchKeys } from '../../../helpers/urls';
import { URL } from '../../../constants';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../../constants/pageTabs';
import pageTabList from '../../../services/pageTabs/PageTabList';

const mapStateToProps = state => ({
  dashboardId: get(state, `dashboard[${pageTabList.activeTabId}].identification.id`, '')
});

class DropdownMenuItem extends React.Component {
  static propTypes = {
    key: PropTypes.string,
    data: PropTypes.shape({
      id: PropTypes.string,
      img: PropTypes.string,
      targetUrl: PropTypes.string,
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      target: PropTypes.string,
      control: PropTypes.object
    }).isRequired,
    onClick: PropTypes.func,
    iconRight: PropTypes.string,
    dashboardId: PropTypes.string
  };

  static defaultProps = {
    data: {},
    iconRight: ''
  };

  get iconLeft() {
    const { id, targetUrl, control } = this.props.data || {};
    const paramsUrl = queryString.parse(targetUrl);
    const iconSpecialClass = getSpecialClassByState(id, {
      ...paramsUrl,
      available: get(control, 'payload.isAvailable')
    });
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

  get label() {
    const label = get(this.props, 'data.label');
    return extractLabel(label);
  }

  handlerClick = event => {
    if (this.url) {
      return;
    }

    const {
      data,
      data: { control, isLegacy, id },
      dashboardId,
      onClick
    } = this.props;

    if (control && control.type) {
      event.preventDefault();
      handleControl(control.type, control.payload);
    } else if (!isLegacy && onClick) {
      event.preventDefault();

      if (id === 'SETTINGS_DASHBOARD') {
        onClick({ ...data, dashboardId, updateDashboard: true });

        return;
      }

      onClick(data);
    }
  };

  renderImg() {
    const { data } = this.props;
    const { img } = data;

    return <img className="ecos-dropdown-menu__img" src={get(this.props, 'data.img')} alt={this.label} />;
  }

  render() {
    const { data, iconRight } = this.props;
    const { id, img, target, disabled } = data;
    const extra = {};

    if (!isNewVersionPage(this.url)) {
      extra[IGNORE_TABS_HANDLER_ATTR_NAME] = true;
    }

    return (
      <li className="ecos-dropdown-menu__item">
        <a href={this.url} target={target} id={id} onClick={this.handlerClick} {...extra} disabled={disabled}>
          {this.iconLeft && <i className={this.iconLeft} />}
          {img && this.renderImg()}
          {this.label}
          {iconRight && <i className={iconRight} />}
        </a>
      </li>
    );
  }
}

export default connect(mapStateToProps)(DropdownMenuItem);
