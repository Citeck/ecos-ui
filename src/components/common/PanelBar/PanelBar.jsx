import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Collapse } from 'react-collapse';
import isFunction from 'lodash/isFunction';

import { Loader } from '../index';
import './PanelBar.scss';

export default class PanelBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      panelVisible: this.props.open === undefined ? true : this.props.open
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { open } = this.props;

    if (prevProps.open !== open && open !== this.state.panelVisible) {
      this.setState({ panelVisible: open });
    }
  }

  showPanel = () => {
    const { onTogglePanel, open } = this.props;

    this.setState({ panelVisible: !this.state.panelVisible });

    if (isFunction(onTogglePanel)) {
      onTogglePanel(!open);
    }
  };

  render() {
    const { css = {}, className, header, children, collapseTheme, isLoading } = this.props;
    const { panelVisible } = this.state;

    return (
      <div className={classNames('panel-bar', className, { 'panel-bar_open': panelVisible })}>
        {header && (
          <div className={classNames('panel-bar__header', css.headerClassName)}>
            <h3 className={classNames('panel-bar__header-label', css.headerLabelClassName)} onClick={this.showPanel}>
              {header}
            </h3>

            <div className="panel-bar__actions" />
          </div>
        )}

        <Collapse
          isOpened={panelVisible}
          theme={collapseTheme}
          className={classNames('panel-bar__collapse', {
            'panel-bar__collapse_closed': !panelVisible
          })}
        >
          <div className={classNames('panel-bar__content', css.contentClassName)}>{isLoading ? <Loader type="points" /> : children}</div>
        </Collapse>
      </div>
    );
  }
}

PanelBar.propTypes = {
  open: PropTypes.bool,
  isLoading: PropTypes.bool,
  css: PropTypes.shape({
    headerClassName: PropTypes.string,
    headerLabelClassName: PropTypes.string,
    contentClassName: PropTypes.string
  }),
  className: PropTypes.string,
  header: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
  collapseTheme: PropTypes.shape({
    collapse: PropTypes.string,
    content: PropTypes.string
  })
};
