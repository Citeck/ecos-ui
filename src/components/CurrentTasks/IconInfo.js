import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Tooltip } from 'reactstrap';
import { Scrollbars } from 'react-custom-scrollbars';
import Icon from '../common/icons/Icon/Icon';
import ClickOutside from '../ClickOutside';

import './style.scss';
import '../../bootstrap.scss';

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

  className = 'ecos-current-task';

  setTooltipOpen = () => {
    this.setState({ isOpen: !this.state.isOpen }, () => {
      if (this.props.noTooltip) {
        this.props.handleClick(this.state.isOpen);
      }
    });
  };

  closeTooltip = () => {
    this.setState({ isOpen: false }, () => {
      if (this.props.noTooltip) {
        this.props.handleClick(false);
      }
    });
  };

  render() {
    const { id, iconClass, isShow, noTooltip, text } = this.props;
    const { isOpen } = this.state;
    const domId = `${this.className}-${id}`;
    const icon = `${this.className}__icon`;
    const tooltip = `${this.className}__tooltip`;
    const renderTrackVertical = props => <div {...props} className={`${tooltip}__v-scroll`} />;

    return isShow ? (
      <React.Fragment>
        <ClickOutside handleClickOutside={this.closeTooltip}>
          <Icon
            id={domId}
            className={classNames(icon, iconClass, { [`${icon}_open`]: isOpen, [`${icon}_big`]: noTooltip })}
            onClick={this.setTooltipOpen}
          />
        </ClickOutside>
        {!noTooltip && (
          <Tooltip
            placement="top"
            boundariesElement="window"
            target={domId}
            isOpen={isOpen}
            trigger={'click'}
            className={`ecos-base-tooltip ${tooltip}`}
            innerClassName={`ecos-base-tooltip-inner`}
            arrowClassName={`ecos-base-tooltip-arrow`}
          >
            <div className={`${tooltip}-text`}>
              <Scrollbars autoHeight autoHeightMin={20} autoHeightMax={145} renderTrackVertical={renderTrackVertical}>
                {text}
              </Scrollbars>
            </div>
          </Tooltip>
        )}
      </React.Fragment>
    ) : null;
  }
}
