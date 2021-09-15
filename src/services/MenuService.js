import { getSearchParams, SearchKeys } from '../helpers/urls';
import { MenuSettings } from '../constants/menu';
import get from 'lodash/get';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../constants/pageTabs';
import { AppApi } from '../api/app';
import DialogManager from '../components/common/dialogs/Manager';
import { t } from '../helpers/export/util';
import formDefinitionUserStatus from '../helpers/menu/formDefinitionUserStatus';
import Records from '../components/Records';
import { SourcesId } from '../constants';
import { getCurrentUserName } from '../helpers/util';
import ecosFetch from '../helpers/ecosFetch';
import { PROXY_URI } from '../constants/alfresco';
import isEmpty from 'lodash/isEmpty';
import RecordActions from '../components/Records/actions/recordActions';
import { ActionTypes } from '../components/Records/actions';
import { DEFAULT_FEEDBACK_URL, DEFAULT_REPORT_ISSUE_URL } from '../helpers/menu';

export default class MenuService {
  static getSiteMenuLink = async function(menuItem, dashboard) {
    const { recordRef, dashboardKey } = getSearchParams();
    const params = [];
    let link = menuItem.targetUrl;

    if (menuItem.id === 'SETTINGS_DASHBOARD') {
      params.push(`${SearchKeys.DASHBOARD_ID}=${dashboard.id}`);

      if (recordRef) {
        params.push(`${SearchKeys.RECORD_REF}=${recordRef}`);
      }

      if (dashboardKey) {
        params.push(`${SearchKeys.DASHBOARD_KEY}=${dashboardKey}`);
      }
    }

    link += `?${params.join('&')}`;

    return link;
  };

  static getUserMenuCallback = item => {
    const config = get(item, 'config', {});
    let targetUrl = null;
    let attributes = {};
    let ignoreTabHandler = true;

    switch (item.type) {
      case MenuSettings.ItemTypes.ARBITRARY: {
        targetUrl = get(config, 'url', null);

        if (targetUrl && targetUrl.includes('http')) {
          attributes.target = '_blank';
          attributes.rel = 'noopener noreferrer';
        } else {
          ignoreTabHandler = false;
        }

        break;
      }
      case MenuSettings.ItemTypes.USER_LOGOUT: {
        return AppApi.doLogOut();
      }
      case MenuSettings.ItemTypes.USER_STATUS: {
        if (!config.isAvailable) {
          return AppApi.doToggleAvailable(config.isAvailable);
        }

        return DialogManager.showFormDialog({
          title: t('header.make-notavailable.label'),
          showDefaultButtons: true,
          modalClass: 'ecos-modal_width-sm',
          reactstrapProps: {
            backdrop: true
          },
          formDefinition: formDefinitionUserStatus,
          onSubmit: async submission => {
            const userRef = await Records.get(`${SourcesId.PEOPLE}@${getCurrentUserName()}`).load('nodeRef?str');
            const result = await ecosFetch(`${PROXY_URI}citeck/ecos/forms/node-view?formType=type&formKey=deputy:selfAbsenceEvent`, {
              method: 'POST',
              body: {
                attributes: {
                  'deputy:endAbsence': get(submission, 'data.absenceBeginning', ''),
                  'deputy:startAbsence': get(submission, 'data.absenceEnd', ''),
                  'deputy:autoAnswer': get(submission, 'data.autoAnswer', ''),
                  'deputy:user': userRef
                }
              }
            })
              .then(response => response.json())
              .catch(console.error);

            if (!isEmpty(result)) {
              await AppApi.doToggleAvailable(config.isAvailable);
            }
          }
        });
      }
      case MenuSettings.ItemTypes.USER_CHANGE_PASSWORD: {
        return RecordActions.execForRecord(`${SourcesId.PEOPLE}@${getCurrentUserName()}`, { type: ActionTypes.EDIT_PASSWORD }).catch(e =>
          console.error('error', e)
        );
      }
      case MenuSettings.ItemTypes.USER_FEEDBACK: {
        return (async function() {
          const url = await Records.get(`${SourcesId.CONFIG}@custom-feedback-url`)
            .load('value?str')
            .then(value => value || DEFAULT_FEEDBACK_URL)
            .catch(() => DEFAULT_FEEDBACK_URL);

          window.open(url || DEFAULT_FEEDBACK_URL);
        })();
      }
      case MenuSettings.ItemTypes.USER_SEND_PROBLEM_REPORT: {
        return (async function() {
          const url = await Records.get(`${SourcesId.CONFIG}@custom-report-issue-url`)
            .load('value?str', true)
            .then(value => value || DEFAULT_REPORT_ISSUE_URL)
            .catch(() => DEFAULT_REPORT_ISSUE_URL);

          window.open(url || DEFAULT_REPORT_ISSUE_URL);
        })();
      }
      default:
        break;
    }

    if (ignoreTabHandler) {
      attributes[IGNORE_TABS_HANDLER_ATTR_NAME] = true;
    }

    return {
      targetUrl,
      attributes
    };
  };
}
