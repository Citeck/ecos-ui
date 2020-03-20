import React from 'react';
import PropTypes from 'prop-types';

export default class ClickOutside extends React.Component {
  static propTypes = {
    handleClickOutside: PropTypes.func,
    className: PropTypes.string,
    type: PropTypes.string
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
    if (typeof this.props.handleClickOutside === 'function' && this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      this.props.handleClickOutside(event);
    }
  }

  render() {
    const { handleClickOutside, className, children, ...props } = this.props;

    return (
      <div className={className} ref={this.setWrapperRef} {...props}>
        {children}
      </div>
    );
  }
}
