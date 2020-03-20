import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

export default class ClickOutside extends React.Component {
  static propTypes = {
    handleClickOutside: PropTypes.func,
    className: PropTypes.string,
    type: PropTypes.string,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })])
  };

  static defaultProps = {
    className: '',
    type: 'mousedown'
  };

  constructor(props) {
    super(props);

    this.setWrapperRef = this.setWrapperRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  componentDidMount() {
    document.addEventListener(this.props.type, this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener(this.props.type, this.handleClickOutside);
  }

  setWrapperRef(node) {
    this.wrapperRef = node;
  }

  handleClickOutside(event) {
    const ref = get(this.props, 'forwardedRef.current', this.wrapperRef);

    if (typeof this.props.handleClickOutside === 'function' && ref && !ref.contains(event.target)) {
      this.props.handleClickOutside(event);
    }
  }

  render() {
    const { handleClickOutside, className, children, forwardedRef, ...props } = this.props;

    return (
      <div className={className} ref={forwardedRef || this.setWrapperRef} {...props}>
        {children}
      </div>
    );
  }
}
