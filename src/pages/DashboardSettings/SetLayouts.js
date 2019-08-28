import React from 'react';
import PropTypes from 'prop-types';
import { t } from '../../helpers/util';
import { Layouts } from '../../constants/dashboard';
import { ColumnsLayoutItem } from '../../components/Layout';

import './style.scss';

class SetLayouts extends React.Component {
  static propTypes = {
    activeLayout: PropTypes.string,
    setData: PropTypes.func
  };

  static defaultProps = {
    activeLayout: '',
    setData: () => {}
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

    return Layouts.map(layout => (
      <ColumnsLayoutItem
        key={`${layout.position}-${layout.type}`}
        onClick={this.handleClickColumn.bind(this, layout)}
        active={layout.type === activeLayout}
        config={{ columns: layout.columns || [] }}
        className="ecos-dashboard-settings__container-group-item"
      />
    ));
  }

  render() {
    return (
      <React.Fragment>
        <h5 className="ecos-dashboard-settings__container-title">{t('dashboard-settings.columns.title')}</h5>
        <h6 className="ecos-dashboard-settings__container-subtitle">{t('dashboard-settings.columns.subtitle')}</h6>
        <div className="ecos-dashboard-settings__container-group">{this.renderColumnLayouts()}</div>
      </React.Fragment>
    );
  }
}

export default SetLayouts;
