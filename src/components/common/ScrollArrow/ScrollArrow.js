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
  _factor = 0;

  state = {
    isShowArrows: false,
    isActiveLeft: false,
    isActiveRight: true,
    prevWidth: 0,
    scrollLeft: 0
  };

  componentDidMount() {
    this.checkArrows();

    window.addEventListener('resize', this.checkArrowsDebounced);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.checkArrowsDebounced);
  }

  componentDidUpdate(prevProps, prevState) {
    const { scrollToSide, scrollToEnd, updateWhenDataChange } = this.props;
    const { scrollLeft, isShowArrows } = this.state;

    if (scrollLeft !== prevState.scrollLeft) {
      set(this.refScroll, 'current.scrollLeft', scrollLeft);
      this.checkArrows();
    }

    if (scrollToSide !== 0 && prevProps.scrollToSide !== scrollToSide) {
      this.doScrollBySide(scrollToSide);
    }

    if (!prevProps.scrollToEnd && scrollToEnd) {
      const scrollWidth = get(this.refScroll, 'current.scrollWidth', 0);
      const width = get(this.refScroll, 'current.offsetWidth', 0);

      this.setState({ scrollLeft: scrollWidth - width });
    }

    if (updateWhenDataChange && !prevProps.updateWhenDataChange) {
      const scroll = get(this.refScroll, 'current.scrollLeft', 0);

      this.setState({ scrollLeft: scroll });
      set(this.refScroll, 'current.scrollLeft', scroll);
      this.checkArrows();
    }

    if (scrollLeft > get(this.refScroll, 'current.scrollWidth', 0)) {
      this.setState({ scrollLeft: get(this.refScroll, 'current.scrollLeft', 0) });
    }

    if (!prevState.isShowArrows && isShowArrows && scrollLeft) {
      this.setState({ scrollLeft: scrollLeft + 100 });
    }
  }

  doScrollBySide = (factor = 1) => {
    this._factor += factor;

    this.refScroll.current.scrollLeft += this.props.step * this._factor;
    this.debounceScrollBySide();
  };

  debounceScrollBySide = debounce(() => {
    const step = this.props.step * this._factor;

    this._factor = 0;
    this.doScrollByStep(step);
  }, 10);

  doScrollByStep = step => {
    const curScroll = get(this.refScroll, 'current.scrollLeft', 0);

    this.setState({ scrollLeft: curScroll + step });

    set(this.refScroll, 'current.scrollLeft', curScroll + step);
    this.checkArrows();
  };

  checkArrows = () => {
    const { isShowArrows: oldShow, isActiveRight: oldRight, isActiveLeft: oldLeft, scrollLeft } = this.state;
    const { offsetWidth, scrollWidth } = get(this.refScroll, 'current', {});

    const state = {};
    const isShowArrows = scrollWidth > offsetWidth;
    const isActiveRight = isShowArrows && scrollWidth > offsetWidth + scrollLeft;
    const isActiveLeft = isShowArrows && scrollLeft > 0;

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

  checkArrowsDebounced = debounce(this.checkArrows, 100);

  onResize = debounce(w => {
    const { changeScrollPosition } = this.props;
    const { prevWidth } = this.state;
    const scrollWidth = get(this.refScroll, 'current.scrollWidth', 0);
    const width = get(this.refScroll, 'current.offsetWidth', 0);
    const diff = Math.ceil(w - prevWidth);

    if (changeScrollPosition && diff > 0 && scrollWidth > width) {
      this.doScrollByStep(diff);
    }

    this.setState({ prevWidth: w });
  }, 300);

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

          <ReactResizeDetector handleWidth handleHeight onResize={this.checkArrowsDebounced} />
        </div>
        {isShowArrows && (
          <IcoBtn
            className={classNames('ecos-scrollbar-arrow__btn', 'ecos-btn_white ecos-btn_hover_blue2 ecos-btn_circle', {
              'ecos-btn_disabled': !isActiveRight,
              'ecos-scrollbar-arrow__btn_medium': medium,
              'ecos-scrollbar-arrow__btn_small': small
            })}
            icon="icon-small-right"
            onClick={() => this.doScrollBySide()}
          />
        )}
      </div>
    );
  }
}
