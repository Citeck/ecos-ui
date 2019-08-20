import * as React from 'react';
import PropTypes from 'prop-types';
import { get, set } from 'lodash';
import { IcoBtn } from '../btns';

import './style.scss';

export default class ScrollArrow extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    step: PropTypes.number,
    scrollToRight: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    step: 190,
    scrollToRight: false
  };

  refScroll = React.createRef();
  refChild = React.createRef();

  state = {
    isShowBtnScroll: false
  };

  componentWillReceiveProps(nextProps, nextContext) {
    const { scrollToRight, updateScroll } = this.props;

    if (!scrollToRight && nextProps.scrollToRight) {
      const wTabs = get(this.refChild, 'current.scrollWidth', 0);

      set(this.refScroll, 'current.scrollLeft', wTabs);
    }
  }

  componentDidMount(prevProps) {
    this.checkSize();
  }

  doScroll = (factor = 1) => {
    const curScroll = get(this.refScroll, 'current.scrollLeft', 0);

    set(this.refScroll, 'current.scrollLeft', curScroll + this.props.step * factor);
  };

  checkSize = () => {
    const { isShowBtnScroll: old } = this.state;
    const wScroll = get(this.refScroll, 'current.offsetWidth', 0);
    const wChild = get(this.refChild, 'current.scrollWidth', 0);
    const isShowBtnScroll = parseInt(wScroll) < parseInt(wChild);

    if (isShowBtnScroll !== old) {
      this.setState({ isShowBtnScroll });
    }
  };

  render() {
    const { className, children } = this.props;
    const { isShowBtnScroll } = this.state;

    return (
      <div className={`ecos-scrollbar-arrow ${className}`}>
        {isShowBtnScroll && (
          <div className="ecos-scrollbar-arrow__btns-gradient">
            <IcoBtn icon="icon-left" className="ecos-btn_white ecos-btn_hover_blue2 ecos-btn_circle" onClick={() => this.doScroll(-1)} />
          </div>
        )}
        <div className="ecos-scrollbar-arrow__scroll" ref={this.refScroll}>
          <div className="ecos-scrollbar-arrow__child" ref={this.refChild}>
            {children}
          </div>
        </div>
        {isShowBtnScroll && (
          <div className="ecos-scrollbar-arrow__btns-gradient ecos-scrollbar-arrow__btns-gradient_next">
            <IcoBtn icon="icon-right" className="ecos-btn_white ecos-btn_hover_blue2 ecos-btn_circle" onClick={() => this.doScroll()} />
          </div>
        )}
      </div>
    );
  }
}
