import * as React from 'react';
import PropTypes from 'prop-types';
import { get, set } from 'lodash';
import { IcoBtn } from '../btns';

import './style.scss';

export default class ScrollArrow extends React.Component {
  static propTypes = {
    step: PropTypes.number,
    scrollToRight: PropTypes.bool
  };

  static defaultProps = {
    step: 190,
    scrollToRight: false
  };

  refScroll = React.createRef();
  refChild = React.createRef();

  componentWillReceiveProps(nextProps, nextContext) {
    if (!this.props.scrollToRight && nextProps.scrollToRight) {
      const wTabs = get(this.refChild, 'current.scrollWidth', 0);

      set(this.refScroll, 'current.scrollLeft', wTabs);
    }
  }

  get isShowBtnScroll() {
    const wScroll = get(this.refScroll, 'current.offsetWidth', 0);
    const wTabs = get(this.refChild, 'current.scrollWidth', 0);

    return wScroll < wTabs;
  }

  doScroll = (factor = 1) => {
    const curScroll = get(this.refScroll, 'current.scrollLeft', 0);

    set(this.refScroll, 'current.scrollLeft', curScroll + this.props.step * factor);
  };

  render() {
    const { children } = this.props;

    return (
      <div className="ecos-scrollbar-arrow">
        {this.isShowBtnScroll && (
          <IcoBtn
            icon="icon-left"
            className="ecos-scrollbar-arrow__btn-prev ecos-btn_blue2 ecos-btn_hover_blue2 ecos-btn_circle"
            onClick={() => this.doScroll(-1)}
          />
        )}
        <div className="ecos-scrollbar-arrow__scroll" ref={this.refScroll}>
          <div className="ecos-scrollbar-arrow__child" ref={this.refChild}>
            {children}
          </div>
        </div>
        {this.isShowBtnScroll && <div className="ecos-scrollbar-arrow__btn-next_right-gradient" />}
        {this.isShowBtnScroll && (
          <IcoBtn
            icon="icon-right"
            className="ecos-scrollbar-arrow__btn-next ecos-btn_blue2 ecos-btn_hover_blue2 ecos-btn_circle"
            onClick={() => this.doScroll()}
          />
        )}
      </div>
    );
  }
}
