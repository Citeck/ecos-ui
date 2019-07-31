import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { t } from '../../../helpers/util';
import { Icon } from '../';

import './style.scss';

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
    resizing: false
  };

  className = 'ecos-resize';

  refBox = React.createRef();

  startResize = event => {
    event.preventDefault();

    this.setState({ resizing: true });

    window.addEventListener('mousemove', this.doResize);
    window.addEventListener('mouseup', this.stopResize);
  };

  doResize = event => {
    const { resizing } = this.state;
    const { getHeight } = this.props;

    if (resizing) {
      const box = this.refBox.current || {};
      const currentH = box.offsetHeight || 0;
      const height = currentH + (event.pageY - box.getBoundingClientRect().bottom);

      getHeight(height);
    }
  };

  stopResize = event => {
    const { resizing } = this.state;

    window.removeEventListener('mousemove', this.doResize);

    if (resizing) {
      this.setState({ resizing: false });
    }
  };

  render() {
    const { className, children, resizable } = this.props;

    return (
      <React.Fragment>
        <div ref={this.refBox} className={classNames(`${this.className}__container`, className)}>
          {children}
        </div>
        <div className={classNames(`${this.className}__bottom`)}>
          {resizable && (
            <div className={classNames(`${this.className}__control`)}>
              <Icon className={'icon-resize'} title={t('dashlet.resize.title')} onMouseDown={this.startResize} />
            </div>
          )}
        </div>
      </React.Fragment>
    );
  }
}
