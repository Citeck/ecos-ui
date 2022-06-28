import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { isSmallMode, t } from '../../../helpers/util';
import { getStateId } from '../../../helpers/redux';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';
import Actions from './Actions';

import './style.scss';

class ActionsDashlet extends BaseWidget {
  static propTypes = {
    id: PropTypes.string,
    record: PropTypes.string,
    title: PropTypes.string,
    classNameContent: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.object,
    dragHandleProps: PropTypes.object,
    canDragging: PropTypes.bool,
    maxHeightByContent: PropTypes.bool
  };

  static defaultProps = {
    classNameContent: '',
    classNameDashlet: '',
    dragHandleProps: {},
    canDragging: false,
    maxHeightByContent: false
  };

  constructor(props) {
    super(props);

    this.stateId = getStateId(props);

    this.state = {
      ...this.state,
      isSmallMode: false
    };
    this.observableFieldsToUpdate = [...new Set([...this.observableFieldsToUpdate, 'caseStatus', 'idocs:documentStatus'])];
  }

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  render() {
    const { title, config, classNameDashlet, classNameContent, record, dragHandleProps, canDragging, tabId, isActiveLayout } = this.props;
    const { isSmallMode, runUpdate } = this.state;

    return (
      <Dashlet
        title={title || t('records-actions.actions')}
        bodyClassName="ecos-actions-dashlet__body"
        className={classNames('ecos-actions-dashlet', classNameDashlet)}
        resizable={true}
        contentMaxHeight={this.clientHeight}
        noActions
        needGoTo={false}
        canDragging={canDragging}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onResize={this.onResize}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        setRef={this.setDashletRef}
      >
        <Actions
          {...config}
          forwardedRef={this.contentRef}
          record={record}
          tabId={tabId}
          stateId={this.stateId}
          className={classNameContent}
          isSmallMode={isSmallMode}
          runUpdate={runUpdate}
          isActiveLayout={isActiveLayout}
          scrollbarProps={this.scrollbarProps}
        />
      </Dashlet>
    );
  }
}

export default ActionsDashlet;
