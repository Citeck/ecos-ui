import React, { Component } from 'react';
import { getId } from '../../helpers/util';

const XXS = 376;
const XS = 476;
const SM = 576;
const MD = 768;
const LG = 992;
const XL = 1200;

const xxxs = w => w < XXS;
const xxs = w => w >= XXS && w < XS;
const xs = w => w >= XS && w < SM;
const sm = w => w >= SM && w < MD;
const md = w => w >= MD && w < LG;
const lg = w => w >= LG && w < XL;
const xl = w => w >= XL;

export default class Measurer extends Component {
  _ref = React.createRef();

  state = { show: false };

  measurer = {
    width: 0,
    xxxs: false,
    xxs: false,
    xs: false,
    sm: false,
    md: false,
    lg: false,
    xl: false
  };

  componentDidMount() {
    this.doMeasure();
    window.addEventListener('resize', this.doMeasure, false);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.doMeasure, false);
  }

  doMeasure = () => {
    const dom = this._ref.current;

    if (dom) {
      const width = dom.offsetWidth;

      this.measurer.width = width;

      this.measurer.xxxs = xxxs(width);
      this.measurer.xxs = xxs(width);
      this.measurer.xs = xs(width);
      this.measurer.sm = sm(width);
      this.measurer.md = md(width);
      this.measurer.lg = lg(width);
      this.measurer.xl = xl(width);
    }

    this.setState({ show: true });
  };

  render() {
    const { className, children } = this.props;

    return (
      <div key={getId()} style={{ width: '100%' }} ref={this._ref} className={className}>
        {this.state.show && children ? React.cloneElement(children, { measurer: this.measurer }) : null}
      </div>
    );
  }
}
