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
import { getBoardList } from '../../actions/kanban';
import { selectCommonJournalPageProps } from '../../selectors/journals';
import { DocLibUrlParams as DLUP, JournalUrlParams as JUP, SourcesId } from '../../constants';
import { animateScrollTo, getBool, getScrollbarWidth, t } from '../../helpers/util';
import { equalsQueryUrls, getSearchParams } from '../../helpers/urls';
import { wrapArgs } from '../../helpers/redux';
import { showModalJson } from '../../helpers/tools';
import { ActionTypes } from '../Records/actions';

import { isKanban, isUnknownView, JOURNAL_MIN_HEIGHT, JOURNAL_VIEW_MODE as JVM, Labels } from './constants';
import JournalsMenu from './JournalsMenu';
import JournalsHead from './JournalsHead';
import { DocLibView, TableView, KanbanView } from './Views';

import './style.scss';

const mapStateToProps = (state, props) => {
  const commonProps = selectCommonJournalPageProps(state, props.stateId);

  return {
    isAdmin: get(state, 'user.isAdmin'),
    isMobile: get(state, 'view.isMobile'),
    pageTabsIsShow: get(state, 'pageTabs.isShow'),
    _url: window.location.href,
    ...commonProps
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    setUrl: urlParams => dispatch(setUrl(w(urlParams))),
    toggleViewMode: viewMode => dispatch(toggleViewMode(w({ viewMode }))),
    execJournalAction: (records, action, context) => dispatch(execJournalAction(w({ records, action, context }))),
    getTypeRef: journalId => dispatch(getTypeRef(w({ journalId }))),
    getBoardList: journalId => dispatch(getBoardList({ journalId, stateId: props.stateId }))
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

const ViewLabels = {
  [JVM.PREVIEW]: Labels.Views.PREVIEW,
  [JVM.TABLE]: Labels.Views.JOURNAL,
  [JVM.DOC_LIB]: Labels.Views.DOC_LIB,
  [JVM.KANBAN]: Labels.Views.KANBAN
};

class Journals extends React.Component {
  _journalRef = null;
  _journalBodyRef = null;
  _journalBodyTopRef = null;
  _journalFooterRef = null;
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

    if (isUnknownView(viewMode)) {
      viewMode = JVM.TABLE;
    }

    this.props.toggleViewMode(viewMode);
    this.props.setUrl(getSearchParams());
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { _url, isActivePage, stateId } = this.props;
    const { journalId } = this.state;

    if (journalId && journalId !== prevState.journalId) {
      this.props.getTypeRef(journalId);
      this.props.getBoardList(journalId);
    }

    const isEqualQuery = equalsQueryUrls({
      urls: [_url, prevProps._url],
      ignored: [JUP.SHOW_PREVIEW, JUP.VIEW_MODE, DLUP.FOLDER_ID, DLUP.SEARCH]
    });

    const isActiveChanged = journalId && isActivePage && prevProps.isActivePage && !isEqualQuery;

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
      editJournal: get(this.props, 'displayElements.editJournal', true) && this.props.isAdmin && get(this.props, 'journalConfig.id'),
      menu: !isKanban(this.props.viewMode)
    };
  }

  get commonProps() {
    const { bodyClassName, stateId, isActivePage, pageTabsIsShow, isMobile } = this.props;
    const { journalId } = this.state;

    return {
      stateId,
      journalId,
      isActivePage,
      Header: this.Header,
      UnavailableView: this.UnavailableView,
      displayElements: this.displayElements,
      bodyForwardedRef: this.setJournalBodyRef,
      bodyTopForwardedRef: this.setJournalBodyTopRef,
      footerForwardedRef: this.setJournalFooterRef,
      bodyClassName: classNames('ecos-journal__body', bodyClassName, {
        'ecos-journal__body_with-tabs': pageTabsIsShow,
        'ecos-journal__body_mobile': isMobile
      })
    };
  }

  get tableProps() {
    const { selectAllRecordsVisible, selectAllRecords } = this.props;
    return { selectAllRecordsVisible, selectAllRecords, getJournalContentMaxHeight: this.getJournalContentMaxHeight };
  }

  setJournalRef = ref => !!ref && (this._journalRef = ref);

  setJournalBodyRef = ref => !!ref && (this._journalBodyRef = ref);

  setJournalBodyTopRef = ref => !!ref && (this._journalBodyTopRef = ref);

  setJournalFooterRef = ref => !!ref && (this._journalFooterRef = ref);

  setJournalMenuRef = ref => !!ref && (this._journalMenuRef = ref);

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
      animateScrollTo(this._journalRef, { scrollLeft });
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
              animateScrollTo(this._journalRef, { scrollLeft }, 500);
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
    const { additionalHeights, footerRef } = this.props;
    const journalMinHeight = 175;
    let height = document.body.offsetHeight;

    height -= get(document.querySelector('#alf-hd'), 'offsetHeight', 0);
    height -= get(document.querySelector('.page-tab'), 'offsetHeight', 0);

    if (this._journalBodyTopRef) {
      height -= get(this._journalBodyTopRef, 'offsetHeight', 0);
    }

    if (this._journalFooterRef) {
      height -= get(this._journalFooterRef, 'offsetHeight', 0);
      height -= 15; // for indent under pagination
    }

    if (footerRef) {
      height -= get(footerRef, 'offsetHeight', 0);
    }

    if (this._journalBodyRef) {
      const styles = window.getComputedStyle(this._journalBodyRef, null);

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
            labelBtnMenu={props.labelBtnMenu || (isMobile ? t(Labels.Journal.SHOW_MENU_SM) : t(Labels.Journal.SHOW_MENU))}
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
          isActivePage={isActivePage}
          open={menuOpen}
          menuOpenAnimate={menuOpenAnimate}
          forwardedRef={this.setJournalMenuRef}
          onClose={this.handleToggleMenu}
        />
      );
    }

    return <React.Fragment />;
  };

  UnavailableView = () => {
    const { viewMode } = this.props;
    const name = t(ViewLabels[viewMode]);

    return (
      <div className="alert alert-secondary" role="alert">
        {t('journal.page.unavailable-view', { name })}
      </div>
    );
  };

  render() {
    const { isMobile, className } = this.props;
    const { height } = this.state;

    return (
      <ReactResizeDetector handleHeight onResize={this.handleResize}>
        <div
          ref={this.setJournalRef}
          className={classNames('ecos-journal', className, {
            'ecos-journal_mobile': isMobile,
            'ecos-journal_scroll': height <= JOURNAL_MIN_HEIGHT
          })}
        >
          <TableView {...this.commonProps} {...this.tableProps} />
          <DocLibView {...this.commonProps} />
          <KanbanView {...this.commonProps} maxHeight={this.getJournalContentMaxHeight()} />
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
