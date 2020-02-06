import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { PointsLoader } from '../common';
import { t } from '../../helpers/util';
import { SortableElement } from '../Drag-n-Drop';
import get from 'lodash/get';

class Tab extends React.Component {
  static propTypes = {
    item: PropTypes.object,
    isLoadingTitle: PropTypes.bool,
    countTabs: PropTypes.number,
    position: PropTypes.number,

    onClick: PropTypes.func,
    onClose: PropTypes.func,
    onMouseUp: PropTypes.func,
    onSortEnd: PropTypes.func
  };

  static defaultProps = {
    item: {},
    isLoadingTitle: false,
    countTabs: 0,
    position: 0,

    onClick: () => null,
    onClose: () => null,
    onMouseUp: () => null,
    onSortEnd: () => null
  };

  // shouldComponentUpdate(nextProps, nextState, nextContext) {
  //   const { item, countTabs, isLoadingTitle, position } = this.props;
  //   let needUpdate = false;
  //
  //   if (
  //     nextProps.item.id !== item.id ||
  //     nextProps.item.isActive !== item.isActive ||
  //     nextProps.item.title !== item.title ||
  //     (countTabs < 2 && nextProps.countTabs > 2) ||
  //     (countTabs > 2 && nextProps.countTabs < 2) ||
  //     // isLoadingTitle !== nextProps.isLoadingTitle ||
  //     position !== nextProps.position
  //   ) {
  //     needUpdate = true;
  //   }
  //
  //   return needUpdate;
  // }

  handleClickTab = () => {
    this.props.onClick(this.props.item);
  };

  handleMouseUp = event => {
    const isWheelButton = get(event, 'nativeEvent.button', 0) === 1;

    this.props.onMouseUp(this.props.item.id, isWheelButton);
  };

  handleCloseTab = event => {
    event.stopPropagation();
    this.props.onClose(this.props.item.id);
  };

  renderLoader() {
    const { item, isLoadingTitle } = this.props;

    if (!item.isLoading && !isLoadingTitle) {
      return null;
    }

    return <PointsLoader className="page-tab__tabs-item-title-loader" color="light-blue" />;
  }

  renderCloseButton() {
    const { countTabs } = this.props;

    if (countTabs < 2) {
      return null;
    }

    return <div className="page-tab__tabs-item-close icon-close" onClick={this.handleCloseTab} />;
  }

  render() {
    const { item, isLoadingTitle, position, onSortEnd } = this.props;

    return (
      <SortableElement key={item.id} index={position} onSortEnd={onSortEnd}>
        <div
          key={item.id}
          className={classNames('page-tab__tabs-item', {
            'page-tab__tabs-item_active': item.isActive,
            'page-tab__tabs-item_disabled': isLoadingTitle
          })}
          title={t(item.title)}
          onClick={this.handleClickTab}
          onMouseUp={this.handleMouseUp}
        >
          <span className="page-tab__tabs-item-title">
            {this.renderLoader()}
            {t(item.title)}
          </span>

          {this.renderCloseButton()}
        </div>
      </SortableElement>
    );
  }
}

export default Tab;
