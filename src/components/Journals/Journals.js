import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import merge from 'lodash/merge';

import { execJournalAction, setUrl, toggleViewMode } from '../../actions/journals';
import { getTypeRef } from '../../actions/docLib';
import { selectCommonJournalPageProps, selectJournalPageProps } from '../../selectors/journals';
import { DocLibUrlParams as DLUP, JournalUrlParams as JUP, SourcesId } from '../../constants';
import { animateScrollTo, getBool, getScrollbarWidth } from '../../helpers/util';
import { equalsQueryUrls, getSearchParams } from '../../helpers/urls';
import { wrapArgs } from '../../helpers/redux';
import { showModalJson } from '../../helpers/tools';
import { ActionTypes } from '../Records/actions';

import { JOURNAL_MIN_HEIGHT, JOURNAL_VIEW_MODE as JVM } from './constants';
import JournalsMenu from './JournalsMenu';
import JournalsHead from './JournalsHead';
import { DocLibView, TableView } from './Views';

import './style.scss';

const mapStateToProps = (state, props) => {
  const commonProps = selectCommonJournalPageProps(state, props.stateId);
  const journalProps = selectJournalPageProps(state, props.stateId);

  return {
    isAdmin: get(state, 'user.isAdmin'),
    isMobile: get(state, 'view.isMobile'),
    pageTabsIsShow: get(state, 'pageTabs.isShow'),
    _url: window.location.href,
    ...commonProps,
    ...journalProps
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    setUrl: urlParams => dispatch(setUrl(w(urlParams))),
    toggleViewMode: viewMode => dispatch(toggleViewMode(w({ viewMode }))),
    execJournalAction: (records, action, context) => dispatch(execJournalAction(w({ records, action, context }))),
    getTypeRef: journalId => dispatch(getTypeRef(w({ journalId })))
    // clearSearch: () => dispatch(setGrid({ search: '', stateId: props.stateId })),
    // restoreJournalSettingData: setting => dispatch(restoreJournalSettingData(w(setting))),

    // onJournalSettingsSelect: id => dispatch(onJournalSettingsSelect(w(id))),
    // applySettings: settings => dispatch(applyJournalSetting(w(settings))),
    // createJournalSetting: (journalId, settings) => dispatch(createJournalSetting(w({ journalId, settings }))),
  };
};

const defaultDisplayElements = {
  menu: true,
  header: true,
  settings: true,
  pagination: true,
  groupActions: true,
  editJournal: true
};

class Journals extends React.Component {
  _journalRef = React.createRef();
  _journalBodyRef = React.createRef();
  _bodyTopForwardedRef = React.createRef();
  _journalFooterRef = React.createRef();
  _journalMenuRef = null;
  _toggleMenuTimerId = null;

  state = {
    menuOpen: false,
    menuOpenAnimate: false,
    journalId: undefined
  };

  static getDerivedStateFromProps(props, state) {
    const journalId = get(props, ['urlParams', JUP.JOURNAL_ID]);
    let newState = {};

    if (props.isActivePage && journalId !== state.journalId) {
      newState = merge(newState, { journalId });
    }

    if (isEmpty(newState)) {
      return null;
    }

    return newState;
  }

  componentDidMount() {
    const showPreview = getBool(get(getSearchParams(), JUP.SHOW_PREVIEW));
    let viewMode = getBool(get(getSearchParams(), JUP.VIEW_MODE));

    if (showPreview && !viewMode) {
      viewMode = JVM.PREVIEW;
    }

    if (!viewMode) {
      viewMode = JVM.TABLE;
    }

    this.props.toggleViewMode(viewMode);
    this.props.setUrl(getSearchParams());
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { _url, isActivePage, stateId } = this.props;

    if (this.state.journalId !== prevState.journalId) {
      this.props.getTypeRef(this.state.journalId);
    }

    const isEqualQuery = equalsQueryUrls({
      urls: [_url, prevProps._url],
      ignored: [JUP.SHOW_PREVIEW, JUP.VIEW_MODE, DLUP.FOLDER_ID, DLUP.SEARCH]
    });

    const isActiveChanged = isActivePage && prevProps.isActivePage && !isEqualQuery;

    if (isActiveChanged || prevProps.stateId !== stateId) {
      this.props.setUrl(getSearchParams());
    }
  }

  componentWillUnmount() {
    this.setHeight.cancel();
    this.handleEditJournal.cancel();

    if (this._toggleMenuTimerId) {
      window.clearTimeout(this._toggleMenuTimerId);
      this._toggleMenuTimerId = null;
    }
  }

  get displayElements() {
    return {
      ...defaultDisplayElements,
      ...(this.props.displayElements || {}),
      editJournal: get(this.props, 'displayElements.editJournal', true) && this.props.isAdmin && get(this.props, 'journalConfig.id')
    };
  }

  get commonProps() {
    const { bodyClassName, stateId, isActivePage } = this.props;
    const { journalId, displayElements } = this.state;

    return {
      stateId,
      journalId,
      displayElements,
      bodyClassName,
      isActivePage,
      Header: this.Header,
      bodyForwardedRef: this._journalBodyRef,
      bodyTopForwardedRef: this._bodyTopForwardedRef,
      footerForwardedRef: this._journalFooterRef
    };
  }

  get tableProps() {
    const { selectAllRecordsVisible, selectAllRecords } = this.props;
    return { selectAllRecordsVisible, selectAllRecords, getJournalContentMaxHeight: this.getJournalContentMaxHeight };
  }

  setJournalMenuRef = ref => {
    if (ref) {
      this._journalMenuRef = ref;
    }
  };

