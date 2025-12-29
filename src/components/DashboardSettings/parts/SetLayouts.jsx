import React from 'react';
import PropTypes from 'prop-types';

import { t } from '../../../helpers/util';
import { getLayouts } from '../../../helpers/layout';
import { LayoutItem } from '../../../components/Layout';

import '../style.scss';

class SetLayouts extends React.Component {
  static propTypes = {
    activeLayout: PropTypes.string,
    dashboardType: PropTypes.string,
    setData: PropTypes.func,
    isMobile: PropTypes.bool
  };

  static defaultProps = {
    activeLayout: '',
    dashboardType: '',
    setData: () => {},
    isMobile: false
  };

  get layouts() {
    const { dashboardType } = this.props;

    return getLayouts(dashboardType);
  }

  handleClickColumn = layout => {
    const { activeLayout, setData } = this.props;

    if (activeLayout === layout.type) {
      return;
    }

    setData(layout);
  };

  renderColumnLayouts() {
    const { activeLayout } = this.props;

    return this.layouts
      .filter(item => !item.excluded)
      .map(layout => (
        <LayoutItem
          key={`${layout.position}-${layout.type}`}
          onClick={this.handleClickColumn.bind(this, layout)}
          type={layout.type}
          active={layout.type === activeLayout}
          config={{ columns: layout.columns || [] }}
          className="ecos-dashboard-settings__container-group-item"
        />
      ));
  }

  render() {
    const { isMobile } = this.props;

    return (
      <>
        <h6 className="ecos-dashboard-settings__container-subtitle">
          {!isMobile && t('dashboard-settings.columns.subtitle')}
          {isMobile && t('dashboard-settings.columns.subtitle-mobile')}
        </h6>
        {!isMobile && <div className="ecos-dashboard-settings__container-group">{this.renderColumnLayouts()}</div>}
      </>
    );
  }
}

export default SetLayouts;
