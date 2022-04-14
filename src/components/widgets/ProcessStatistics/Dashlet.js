import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { getStateId } from '../../../helpers/redux';
import { t } from '../../../helpers/export/util';
import { MAX_DEFAULT_HEIGHT_DASHLET } from '../../../constants';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';
import Journal from './Journal';
import Model from './Model';

export default class extends BaseWidget {
  static propTypes = {
    id: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNameContent: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  };

  static defaultProps = {
    classNameContent: '',
    classNameDashlet: ''
  };

  constructor(props) {
    super(props);

    this.stateId = getStateId(props);
  }

  render() {
    const { title, config, classNameContent, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, runUpdate } = this.state;

    return (
      <Dashlet
        title={title || t('process-statistics-widget.title')}
        className={classNames('ecos-process-statistics-dashlet', classNameDashlet)}
        bodyClassName="ecos-process-statistics-dashlet__body"
        resizable={true}
        noActions
        needGoTo={false}
        canDragging={canDragging}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        setRef={this.setDashletRef}
      >
        <div className="ecos-process-statistics__header" />
        <div className="ecos-process-statistics__scheme">
          <Model record={record} />
        </div>
        <div className="ecos-process-statistics__journal">
          <Journal
            {...config}
            forwardedRef={this.contentRef}
            className={classNames(classNameContent)}
            record={record}
            stateId={this.stateId}
            isSmallMode={isSmallMode}
            runUpdate={runUpdate}
            maxHeight={MAX_DEFAULT_HEIGHT_DASHLET - this.otherHeight}
          />
        </div>
      </Dashlet>
    );
  }
}
