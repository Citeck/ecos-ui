import React, { Component, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { EventEmitter2 } from 'eventemitter2';
import { usePopper } from 'react-popper';
import ReactResizeDetector from 'react-resize-detector';
import get from 'lodash/get';
import debounce from 'lodash/debounce';

const Events = {
  SHOW: 'ecos-popover-show',
  HIDE: 'ecos-popover-hide'
};

export const emitter = new EventEmitter2();

export default class Popper extends Component {
  static propTypes = {
    text: PropTypes.string,
    icon: PropTypes.string,
    contentComponent: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node])
  };

  static defaultProps = {
    text: '',
    icon: 'icon-question'
  };

  #iconRef = null;
  #textRef = null;

  state = {
    needTooltip: false
  };

  componentDidMount() {
    this.checkNeedShowPopper();
  }

  componentWillUnmount() {
    this.handleResize.cancel();
  }

  get needPopper() {
    const { text, contentComponent } = this.props;

    return text || contentComponent;
  }

  checkNeedShowPopper = () => {
    const { text } = this.props;
    const element = this.#textRef;

    if (!element) {
      this.state.needTooltip && this.setState({ needTooltip: false });

      return;
    }

    if (!text) {
      return;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const styles = window.getComputedStyle(element, null);
    const paddingLeft = parseInt(styles.getPropertyValue('padding-left'), 10) || 0;
    const paddingRight = parseInt(styles.getPropertyValue('padding-right'), 10) || 0;

    context.font = styles.getPropertyValue('font');

    let fullWidth = Math.round(context.measureText(text.trim()).width);
    let elementWidth = Math.round(element.getBoundingClientRect().width);

    if (isNaN(fullWidth)) {
      fullWidth = 0;
    }

    if (isNaN(elementWidth)) {
      elementWidth = 0;
    }

    const needTooltip = fullWidth > elementWidth - (paddingLeft + paddingRight);

    this.setState({ needTooltip });
  };

  setIconRef = ref => {
    if (ref) {
      this.#iconRef = ref;
    }
  };

  setTextRef = ref => {
    if (ref) {
      this.#textRef = ref;
      this.checkNeedShowPopper();
    }
  };

  handleMouseOut = () => {
    emitter.emit(Events.HIDE);
  };

  handleMouseEnter = () => {
    const { text, contentComponent } = this.props;

    emitter.emit(Events.SHOW, this.#iconRef, contentComponent || text);
  };

  handleResize = debounce(() => {
    this.checkNeedShowPopper();
  }, 350);

  renderText = () => {
    const { text, contentComponent, children, id } = this.props;

    return (
      <div ref={this.setTextRef} className="ecos-popper__text" id={id}>
        {children || text || contentComponent}
      </div>
    );
  };

  render() {
    const { icon } = this.props;
    const { needTooltip } = this.state;

    if (!this.needPopper) {
      return null;
    }

    return (
      <ReactResizeDetector handleWidth onResize={this.handleResize}>
        <div className="ecos-popper">
          {this.renderText()}
          {needTooltip && (
            <i
              ref={this.setIconRef}
              className={classNames('icon', icon, 'ecos-popper__icon')}
              hidden={false}
              onMouseEnter={this.handleMouseEnter}
              onMouseOut={this.handleMouseOut}
            />
          )}
        </div>
      </ReactResizeDetector>
    );
  }
}

export const Popup = () => {
  const [referenceElement, setReferenceElement] = useState(null);
  const [text, setText] = useState('');
  const [popperElement, setPopperElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'top',
    modifiers: [
      {
        name: 'arrow',
        options: { element: arrowElement }
      }
    ]
  });

  useEffect(() => {
    const onShow = (element, text) => {
      setReferenceElement(element);
      setText(text);
    };
    const onHide = () => {
      setReferenceElement(null);
      setText('');
    };

    emitter.on(Events.SHOW, onShow);
    emitter.on(Events.HIDE, onHide);

    return () => {
      emitter.off(Events.SHOW, onShow);
      emitter.off(Events.HIDE, onHide);
    };
  }, []);

  return (
    <div
      ref={setPopperElement}
      style={{ ...styles.popper, display: text ? 'unset' : 'none' }}
      {...attributes.popper}
      className={classNames('ecos-popup', get(attributes, 'popper.className', ''))}
    >
      {text}
      <div ref={setArrowElement} style={styles.arrow} />
    </div>
  );
};
