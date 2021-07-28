import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';

import { getScrollbarWidth, t } from '../../../helpers/util';
import { IcoBtn } from '../../common/btns';
import { isDocLib } from '../constants';
import FoldersTree from '../DocLib/FoldersTree';
import { Labels } from './constants';
import JournalSettings from './JournalSettings';

import './JournalsMenu.scss';

class JournalsMenu extends React.Component {
  static propTypes = {
    height: PropTypes.number // needed to track changes in the height of the parent component
  };

  _menuRef = null;

  state = {
    journalsHeight: 0,
    settingsHeight: 0
  };

  get isDocLibMode() {
    return isDocLib(this.props.viewMode);
  }

  onClose = () => {
    const onClose = this.props.onClose;
    if (typeof onClose === 'function') {
      onClose.call(this);
    }
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

  setRef = ref => {
    if (typeof this.props.forwardedRef === 'function') {
      this.props.forwardedRef(ref);
    }

    if (ref) {
      this._menuRef = ref;
    }
  };

  render() {
    const { stateId, open, pageTabsIsShow, isMobile } = this.props;

    if (!open) {
      return null;
    }

    return (
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
            {isMobile ? t(Labels.HIDE_MENU_sm) : this.isDocLibMode ? t(Labels.HIDE_FOLDER_TREE) : t(Labels.HIDE_MENU)}
          </IcoBtn>
        </div>

        {!this.isDocLibMode && <JournalSettings stateId={stateId} />}

        {this.isDocLibMode && <FoldersTree stateId={stateId} isMobile={isMobile} closeMenu={this.onClose} />}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    isMobile: state.view.isMobile,
    pageTabsIsShow: state.pageTabs.isShow
  };
};

export default connect(mapStateToProps)(JournalsMenu);
