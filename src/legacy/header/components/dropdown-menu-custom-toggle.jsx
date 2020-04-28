import React from 'react';

export default class CustomToggle extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    e.preventDefault();

    this.props.onClick(e);
  }

  render() {
    const { className } = this.props;

    return (
      <div className={className} onClick={this.handleClick}>
        {this.props.children}
      </div>
    );
  }
}
