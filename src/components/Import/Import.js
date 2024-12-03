import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NotificationManager } from 'react-notifications';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isBoolean from 'lodash/isBoolean';
import isFunction from 'lodash/isFunction';

import { selectImportDataConfig, selectJournalConfig } from '../../selectors/journals';
import { Dropdown } from '../common/form';
import LicenseService from '../../services/license/LicenseService';
import { getCurrentUserName, getTextByLocale, isMobileDevice } from '../../helpers/util';
import { t } from '../../helpers/export/util';
import { Tooltip } from '../common';
import Download from '../common/icons/Download';
import PageService from '../../services/PageService';
import FormManager from '../EcosForm/FormManager';
import { SourcesId } from '../../constants';
import Records from '../../components/Records';
import { wrapArgs } from '../../helpers/redux';
import { deselectAllRecords, reloadGrid } from '../../actions/journals';

import './Import.scss';

class Import extends Component {
  static propTypes = {
    className: PropTypes.string,
    classNameBtn: PropTypes.string,
    importDataConfig: PropTypes.arrayOf(PropTypes.object),
    isViewNewJournal: PropTypes.bool,
    right: PropTypes.bool,
    getStateOpen: PropTypes.func,
    reloadGrid: PropTypes.func,
    deselectAllRecords: PropTypes.func
  };

  state = {
    importDataConfig: [],
    authorityGroupsCurrentUser: [],
    isOpenDropdown: false,
    hasImportDataLicense: false
  };

  componentDidMount() {
    LicenseService.hasImportDataFeature().then(hasFeature => {
      if (hasFeature) {
        this.setState({
          hasImportDataLicense: true
        });
      }
    });

    Records.get(`${SourcesId.PERSON}@${getCurrentUserName()}`)
      .load('authorityGroups[]?json')
      .then(res => this.setState({ authorityGroupsCurrentUser: res.map(group => group.id) }));
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { importDataConfig } = this.props;

    if (!isEqual(importDataConfig, prevProps.importDataConfig)) {
      this.setState({ importDataConfig });
    }
  }

  changeIsOpen = isOpenDropdown => {
    if (isBoolean(isOpenDropdown)) {
      this.setState({ isOpenDropdown });
      isFunction(this.props.getStateOpen) && this.props.getStateOpen(isOpenDropdown);
    }
  };

  dropdownSourceVariants(importDataConfig, hasImportDataLicense) {
    return hasImportDataLicense ? importDataConfig : [];
  }

