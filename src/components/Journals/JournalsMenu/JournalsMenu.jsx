import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import { getScrollbarWidth, t } from '../../../helpers/util';
import { selectViewMode } from '../../../selectors/journals';
import { Search } from '../../common';
import { IcoBtn } from '../../common/btns';
import { isDocLib, JOURNAL_VIEW_MODE, Labels } from '../constants';
import FoldersTree from '../DocLib/FoldersTree';
import { JournalsPresetList } from '../JournalsPresets';

import './JournalsMenu.scss';

class JournalsMenu extends React.Component {
  static propTypes = {
    height: PropTypes.number // needed to track changes in the height of the parent component
  };

  _menuRef = null;

  state = {
    journalsHeight: 0,
    settingsHeight: 0,
    searchText: ''
  };

  get isDocLibMode() {
    return isDocLib(this.props.viewMode);
  }

  onClose = () => {
    const onClose = this.props.onClose;
    isFunction(onClose) && onClose.call(this);
  };

  onSearch = searchText => {
    this.setState({ searchText });
  };

  getMaxMenuHeight = () => {
    let height = document.body.offsetHeight;

    height -= get(document.querySelector('#alf-hd'), 'offsetHeight', 0);
    height -= get(document.querySelector('.page-tab'), 'offsetHeight', 0);

    if (this._menuRef) {
      const styles = window.getComputedStyle(this._menuRef, null);

      height -= parseInt(styles.getPropertyValue('padding-top'), 10) || 0;
      height -= parseInt(styles.getPropertyValue('padding-bottom'), 10) || 0;
    }

    height -= getScrollbarWidth();

    return height < 300 ? 300 : height;
  };

  getBtnLabel = () => {
    const { isMobile } = this.props;

    switch (true) {
      case isMobile:
        return t(Labels.Menu.HIDE_MENU_sm);
      case this.isDocLibMode:
        return t(Labels.Menu.HIDE_FOLDER_TREE);
      default:
        return t(Labels.Menu.HIDE_MENU);
    }
  };

  setRef = ref => {
    isFunction(this.props.forwardedRef) && this.props.forwardedRef(ref);

    if (ref) {
      this._menuRef = ref;
    }
  };

  renderByViewMode = () => {
    const { viewMode, stateId } = this.props;

    switch (viewMode) {
      case JOURNAL_VIEW_MODE.DOC_LIB:
        return <FoldersTree stateId={stateId} closeMenu={this.onClose} />;
      case JOURNAL_VIEW_MODE.TABLE:
      default:
        return <JournalsPresetList stateId={stateId} viewMode={viewMode} searchText={this.state.searchText} />;
    }
  };

  render() {
    const { open, pageTabsIsShow, isMobile, menuOpenAnimate } = this.props;

    if (!open) {
      return null;
    }

    return (
      <div
        className={classNames('ecos-journal__menu', {
          'ecos-journal__menu_with-tabs': pageTabsIsShow,
          'ecos-journal__menu_mobile': isMobile,
          'ecos-journal__menu_expanded': menuOpenAnimate,
          'ecos-journal__menu_expanded-document-library': menuOpenAnimate && this.isDocLibMode
        })}
      >
        <div
          ref={this.setRef}
          className={classNames('ecos-journal-menu', 'ecos-journal-menu_grid', {
            'ecos-journal-menu_open': open,
            'ecos-journal-menu_tabs': pageTabsIsShow,
            'ecos-journal-menu_mobile': isMobile
          })}
          style={{ maxHeight: this.getMaxMenuHeight() }}
        >
          <div className="ecos-journal-menu__hide-menu-btn">
            <IcoBtn
              onClick={this.onClose}
              icon="icon-small-arrow-right"
              invert
              className="ecos-btn_grey5 ecos-btn_hover_grey ecos-btn_narrow-t_standard ecos-btn_r_biggest"
            >
              {this.getBtnLabel()}
            </IcoBtn>
          </div>
          {!this.isDocLibMode && (
            <div className="ecos-journal-menu__search-block">
              <Search cleaner liveSearch searchWithEmpty onSearch={this.onSearch} className="ecos-journal-menu__search-field" />
            </div>
          )}
          {this.renderByViewMode()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  const viewMode = selectViewMode(state, props.stateId);

  return {
    isMobile: state.view.isMobile,
    pageTabsIsShow: state.pageTabs.isShow,
    viewMode
  };
};

export default connect(mapStateToProps)(JournalsMenu);
