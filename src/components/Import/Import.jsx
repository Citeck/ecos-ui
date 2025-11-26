import classNames from 'classnames';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isBoolean from 'lodash/isBoolean';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import FormManager from '../EcosForm/FormManager';
import { Tooltip } from '../common';
import { Dropdown } from '../common/form';
import DownloadIcon from '../common/icons/Download';

import { deselectAllRecords, reloadGrid } from '@/actions/journals';
import Records from '@/components/Records';
import { SourcesId } from '@/constants';
import { wrapArgs } from '@/helpers/redux';
import { t, getCurrentUserName, isMobileDevice } from '@/helpers/util';
import { selectJournalConfig } from '@/selectors/journals';
import PageService from '@/services/PageService';
import LicenseService from '@/services/license/LicenseService';
import { NotificationManager } from '@/services/notifications';

import './Import.scss';

const pollingInterval = 2000;

const ATT_FULL_STATE = '?json';
const ATT_PROCESSED_ROW_COUNT = 'processedRowCount?num';
const ATT_TOTAL_COUNT = 'rowCount?num';
const ATT_ERROR_MSG = 'errorMessage?str';
const ATT_SHORT_ERROR_MSG = 'shortErrorMessage?str';
const ATT_AUTHORITY_GROUPS = 'authorityGroups[]?json';

const importFormId = 'import-data-form';
const importFormRecord = 'integrations/import-data@';

const basePathTemplates = '/gateway/integrations/api/import-data/download-template';
const importEndpointLink = `${(process.env.SHARE_PROXY_URL || window.location.origin || '').replace(/\/$/, '')}` + basePathTemplates;

const StatusesUpdate = {
  RUNNING: 'RUNNING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR'
};

