import React from 'react';
import PropTypes from 'prop-types';

import { t } from '../../helpers/util';
import { MenuTypesView } from '../../constants/menu';
import { MenuLayoutItem } from '../Layout';

import './style.scss';

class Location extends React.Component {
  static propTypes = {
    selectedType: PropTypes.string,
    setData: PropTypes.func
  };

  static defaultProps = {
    selectedType: ''
  };

  handleClickMenu = menu => {
    const { selectedType, setData } = this.props;

    if (selectedType !== menu.type) {
      setData({ selectedType: menu.type });
    }
  };

  render() {
    const { selectedType } = this.props;

    return (
      <>
        <h5 className="ecos-menu-settings__title">{t(Labels.TITLE_LOCATION)}</h5>
        <div className="ecos-menu-settings-location__group">
          {MenuTypesView.map(menu => (
            <MenuLayoutItem
              key={`${menu.position}-${menu.type}`}
              onClick={this.handleClickMenu.bind(this, menu)}
              active={selectedType === menu.type}
              config={{ menu }}
              description={t(menu.description)}
              className="ecos-menu-settings-location__group-item"
            />
          ))}
        </div>
      </>
    );
  }
}

export default Location;
