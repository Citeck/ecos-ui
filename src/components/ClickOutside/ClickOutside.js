import React from 'react';

export default class ClickOutside extends React.Component {
  constructor(props) {
    super(props);

    this.setWrapperRef = this.setWrapperRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  setWrapperRef(node) {
    this.wrapperRef = node;
  }

  handleClickOutside(event) {
    if (typeof this.props.handleClickOutside === 'function' && this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      this.props.handleClickOutside();
    }
  }

  render() {
    return (
      <div className={this.props.className} ref={this.setWrapperRef}>
        {this.props.children}
      </div>
    );
  }
}
