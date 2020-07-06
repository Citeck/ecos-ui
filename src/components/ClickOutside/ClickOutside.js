import React from 'react';
import PropTypes from 'prop-types';

export default class ClickOutside extends React.Component {
  static propTypes = {
    handleClickOutside: PropTypes.func,
    className: PropTypes.string,
    type: PropTypes.string,
    excludeElements: PropTypes.array
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
    const { handleClickOutside, excludeElements } = this.props;

    if (
      typeof handleClickOutside === 'function' &&
      this.wrapperRef &&
      !this.wrapperRef.contains(event.target) &&
      (!Array.isArray(excludeElements) || excludeElements.some(elm => !(elm && elm.contains(event.target))))
    ) {
      handleClickOutside(event);
    }
  }

  render() {
    const { handleClickOutside, className, children, excludeElements, ...props } = this.props;

    return (
      <div className={className} ref={this.setWrapperRef} {...props}>
        {children}
      </div>
    );
  }
}
