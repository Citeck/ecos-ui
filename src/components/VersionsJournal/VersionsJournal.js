import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactResizeDetector from 'react-resize-detector';

import Dashlet from '../Dashlet/Dashlet';
import { t } from '../../helpers/util';

import './style.scss';
import { IcoBtn } from '../common/btns';
import Icon from '../common/icons/Icon/Icon';

class VersionsJournal extends Component {
  state = {
    width: 291
  };

  handleResize = width => {
    this.setState({ width });
  };

  handleClickShowModal = () => {};

  renderAddButton() {
    return (
      <IcoBtn
        key="action-open-modal"
        icon={'icon-plus'}
        onClick={this.handleClickShowModal}
        className={
          'ecos-btn_i dashlet__btn_hidden dashlet__btn_next dashlet__btn_move ecos-btn_grey1 ecos-btn_width_auto ecos-btn_hover_grey1'
        }
      />
    );
  }

  render() {
    return (
      <div>
        <Dashlet
          title={t('Журнал версий')}
          needGoTo={false}
          actionEdit={false}
          actionHelp={false}
          actionReload={false}
          resizable
          customButtons={[this.renderAddButton()]}
        >
          <ReactResizeDetector handleWidth handleHeight onResize={this.handleResize} />
          <div className="ecos-vj__title">{t('Актуальная версия')}</div>
          <div className="ecos-vj__version">
            <div className="ecos-vj__version-header">
              <div className="ecos-vj__version-number">1.2</div>
              <div className="ecos-vj__version-title">8 Сентября, 13:25</div>
              <div className="ecos-vj__version-actions">
                <Icon onClick={this.handleClickShowModal} className="icon-on ecos-vj__version-actions-item" />
                <Icon onClick={this.handleClickShowModal} className="icon-actual ecos-vj__version-actions-item" />
                <Icon onClick={this.handleClickShowModal} className="icon-download ecos-vj__version-actions-item" />
              </div>
            </div>
            <div className="ecos-vj__version-body">
              <div className="ecos-vj__version-author">
                <img
                  src="https://images-na.ssl-images-amazon.com/images/M/MV5BMTEwNjE0Njg2MTReQTJeQWpwZ15BbWU3MDEyODM1ODc@._V1_UY256_CR1,0,172,256_AL_.jpg"
                  alt="author"
                  className="ecos-vj__version-author-avatar"
                />
                <div className="ecos-vj__version-author-name">
                  <div className="ecos-vj__version-author-name-item">Константин</div>
                  <div className="ecos-vj__version-author-name-item">Константинопольский</div>
                </div>
              </div>
            </div>
          </div>
        </Dashlet>
      </div>
    );
  }
}

export default VersionsJournal;