  setHeight = debounce(height => this.setState({ height }), 500);

  handleEditJournal = throttle(
    () => this.props.execJournalAction(`${SourcesId.JOURNAL}@${this.props.journalConfig.id}`, { type: ActionTypes.EDIT }),
    300,
    { leading: false, trailing: true }
  );

  handleToggleMenu = () => {
    if (this._toggleMenuTimerId) {
      window.clearTimeout(this._toggleMenuTimerId);
    }

    this.setState(({ menuOpenAnimate }) => ({ menuOpenAnimate: !menuOpenAnimate }));

    if (this.state.menuOpen) {
      const scrollLeft = this._journalRef.scrollLeft - get(this, '_journalMenuRef.offsetWidth', 0);
      animateScrollTo(this._journalRef.current, { scrollLeft });
    }

    this._toggleMenuTimerId = window.setTimeout(
      () =>
        this.setState(
          ({ menuOpen }) => ({ menuOpen: !menuOpen }),
          () => {
            if (this.props.isMobile) {
              return;
            }

            if (this.state.menuOpen) {
              const scrollLeft = this._journalRef.scrollLeft + get(this, '_journalMenuRef.offsetWidth', 0);
              animateScrollTo(this._journalRef.current, { scrollLeft }, 500);
            }
          }
        ),
      this.state.menuOpen ? 500 : 0
    );
  };

  handleResize = (w, h) => {
    const height = parseInt(h);

    if (!h || Number.isNaN(height) || height === this.state.height) {
      return;
    }

    this.setHeight(height);
  };

  handleDisplayConfigPopup = event => {
    if (event.ctrlKey && event.shiftKey) {
      const { journalConfig } = this.props;
      event.stopPropagation();
      !!journalConfig && showModalJson(journalConfig, 'Journal Config');
    }
  };

  getJournalContentMaxHeight = () => {
    const { additionalHeights } = this.props;
    const journalMinHeight = 175;
    let height = document.body.offsetHeight;

    height -= get(document.querySelector('#alf-hd'), 'offsetHeight', 0);
    height -= get(document.querySelector('.page-tab'), 'offsetHeight', 0);

    if (get(this, '_bodyTopForwardedRef.current')) {
      height -= get(this._bodyTopForwardedRef.current, 'offsetHeight', 0);
    }

    if (get(this, '_journalFooterRef.current')) {
      height -= get(this._journalFooterRef.current, 'offsetHeight', 0);
      height -= 15; // for indent under pagination
    }

    const appFooter = document.querySelector('.app-footer');

    if (appFooter) {
      height -= get(appFooter, 'offsetHeight', 0);
    }

    if (get(this, '_journalBodyRef.current')) {
      const styles = window.getComputedStyle(this._journalBodyRef.current, null);

      height -= parseInt(styles.getPropertyValue('padding-top'), 10) || 0;
      height -= parseInt(styles.getPropertyValue('padding-bottom'), 10) || 0;
    }

    height -= getScrollbarWidth();

    if (!Number.isNaN(additionalHeights)) {
      height += additionalHeights;
    }

    return height < journalMinHeight ? journalMinHeight : height;
  };

  Header = props => {
    if (this.displayElements.header) {
      const { menuOpen } = this.state;
      const { isMobile } = this.props;

      return (
        <div onClick={this.handleDisplayConfigPopup}>
          <JournalsHead
            title={props.title}
            labelBtnMenu={props.labelBtnMenu}
            isOpenMenu={menuOpen}
            isMobile={isMobile}
            hasBtnMenu={this.displayElements.menu}
            hasBtnEdit={this.displayElements.editJournal}
            onToggleMenu={this.handleToggleMenu}
            onEditJournal={this.handleEditJournal}
          />
        </div>
      );
    }

    return <React.Fragment />;
  };

  RightMenu = () => {
    if (this.displayElements.menu) {
      const { stateId, isActivePage } = this.props;
      const { menuOpen, menuOpenAnimate, height } = this.state;

      return (
        <JournalsMenu
          height={height}
          stateId={stateId}
          open={menuOpen}
          isActivePage={isActivePage}
          forwardedRef={this.setJournalMenuRef}
          onClose={this.handleToggleMenu}
          menuOpenAnimate={menuOpenAnimate}
        />
      );
    }

    return <React.Fragment />;
  };

  render() {
    const { isMobile, className } = this.props;
    const { height } = this.state;

    return (
      <ReactResizeDetector handleHeight onResize={this.handleResize}>
        <div
          ref={this._journalRef}
          className={classNames('ecos-journal', className, {
            'ecos-journal_mobile': isMobile,
            'ecos-journal_scroll': height <= JOURNAL_MIN_HEIGHT
          })}
        >
          <TableView {...this.commonProps} {...this.tableProps} />
          <DocLibView {...this.commonProps} />
          <this.RightMenu />
        </div>
      </ReactResizeDetector>
    );
  }
}

Journals.propTypes = {
  stateId: PropTypes.string,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
  additionalHeights: PropTypes.number,
  isActivePage: PropTypes.bool,
  displayElements: PropTypes.shape({
    menu: PropTypes.bool,
    header: PropTypes.bool,
    settings: PropTypes.bool,
    pagination: PropTypes.bool,
    groupActions: PropTypes.bool
  }),
  selectAllRecordsVisible: PropTypes.bool,
  selectAllRecords: PropTypes.bool
};

Journals.defaultProps = {
  className: '',
  bodyClassName: '',
  additionalHeights: 0,
  displayElements: { ...defaultDisplayElements }
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journals);
