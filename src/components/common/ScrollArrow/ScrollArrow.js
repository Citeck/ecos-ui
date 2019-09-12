import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { get, isEmpty, set } from 'lodash';
import { IcoBtn } from '../btns';

import './style.scss';

export default class ScrollArrow extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    step: PropTypes.number,
    medium: PropTypes.bool,
    small: PropTypes.bool,
    updateWhenDataChange: PropTypes.bool,
    scrollToEnd: PropTypes.bool,
    scrollToSide: PropTypes.oneOf([0, -1, 1])
  };

  static defaultProps = {
    className: '',
    step: 190,
    medium: false,
    small: false,
    scrollToEnd: false,
    scrollToSide: 0
  };

  refScroll = React.createRef();

  state = {
    isShowArrows: false,
    isActiveLeft: false,
    isActiveRight: true
  };

  componentWillReceiveProps(nextProps, nextContext) {
    const { scrollToEnd, scrollToSide } = this.props;

    if (!scrollToEnd && nextProps.scrollToEnd) {
      const width = get(this.refScroll, 'current.scrollWidth', 0);

      set(this.refScroll, 'current.scrollLeft', width);
    }

    if (nextProps.scrollToSide !== 0 && scrollToSide !== nextProps.scrollToSide) {
      this.doScroll(nextProps.scrollToSide);
    }
  }

  componentDidMount() {
    this.checkArrows();
  }

  componentDidUpdate() {
    this.checkArrows();
  }

  doScroll = (factor = 1) => {
    const curScroll = get(this.refScroll, 'current.scrollLeft', 0);

    set(this.refScroll, 'current.scrollLeft', curScroll + this.props.step * factor);
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

  render() {
    const { className, children, small, medium } = this.props;
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
            onClick={() => this.doScroll(-1)}
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
          <div className="ecos-scrollbar-arrow__child">{children}</div>
        </div>
        {isShowArrows && (
          <IcoBtn
            className={classNames('ecos-scrollbar-arrow__btn', 'ecos-btn_white ecos-btn_hover_blue2 ecos-btn_circle', {
              'ecos-btn_disabled': !isActiveRight,
              'ecos-scrollbar-arrow__btn_medium': medium,
              'ecos-scrollbar-arrow__btn_small': small
            })}
            icon="icon-right"
            onClick={() => this.doScroll()}
          />
        )}
      </div>
    );
  }
}