  handleSubmit = async (fileData, persistedRecordId) => {
    const { deselectAllRecords, reloadGrid } = this.props;

    if (navigator.serviceWorker && navigator.serviceWorker.controller && persistedRecordId && get(fileData, 'file')) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPLOAD_PROGRESS',
        status: 'start',
        isImporting: true
      });

      let isReady = false;
      const totalCount = await Records.get(persistedRecordId).load('rowCount?num');

      navigator.serviceWorker.controller.postMessage({
        type: 'UPLOAD_PROGRESS',
        status: 'in-progress',
        totalCount,
        successFileCount: 0,
        file: fileData
      });

      while (!isReady) {
        try {
          await new Promise(resolve => setTimeout(resolve, 2000));

          const successFileCount = await Records.get(persistedRecordId).load('processedRowCount?num');
          const persistedRecordData = await Records.get(persistedRecordId).load('?json');
          const state = get(persistedRecordData, 'state', '');

          switch (state) {
            case 'RUNNING':
              navigator.serviceWorker.controller.postMessage({
                type: 'UPLOAD_PROGRESS',
                status: 'in-progress',
                totalCount,
                successFileCount,
                file: fileData
              });
              break;

            case 'STOPPED':
              navigator.serviceWorker.controller.postMessage({
                type: 'UPLOAD_PROGRESS',
                status: 'in-progress',
                totalCount,
                successFileCount,
                file: {
                  ...fileData,
                  isLoading: false
                }
              });
              isReady = true;
              break;

            case 'ERROR':
              const errorMsg = await Records.get(persistedRecordId).load('errorMessage?str');
              if (errorMsg) {
                NotificationManager.error(errorMsg);
              }

              navigator.serviceWorker.controller.postMessage({
                type: 'UPLOAD_PROGRESS',
                status: 'error',
                totalCount,
                successFileCount,
                file: {
                  ...fileData,
                  isLoading: false
                }
              });

              isReady = true;
              break;

            default:
              break;
          }
        } catch (error) {
          console.error('Polling error:', error);
          isReady = true;
        }
      }

      if (isReady) {
        navigator.serviceWorker.controller.postMessage({
          type: 'UPLOAD_PROGRESS',
          status: 'success'
        });

        if (isFunction(deselectAllRecords)) deselectAllRecords();
        if (isFunction(reloadGrid)) reloadGrid();
      }
    }
  };

  handleImport = async item => {
    const { journalConfig = {} } = this.props;
    const typeRef = get(journalConfig, 'typeRef');
    const variantId = get(item, 'variantId');

    if (typeRef && variantId) {
      FormManager.openFormModal({
        record: `integrations/import-data@`,
        formId: 'import-data-form',
        typeRef,
        variantId,
        onSubmit: async (record, form) => {
          const file = get(form, 'data.inputFileRef[0]');
          const formSubmitDonePromise = get(form, 'options.formSubmitDonePromise');

          const fileData = { file };

          if (formSubmitDonePromise) {
            formSubmitDonePromise.then(res => {
              const persistedRecord = get(res, 'persistedRecord');
              this.handleSubmit(fileData, get(persistedRecord, 'id'));
            });
          }
        }
      });
    }
  };

  handleDownloadTemplates = variantId => {
    const { journalConfig = {} } = this.props;

    const proxyUrl = process.env.REACT_APP_SHARE_PROXY_URL;
    const journalType = get(journalConfig, 'typeRef');

    if (proxyUrl && journalType) {
      PageService.changeUrlLink(
        `${proxyUrl}/gateway/integrations/api/import-data/download-template?typeRef=${journalType}&variantId=${variantId}`,
        {
          openNewBrowserTab: true
        }
      );
    }
  };

  handleOnClick = (event, callback) => {
    event.stopPropagation();
    isFunction(callback) && callback(event);
  };

  renderItemMenu = ({ item }) => {
    const textItem = getTextByLocale(get(item, 'name', ''));
    const variantId = get(item, 'variantId');

    if (!variantId) {
      return null;
    }

    return (
      <li className="citeck-import-data__menu-item" onClick={() => this.handleImport(item)}>
        <Tooltip target={`import-data-text_${variantId}`} uncontrolled showAsNeeded text={textItem} off={isMobileDevice()}>
          <span id={`import-data-text_${variantId}`}>{textItem}</span>
        </Tooltip>
        <Tooltip
          target={`import-data-download_${variantId}`}
          uncontrolled
          showAsNeeded
          text={t('citeck-dropdown.import.download')}
          off={isMobileDevice()}
        >
          <i
            id={`import-data-download_${variantId}`}
            className="citeck-import-data__menu-item_i"
            onClick={e => this.handleOnClick(e, this.handleDownloadTemplates(variantId))}
          >
            <Download />
          </i>
        </Tooltip>
      </li>
    );
  };

  render() {
    const { isViewNewJournal, classNameBtn, children, className, right, journalConfig } = this.props;
    const { importDataConfig, isOpenDropdown, hasImportDataLicense, authorityGroupsCurrentUser } = this.state;
    const { hideImportDataActions = false } = journalConfig || {};

    const variants = this.dropdownSourceVariants(importDataConfig, hasImportDataLicense);

    const allowVariants = get(variants, 'length')
      ? variants.filter(variant => {
          const allowedFor = get(variant, 'allowedFor', []);
          return allowedFor.some(
            allowed =>
              allowed &&
              get(authorityGroupsCurrentUser, 'length') &&
              (authorityGroupsCurrentUser.includes(allowed) ||
                authorityGroupsCurrentUser.includes(allowed.replace('GROUP_', '')) ||
                allowed === getCurrentUserName())
          );
        })
      : [];

    if (!allowVariants.length || hideImportDataActions) {
      return null;
    }

    return (
      <div className={classNames('citeck-import-data', { [className]: !!className })}>
        <Dropdown
          isButton
          hasEmpty
          isStatic={!importDataConfig}
          right={right}
          source={allowVariants}
          controlIcon="icon-download"
          controlClassName={classNames('ecos-btn_grey ecos-btn_settings-down', classNameBtn, {
            'ecos-journal__btn_new_focus': isOpenDropdown && isViewNewJournal
          })}
          getStateOpen={this.changeIsOpen}
          isViewNewJournal={isViewNewJournal}
          CustomItem={this.renderItemMenu}
        >
          {children}
        </Dropdown>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  importDataConfig: selectImportDataConfig(state, props.stateId),
  journalConfig: selectJournalConfig(state, props.stateId)
});

function mapDispatchToProps(dispatch, props) {
  const w = wrapArgs(props.stateId);

  return {
    reloadGrid: () => dispatch(reloadGrid(w({}))),
    deselectAllRecords: stateId => dispatch(deselectAllRecords({ stateId }))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Import);
