import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as queryString from 'query-string';
import get from 'lodash/get';

import { t } from '../../helpers/util';
import { PointsLoader, Tooltip } from '../common';
import { SortableElement } from '../Drag-n-Drop';
import Records from '../Records';

class Tab extends Component {
  static propTypes = {
    tab: PropTypes.object,
    countTabs: PropTypes.number,
    position: PropTypes.number,

    onClick: PropTypes.func,
    onClose: PropTypes.func,
    onMouseUp: PropTypes.func,
    onSortEnd: PropTypes.func,
    runUpdate: PropTypes.func
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

  componentDidMount() {
    const link = get(this.props, 'tab.link', null);
    const recordRef = get(queryString.parseUrl(link), 'query.recordRef', null);

    if (recordRef) {
      this.instanceRecord = Records.get(recordRef);
      this.watcher = this.instanceRecord && this.instanceRecord.watch(['name'], this.updateTab);
    }
  }

  componentWillUnmount() {
    this.watcher && this.instanceRecord.unwatch(this.watcher);
  }

  updateTab = () => {
    this.props.runUpdate(this.props.tab);
  };

  handleClickTab = () => {
    this.props.onClick(this.props.tab);
  };

  handleMouseUp = event => {
    const isWheelButton = get(event, 'nativeEvent.button', 0) === 1;

    this.props.onMouseUp(this.props.tab, isWheelButton);
  };

  handleContextMenu = event => {
    const { tab, position, onContextMenu } = this.props;

    if (typeof onContextMenu !== 'function') {
      return;
    }

    event.preventDefault();

    onContextMenu({ tab, position, x: event.clientX, y: event.clientY, ctrlKey: event.ctrlKey, shiftKey: event.shiftKey });
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

    return <div className="page-tab__tabs-item-close icon-small-close" onClick={this.handleCloseTab} />;
  }

  render() {
    const { tab, position, onSortEnd } = this.props;

    return (
      <SortableElement key={tab.id} index={position} onSortEnd={onSortEnd}>
        <Tooltip
          target={tab.id}
          text={t(tab.title)}
          uncontrolled
          placement="bottom"
          hideArrow
          autohide
          minWidthByContent
          innerClassName="page-tab__tabs-item-tooltip"
        >
          <div
            id={tab.id}
            key={tab.id}
            className={classNames('page-tab__tabs-item', {
              'page-tab__tabs-item_active': tab.isActive,
              'page-tab__tabs-item_disabled': tab.isLoading
            })}
            onClick={this.handleClickTab}
            onMouseUp={this.handleMouseUp}
            onContextMenu={this.handleContextMenu}
          >
            <span className="page-tab__tabs-item-title">
              {this.renderLoader()}
              {t(tab.title)}
            </span>

            {this.renderCloseButton()}
          </div>
        </Tooltip>
      </SortableElement>
    );
  }
}

export default Tab;
