import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { t } from '../../../helpers/util';
import { Icon } from '../';

import './style.scss';
import ClickOutside from '../../ClickOutside';

export default class ResizableBox extends React.Component {
  static propTypes = {
    resizable: PropTypes.bool,
    className: PropTypes.string,
    getHeight: PropTypes.func
  };

  static defaultProps = {
    resizable: false,
    className: '',
    getHeight: () => null
  };

  state = {
    resizing: false,
    initPosition: 0
  };

  className = 'ecos-resize';

  refBox = React.createRef();

  startResize = event => {
    this.setState({
      resizing: true,
      initPosition: event.clientY
    });
  };

  doResize = event => {
    const { resizing, initPosition } = this.state;
    const { getHeight } = this.props;

    if (resizing) {
      const box = this.refBox.current || {};
      const currentH = box.offsetHeight || 0;
      const resizerH = (box.querySelector(`.${this.className}__bottom`) || {}).offsetHeight || 0;
      const height = currentH + (event.clientY - initPosition);

      this.setState({ height });
      getHeight(height - resizerH);
    }
  };

  stopResize = event => {
    const { resizing } = this.state;

    if (resizing) {
      this.setState({
        resizing: false,
        height: null
      });
    }
  };

  render() {
    const { className, children, resizable } = this.props;
    const { height } = this.state;
    const style = {};

    if (height) style.height = height;

    return (
      <div className={classNames(`${this.className}__container`, className)} ref={this.refBox} style={style}>
        {children}
        <div className={classNames(`${this.className}__bottom`, className)}>
          {resizable && (
            <div className={classNames(`${this.className}__control`)}>
              <ClickOutside handleClickOutside={this.stopResize}>
                <Icon
                  className={'icon-resize'}
                  title={t('dashlet.resize.title')}
                  onMouseDown={this.startResize}
                  onMouseMove={this.doResize}
                  onMouseLeave={this.stopResize}
                  onMouseUp={this.stopResize}
                />
              </ClickOutside>
            </div>
          )}
        </div>
      </div>
    );
  }
}
