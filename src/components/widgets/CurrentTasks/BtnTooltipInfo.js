import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { UncontrolledTooltip } from 'reactstrap';
import { Scrollbars } from 'react-custom-scrollbars';

import { Icon } from '../../common';
import ClickOutside from '../../ClickOutside';

import './style.scss';
import { cleanTaskId } from './utils';

export default class BtnTooltipInfo extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    iconClass: PropTypes.string.isRequired,
    isActive: PropTypes.bool,
    isShow: PropTypes.bool,
    noTooltip: PropTypes.bool,
    minHeight: PropTypes.string,
    text: PropTypes.string,
    count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    handleClick: PropTypes.func
  };

  static defaultProps = {
    isShow: true,
    minHeight: '',
    handleClick: () => null
  };

  openTooltip = () => {
    if (this.props.noTooltip) {
      this.props.handleClick(true);
    }
  };

  closeTooltip = () => {
    if (this.props.noTooltip) {
      this.props.handleClick(false);
    }
  };

  renderContent() {
    const { text, children } = this.props;

    return <div className="ecos-current-task__tooltip-text-inner">{text || children}</div>;
  }

  render() {
    const { id, iconClass, isShow, noTooltip, text, children, count, isActive } = this.props;
    const domId = cleanTaskId(`ecos-current-task-${id}`);

    if (!isShow || (!text && !children)) {
      return null;
    }

    return (
      <>
        <ClickOutside
          id={domId}
          key={`tooltip-info-click-outside=${domId}`}
          handleClickOutside={this.closeTooltip}
          className={classNames('ecos-current-task__tooltip-btn', { 'ecos-current-task__tooltip-btn_active': isActive })}
        >
          {count && <span className="ecos-current-task__tooltip-count">{count}</span>}
          <Icon
            className={classNames('ecos-current-task__tooltip-icon', iconClass)}
            onClick={isActive ? this.closeTooltip : this.openTooltip}
          />
        </ClickOutside>
        {!noTooltip && (
          <UncontrolledTooltip
            key={`task-info-tooltip-${domId}`}
            placement="top"
            boundariesElement="window"
            target={domId}
            trigger="hover"
            delay={{ show: 0, hide: 200 }}
            autohide={false}
            className="ecos-base-tooltip ecos-current-task__tooltip"
            innerClassName="ecos-base-tooltip-inner"
            arrowClassName="ecos-base-tooltip-arrow"
          >
            <div className="ecos-current-task__tooltip-text">
              <Scrollbars
                autoHeight
                autoHeightMin={20}
                autoHeightMax={145}
                renderTrackVertical={props => <div {...props} className="ecos-current-task__tooltip__v-scroll" />}
                renderTrackHorizontal={props => <div {...props} hidden />}
                renderThumbHorizontal={props => <div {...props} hidden />}
              >
                {this.renderContent()}
              </Scrollbars>
            </div>
          </UncontrolledTooltip>
        )}
      </>
    );
  }
}
