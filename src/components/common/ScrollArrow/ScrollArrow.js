import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import set from 'lodash/set';
import debounce from 'lodash/debounce';
import ReactResizeDetector from 'react-resize-detector';

import { IcoBtn } from '../btns';

import './style.scss';

export default class ScrollArrow extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    selectorToObserve: PropTypes.string,
    step: PropTypes.number,
    medium: PropTypes.bool,
    small: PropTypes.bool,
    updateWhenDataChange: PropTypes.bool,
    scrollToEnd: PropTypes.bool,
    scrollToSide: PropTypes.oneOf([0, -1, 1]),
    changeScrollPosition: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    step: 190,
    medium: false,
    small: false,
    scrollToEnd: false,
    changeScrollPosition: true,
    scrollToSide: 0
  };

  refScroll = React.createRef();

  state = {
    isShowArrows: false,
    isActiveLeft: false,
    isActiveRight: true,
    prevWidth: 0
  };

  componentWillReceiveProps(nextProps, nextContext) {
    const { scrollToEnd, scrollToSide } = this.props;

    if (!scrollToEnd && nextProps.scrollToEnd) {
      const width = get(this.refScroll, 'current.scrollWidth', 0);

      set(this.refScroll, 'current.scrollLeft', width);
    }

    if (nextProps.scrollToSide !== 0 && scrollToSide !== nextProps.scrollToSide) {
      this.doScrollBySide(nextProps.scrollToSide);
    }
  }

  componentDidMount() {
    this.checkArrows();
  }

  componentDidUpdate() {
    this.checkArrows();
  }

  doScrollBySide = (factor = 1) => {
    const step = this.props.step * factor;

    this.doScrollByStep(step);
  };

  doScrollByStep = step => {
    const curScroll = get(this.refScroll, 'current.scrollLeft', 0);

    if (this.refScroll.current) {
      this.refScroll.current.scrollTo({ left: curScroll + step, behavior: 'smooth' });
    }

    // set(this.refScroll, 'current.scrollLeft', curScroll + step);
    this.checkArrows();
  };

  checkArrows = () => {
    const { isShowArrows: oldShow, isActiveRight: oldRight, isActiveLeft: oldLeft } = this.state;
    const { offsetWidth, scrollWidth, scrollLeft } = get(this.refScroll, 'current', {});

    const state = {};
    const isShowArrows = scrollWidth > offsetWidth;
    const isActiveRight = scrollWidth > offsetWidth + scrollLeft;
    const isActiveLeft = scrollLeft > 0;

    if (isShowArrows !== oldShow) {
      state.isShowArrows = isShowArrows;
    }

    if (isActiveRight !== oldRight) {
      state.isActiveRight = isActiveRight;
    }

    if (isActiveLeft !== oldLeft) {
      state.isActiveLeft = isActiveLeft;
    }

    if (!isEmpty(state)) {
      this.setState(state);
    }
  };

  onResize = w => {
    const { changeScrollPosition } = this.props;
    const { prevWidth } = this.state;
    const widthBtn = 40;
    // const diff = w - prevWidth + widthBtn;
    const diff = Math.ceil(w - prevWidth);

    if (diff > 0 && prevWidth && changeScrollPosition) {
      this.doScrollByStep(diff);
    }

    this.setState({ prevWidth: w });
  };

  render() {
    const { className, children, small, medium, selectorToObserve } = this.props;
    const { isShowArrows, isActiveLeft, isActiveRight } = this.state;

    return (
      <div className={classNames('ecos-scrollbar-arrow', className)}>
        {isShowArrows && (
          <IcoBtn
            className={classNames('ecos-scrollbar-arrow__btn', 'ecos-btn_white ecos-btn_hover_blue2 ecos-btn_circle', {
              'ecos-btn_disabled': !isActiveLeft,
              'ecos-scrollbar-arrow__btn_medium': medium,
              'ecos-scrollbar-arrow__btn_small': small
            })}
            icon="icon-left"
            onClick={() => this.doScrollBySide(-1)}
          />
        )}
        <div
          ref={this.refScroll}
          className={classNames('ecos-scrollbar-arrow__scroll', {
            'ecos-scrollbar-arrow__scroll_intend-left': isActiveLeft,
            'ecos-scrollbar-arrow__scroll_intend-right': isActiveRight,
            'ecos-scrollbar-arrow__scroll_medium': medium,
            'ecos-scrollbar-arrow__scroll_small': small
          })}
        >
          <div className="ecos-scrollbar-arrow__child">
            {children}
            {selectorToObserve && <ReactResizeDetector handleWidth onResize={this.onResize} querySelector={selectorToObserve} />}
          </div>
        </div>
        {isShowArrows && (
          <IcoBtn
            className={classNames('ecos-scrollbar-arrow__btn', 'ecos-btn_white ecos-btn_hover_blue2 ecos-btn_circle', {
              'ecos-btn_disabled': !isActiveRight,
              'ecos-scrollbar-arrow__btn_medium': medium,
              'ecos-scrollbar-arrow__btn_small': small
            })}
            icon="icon-right"
            onClick={() => this.doScrollBySide()}
          />
        )}
      </div>
    );
  }
}
