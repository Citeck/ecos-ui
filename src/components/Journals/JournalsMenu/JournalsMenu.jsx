import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';

import { getScrollbarWidth, t } from '../../../helpers/util';
import { IcoBtn } from '../../common/btns';
import { JOURNAL_VIEW_MODE } from '../constants';
import FoldersTree from '../DocLib/FoldersTree';
import Presets from '../Presets/Presets';
import { Labels } from './constants';

import './JournalsMenu.scss';

const mapStateToProps = (state, props) => {
  return {
    isMobile: state.view.isMobile,
    pageTabsIsShow: state.pageTabs.isShow
  };
};

class JournalsMenu extends React.Component {
  static propTypes = {
    height: PropTypes.number // needed to track changes in the height of the parent component
  };

  _menuRef = null;

  state = {
    journalsHeight: 0,
    settingsHeight: 0
  };

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
    const { stateId, open, pageTabsIsShow, isMobile, viewMode } = this.props;

    if (!open) {
      return null;
    }

    const isDocLibMode = viewMode === JOURNAL_VIEW_MODE.DOC_LIB;

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
            className="ecos-btn_grey5 ecos-btn_hover_grey ecos-btn_narrow-t_standart ecos-btn_r_biggest"
          >
            {isMobile ? t(Labels.HIDE_MENU_sm) : isDocLibMode ? t(Labels.HIDE_FOLDER_TREE) : t(Labels.HIDE_MENU)}
          </IcoBtn>
        </div>

        {!isDocLibMode && <Presets stateId={stateId} />}

        {isDocLibMode && <FoldersTree stateId={stateId} isMobile={isMobile} closeMenu={this.onClose} />}
      </div>
    );
  }
}

export default connect(mapStateToProps)(JournalsMenu);
