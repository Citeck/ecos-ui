import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { t } from '../../../helpers/util';
import { Icon } from '../';

import './style.scss';

export default class ResizableBox extends React.Component {
  static propTypes = {
    resizable: PropTypes.bool,
    classNameBox: PropTypes.string,
    classNameResizer: PropTypes.string,
    getHeight: PropTypes.func
  };

  static defaultProps = {
    resizable: false,
    classNameBox: '',
    classNameResizer: '',
    getHeight: () => null
  };

  state = {
    resizing: false
  };

  refBox = React.createRef();
  resizeButtonRef = React.createRef();

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
      const delta = event.pageY - box.getBoundingClientRect().bottom;
      let height = currentH + delta;

      if (this.resizeButtonRef.current) {
        height -= this.resizeButtonRef.current.offsetHeight / 2;
      }

      getHeight(height);
    }
  };

  stopResize = () => {
    const { resizing } = this.state;

    window.removeEventListener('mousemove', this.doResize);
    window.removeEventListener('mouseup', this.stopResize);

    if (resizing) {
      this.setState({ resizing: false });
    }
  };

  render() {
    const { classNameBox, classNameResizer, children, resizable } = this.props;

    return (
      <React.Fragment>
        <div ref={this.refBox} className={classNames('ecos-resize__container', classNameBox)}>
          {children}
        </div>
        <div className={classNames('ecos-resize__bottom', classNameResizer)}>
          {resizable && (
            <div ref={this.resizeButtonRef} className="ecos-resize__control">
              <Icon className="icon-resize" title={t('dashlet.resize.title')} onMouseDown={this.startResize} />
            </div>
          )}
        </div>
      </React.Fragment>
    );
  }
}
