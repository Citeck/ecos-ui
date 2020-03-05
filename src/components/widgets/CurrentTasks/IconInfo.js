import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Tooltip } from 'reactstrap';
import { Scrollbars } from 'react-custom-scrollbars';

import { Icon } from '../../common/index';
import ClickOutside from '../../ClickOutside/index';

import './style.scss';

export default class IconInfo extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    iconClass: PropTypes.string.isRequired,
    isShow: PropTypes.bool,
    noTooltip: PropTypes.bool,
    minHeight: PropTypes.string,
    text: PropTypes.string,
    handleClick: PropTypes.func
  };

  static defaultProps = {
    isShow: true,
    noTooltip: false,
    minHeight: '',
    handleClick: () => {}
  };

  state = {
    isOpen: false
  };

  setTooltipOpen = () => {
    this.setState(
      state => ({ isOpen: !state.isOpen }),
      () => {
        if (this.props.noTooltip) {
          this.props.handleClick(this.state.isOpen);
        }
      }
    );
  };

  closeTooltip = () => {
    this.setState({ isOpen: false }, () => {
      if (this.props.noTooltip) {
        this.props.handleClick(false);
      }
    });
  };

  renderContent() {
    const { text, children } = this.props;

    if (text) {
      return <div className="ecos-current-task__tooltip-text-inner">{text}</div>;
    }

    return <div className="ecos-current-task__tooltip-text-inner">{children}</div>;
  }

  render() {
    const { id, iconClass, isShow, noTooltip, text, children } = this.props;
    const { isOpen } = this.state;
    const domId = `ecos-current-task-${id}`;

    if (!isShow || (!text && !children)) {
      return null;
    }

    return (
      <>
        <ClickOutside key={`icon-info-outside=${domId}`} handleClickOutside={this.closeTooltip} className="ecos-current-task__icon-wrap">
          <Icon
            id={domId}
            className={classNames('ecos-current-task__icon', iconClass, {
              'ecos-current-task__icon_open': isOpen
            })}
            onClick={this.setTooltipOpen}
          />
        </ClickOutside>
        {!noTooltip && (
          <Tooltip
            key={`icon-info-tooltip-${domId}`}
            placement="top"
            boundariesElement="window"
            target={domId}
            isOpen={isOpen}
            trigger="hover"
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
          </Tooltip>
        )}
      </>
    );
  }
}
