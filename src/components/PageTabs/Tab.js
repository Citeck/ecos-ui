import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { PointsLoader } from '../common';
import { t } from '../../helpers/util';
import { SortableElement } from '../Drag-n-Drop';
import get from 'lodash/get';

class Tab extends Component {
  static propTypes = {
    tab: PropTypes.object,
    countTabs: PropTypes.number,
    position: PropTypes.number,

    onClick: PropTypes.func,
    onClose: PropTypes.func,
    onMouseUp: PropTypes.func,
    onSortEnd: PropTypes.func
  };

  static defaultProps = {
    tab: {},
    countTabs: 0,
    position: 0,

    onClick: () => null,
    onClose: () => null,
    onMouseUp: () => null,
    onSortEnd: () => null
  };

  handleClickTab = () => {
    this.props.onClick(this.props.tab);
  };

  handleMouseUp = event => {
    const isWheelButton = get(event, 'nativeEvent.button', 0) === 1;

    this.props.onMouseUp(this.props.tab, isWheelButton);
  };

  handleCloseTab = event => {
    event.stopPropagation();
    this.props.onClose(this.props.tab);
  };

  renderLoader() {
    const { tab } = this.props;

    if (tab.isLoading) {
      return <PointsLoader className="page-tab__tabs-item-title-loader" color="light-blue" />;
    }

    return null;
  }

  renderCloseButton() {
    const { countTabs } = this.props;

    if (countTabs < 2) {
      return null;
    }

    return <div className="page-tab__tabs-item-close icon-close" onClick={this.handleCloseTab} />;
  }

  render() {
    const { tab, position, onSortEnd } = this.props;

    return (
      <SortableElement key={tab.id} index={position} onSortEnd={onSortEnd}>
        <div
          key={tab.id}
          className={classNames('page-tab__tabs-item', {
            'page-tab__tabs-item_active': tab.isActive,
            'page-tab__tabs-item_disabled': tab.isLoading
          })}
          title={t(tab.title)}
          onClick={this.handleClickTab}
          onMouseUp={this.handleMouseUp}
        >
          <span className="page-tab__tabs-item-title">
            {this.renderLoader()}
            {t(tab.title)}
          </span>

          {this.renderCloseButton()}
        </div>
      </SortableElement>
    );
  }
}

export default Tab;
