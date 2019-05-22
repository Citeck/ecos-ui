import React from 'react';
import PropTypes from 'prop-types';
import './style.scss';

const TYPE = ['template', 'menu'];

export default class Layout extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    active: PropTypes.bool,
    config: PropTypes.object,
    type: PropTypes.oneOf(TYPE),
    onClick: PropTypes.func
  };

  static defaultProps = {
    className: '',
    active: false,
    config: {
      columns: [{}, { width: '25%' }]
    },
    type: TYPE[0],
    onClick: () => null
  };

  constructor(props) {
    super(props);
  }

  get className() {
    const { className, active } = this.props;
    const classes = ['ecos-layout__item'];

    if (className) {
      classes.push(className);
    }

    if (active) {
      classes.push('ecos-layout__item_active');
    }

    return classes.join(' ');
  }

  renderActiveIcon() {
    const { active } = this.props;

    if (!active) {
      return null;
    }

    return <i className="ecos-layout__item_active-icon fa fa-check-circle" />;
  }

  renderColumn = (params, index) => {
    return (
      <div
        key={index}
        className="ecos-layout__column"
        style={{
          flexBasis: params.width,
          minWidth: params.width
        }}
      />
    );
  };

  renderColumns() {
    const {
      config: { columns }
    } = this.props;

    if (!columns) {
      return null;
    }

    return <div className="ecos-layout">{columns.map(this.renderColumn)}</div>;
  }

  render() {
    const { onClick } = this.props;

    return (
      <div onClick={onClick} className={this.className}>
        {this.renderActiveIcon()}
        {this.renderColumns()}
      </div>
    );
  }
}
