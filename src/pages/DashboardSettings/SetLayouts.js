import React from 'react';
import PropTypes from 'prop-types';
import { t } from '../../helpers/util';
import { Layouts } from '../../constants/dashboard';
import { LayoutItem } from '../../components/Layout';

import './style.scss';

class SetLayouts extends React.Component {
  static propTypes = {
    activeLayout: PropTypes.string,
    setData: PropTypes.func,
    isMobile: PropTypes.bool
  };

  static defaultProps = {
    activeLayout: '',
    setData: () => {},
    isMobile: false
  };

  handleClickColumn = layout => {
    const { activeLayout, setData } = this.props;

    if (activeLayout === layout.type) {
      return;
    }

    setData(layout);
  };

  renderColumnLayouts() {
    const { activeLayout } = this.props;

    return Layouts.filter(item => !item.excluded).map(layout => (
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
        <h5 className="ecos-dashboard-settings__container-title">{t('dashboard-settings.columns.title')}</h5>
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
