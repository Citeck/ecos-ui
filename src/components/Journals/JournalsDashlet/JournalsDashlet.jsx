import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import JournalsDashletGrid from '../JournalsDashletGrid';
import JournalsDashletToolbar from '../JournalsDashletToolbar';
import JournalsDashletEditor from '../JournalsDashletEditor';
import JournalsDashletFooter from '../JournalsDashletFooter';
import Measurer from '../../Measurer/Measurer';
import Dashlet from '../../Dashlet/Dashlet';
import { getDashletConfig, initState, reloadGrid, setEditorMode } from '../../../actions/journals';
import { goToJournalsPage } from '../../../helpers/urls';
import { wrapArgs } from '../../../helpers/redux';
import { MIN_WIDTH_DASHLET_SMALL, MIN_WIDTH_DASHLET_LARGE } from '../../../constants';

import './JournalsDashlet.scss';
import UserLocalSettingsService from '../../../services/userLocalSettings';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId || props.id] || {};

  return {
    editorMode: newState.editorMode,
    journalConfig: newState.journalConfig,
    config: newState.config
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId || props.id);

  return {
    initState: stateId => dispatch(initState(stateId)),

    getDashletConfig: id => dispatch(getDashletConfig(w(id))),
    setEditorMode: visible => dispatch(setEditorMode(w(visible))),
    reloadGrid: options => dispatch(reloadGrid(w(options)))
  };
};

class JournalsDashlet extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    dragHandleProps: PropTypes.object
  };

  static defaultProps = {
    dragHandleProps: {}
  };

  constructor(props) {
    super(props);

    this._stateId = props.stateId || props.id;
    this.state = {
      width: MIN_WIDTH_DASHLET_SMALL,
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
    };

    this.props.initState(this._stateId);
  }

  componentDidMount() {
    this.props.getDashletConfig(this.props.id);
  }

  handleResize = width => {
    this.setState({ width });
  };

  handleToggleContent = (isCollapsed = false) => {
    this.setState({ isCollapsed });
    UserLocalSettingsService.setProperty(this.props.id, { isCollapsed });
  };

  showEditor = () => this.props.setEditorMode(true);

  goToJournalsPage = () => {
    const {
      config: { journalsListId = '', journalSettingId = '' },
      journalConfig: {
        id = '',
        meta: { nodeRef = '' }
      }
    } = this.props;

    goToJournalsPage({ journalsListId, journalId: id, journalSettingId, nodeRef });
  };

  render() {
    const { journalConfig, className, id, editorMode, reloadGrid, dragHandleProps } = this.props;
    const { width, isCollapsed } = this.state;

    if (!journalConfig) {
      return null;
    }

    return (
      <Dashlet
        {...this.props}
        className={classNames('ecos-journal-dashlet', className)}
        bodyClassName={'ecos-journal-dashlet__body'}
        title={journalConfig.meta.title || ''}
        onReload={reloadGrid}
        onEdit={this.showEditor}
        onGoTo={this.goToJournalsPage}
        needGoTo={width >= MIN_WIDTH_DASHLET_LARGE}
        style={{
          minWidth: `${MIN_WIDTH_DASHLET_SMALL}px`
        }}
        onResize={this.handleResize}
        dragHandleProps={dragHandleProps}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
      >
        {editorMode ? (
          <Measurer>
            <JournalsDashletEditor id={id} stateId={this._stateId} />
          </Measurer>
        ) : (
          <Fragment>
            <Measurer>
              <JournalsDashletToolbar stateId={this._stateId} isSmall={width < MIN_WIDTH_DASHLET_LARGE} />
            </Measurer>

            <JournalsDashletGrid stateId={this._stateId} />

            <JournalsDashletFooter stateId={this._stateId} />
          </Fragment>
        )}
      </Dashlet>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashlet);
