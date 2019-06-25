import React, { Component } from 'react';
import classNames from 'classnames';
import { Collapse } from 'reactstrap';

import './PanelBar.scss';

export default class PanelBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      panelVisible: this.props.open === undefined ? true : this.props.open
    };
  }

  showPanel = () => {
    this.setState({ panelVisible: !this.state.panelVisible });
  };

  render() {
    const props = this.props;
    const css = props.css || {};
    const cssClasses = classNames('panel-bar', props.className);
    const headerClassName = classNames('panel-bar__header', css.headerClassName);
    const headerLabelClassName = classNames('panel-bar__header-label', css.headerLabelClassName);
    const contentClassName = classNames('panel-bar__content', css.contentClassName);

    return (
      <div {...props} className={cssClasses}>
        <div className={headerClassName}>
          <h3 className={headerLabelClassName} onClick={this.showPanel}>
            {props.header}
          </h3>

          <div className={'panel-bar__actions'} />
        </div>

        <Collapse isOpen={this.state.panelVisible}>
          <div className={contentClassName}>{props.children}</div>
        </Collapse>
      </div>
    );
  }
}