class Import extends Component {
  static propTypes = {
    className: PropTypes.string,
    classNameBtn: PropTypes.string,
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
        this.setState(
          {
            hasImportDataLicense: true
          },
          () => {
            const { journalConfig = {} } = this.props;
            const typeRef = get(journalConfig, 'typeRef');

            Records.query(
              {
                sourceId: 'integrations/import-data-variant',
                query: {
                  typeRef: typeRef
                }
              },
              { variantId: 'variantId?str', name: 'name?str', allowedFor: 'allowedFor[]?str' }
            ).then(({ records }) => {
              this.setState({ importDataConfig: records });
            });
          }
        );
      }
    });

    Records.get(`${SourcesId.PERSON}@${getCurrentUserName()}`)
      .load(ATT_AUTHORITY_GROUPS)
      .then(res => this.setState({ authorityGroupsCurrentUser: res.map(group => group.id) }));
  }

  componentWillUnmount() {
    if (isFunction(this.cleanupPolling)) {
      this.cleanupPolling();
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

      navigator.serviceWorker.controller.postMessage({
        type: 'UPLOAD_PROGRESS',
        status: 'in-progress',
        totalCount: 0,
        successFileCount: 0,
        file: fileData
      });

      const record = Records.get(persistedRecordId);

      record.watch([ATT_PROCESSED_ROW_COUNT, ATT_TOTAL_COUNT, ATT_FULL_STATE], updatedAttributes => {
        const processedRowCount = updatedAttributes[ATT_PROCESSED_ROW_COUNT];
        const jsonData = updatedAttributes[ATT_FULL_STATE];
        const totalCount = updatedAttributes[ATT_TOTAL_COUNT];

        if (jsonData && processedRowCount) {
          const state = get(jsonData, 'state', '');

          switch (state) {
            case StatusesUpdate.RUNNING:
              navigator.serviceWorker.controller.postMessage({
                type: 'UPLOAD_PROGRESS',
                status: 'in-progress',
                totalCount,
                successFileCount: processedRowCount || 0,
                file: fileData
              });
              break;

            case StatusesUpdate.STOPPED:
              navigator.serviceWorker.controller.postMessage({
                type: 'UPLOAD_PROGRESS',
                status: 'in-progress',
                totalCount,
                successFileCount: processedRowCount || 0,
                file: {
                  ...fileData,
                  isLoading: false
                }
              });
              stopPolling();
              break;

            case StatusesUpdate.ERROR:
              handleError(fileData);
              stopPolling();
              break;

            default:
              break;
          }
        }
      });

      await record.load([ATT_PROCESSED_ROW_COUNT, ATT_TOTAL_COUNT, ATT_FULL_STATE]);

      const startPolling = () => {
        record.pollingIntervalId = setInterval(() => {
          record
            .update()
            .then(response => {
              if (get(record.att(ATT_FULL_STATE), 'state') === StatusesUpdate.ERROR) {
                new Promise(async resolve => {
                  await handleError(fileData);
                  resolve();
                }).then(() => stopPolling());
              }
            })
            .catch(error => {
              console.error(t('import-component.record.error-update', { record: record.id, error }));
            });
        }, pollingInterval);
      };

      const stopPolling = () => {
        if (record.pollingIntervalId) {
          clearInterval(record.pollingIntervalId);
          record.pollingIntervalId = null;
        }

        navigator.serviceWorker.controller.postMessage({
          type: 'UPLOAD_PROGRESS',
          status: 'success'
        });

        isFunction(deselectAllRecords) && deselectAllRecords();
        isFunction(reloadGrid) && reloadGrid();
      };

      const handleError = async fileData => {
        const errorMsg = await record.load(ATT_ERROR_MSG);
        const shortErrorMsg = await record.load(ATT_SHORT_ERROR_MSG);

        if (shortErrorMsg || errorMsg) {
          NotificationManager.error(shortErrorMsg || errorMsg, null, 0);
        }

        navigator.serviceWorker.controller.postMessage({
          type: 'UPLOAD_PROGRESS',
          status: 'error',
          totalCount: record.att(ATT_TOTAL_COUNT) || 0,
          successFileCount: record.att(ATT_PROCESSED_ROW_COUNT) || 0,
          file: {
            ...fileData,
            isLoading: false
          }
        });
      };

      if (get(record.att(ATT_FULL_STATE), 'state')) {
        switch (record.att(ATT_FULL_STATE).state) {
          case StatusesUpdate.RUNNING:
            startPolling();
            break;

          case StatusesUpdate.STOPPED:
            navigator.serviceWorker.controller.postMessage({
              type: 'UPLOAD_PROGRESS',
              status: 'in-progress',
              totalCount: record.att(ATT_TOTAL_COUNT) || 0,
              successFileCount: record.att(ATT_PROCESSED_ROW_COUNT) || 0,
              file: {
                ...fileData,
                isLoading: false
              }
            });
            stopPolling();
            break;

          case StatusesUpdate.ERROR:
            await handleError(fileData);
            stopPolling();
            break;

          default:
            break;
        }
      }

      this.cleanupPolling = () => {
        stopPolling();
      };
    }
  };

  handleImport = async item => {
    const { journalConfig = {} } = this.props;
    const typeRef = get(journalConfig, 'typeRef');
    const variantId = get(item, 'variantId');

    if (!typeRef || !variantId) {
      NotificationManager.error(t('import-component.attributes.error'), null, 0);
      console.error('Invalid import variant. journalId: ' + get(journalConfig, 'id') + ' typeRef: ' + typeRef + ' variantId: ' + variantId);
    }

    if (typeRef && variantId) {
      FormManager.openFormModal({
        record: importFormRecord,
        formId: importFormId,
        attributes: {
          typeRef,
          variantId
        },
        onSubmit: async (record, form) => {
          const file = get(form, 'data.inputFileRef[0]');
          const formSubmitDonePromise = get(form, 'options.formSubmitDonePromise');

          const fileData = {
            file: {
              ...file,
              name: get(file, 'originalName', get(file, 'name'))
            }
          };

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

    const params = { openNewBrowserTab: true };
    const journalId = get(journalConfig, 'id');
    const journalType = get(journalConfig, 'typeRef');

    const journalRef = SourcesId.JOURNAL + '@' + journalId;

    if (journalType && variantId && journalId && journalRef) {
      PageService.changeUrlLink(`${importEndpointLink}?typeRef=${journalType}&variantId=${variantId}&journalRef=${journalRef}`, params);
    }
  };

  handleOnClick = (event, callback) => {
    event.stopPropagation();
    isFunction(callback) && callback(event);
  };

  renderItemMenu = ({ item }) => {
    const textItem = get(item, 'name', '');
    const variantId = get(item, 'variantId');

    if (!variantId) {
      return null;
    }

    return (
      <li className="citeck-import-data__menu-item" onClick={() => this.handleImport(item)}>
        <Tooltip target={`import-data-text_${variantId}`} uncontrolled showAsNeeded text={textItem} off={isMobileDevice()}>
          <span id={`import-data-text_${variantId}`} className="citeck-import-data__menu-item_text">
            {textItem}
          </span>
        </Tooltip>
        <Tooltip
          target={`import-data-download_${variantId}`}
          uncontrolled
          showAsNeeded
          text={t('import-component.download')}
          off={isMobileDevice()}
        >
          <i
            id={`import-data-download_${variantId}`}
            className="citeck-import-data__menu-item_i"
            onClick={e => this.handleOnClick(e, this.handleDownloadTemplates(variantId))}
          >
            <DownloadIcon />
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

          if (isArray(allowedFor) && !allowedFor.length) {
            return true; // All groups are allowed
          }

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
  journalConfig: selectJournalConfig(state, props.stateId)
});

function mapDispatchToProps(dispatch, props) {
  const w = wrapArgs(props.stateId);

  return {
    reloadGrid: () => dispatch(reloadGrid(w({}))),
    deselectAllRecords: stateId => dispatch(deselectAllRecords({ stateId }))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Import);
