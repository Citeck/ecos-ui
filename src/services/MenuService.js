import get from 'lodash/get';

import { AppApi } from '../api/app';
import DialogManager from '../components/common/dialogs/Manager';
import { SourcesId } from '../constants';
import { MenuSettings } from '../constants/menu';
import RecordActions from '../components/Records/actions/recordActions';
import { ActionTypes } from '../components/Records/actions';
import { t } from '../helpers/export/util';
import { getCurrentUserName } from '../helpers/util';
import getFormDefinitionUserStatus from '../helpers/menu/formDefinitionUserStatus';
import { changeUrl, createProfileUrl, getSearchParams, SearchKeys } from '../helpers/urls';

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

    switch (item.type) {
      case MenuSettings.ItemTypes.ARBITRARY: {
        const targetUrl = get(config, 'url', null);
        const options = {};

        if (targetUrl && targetUrl.includes('http')) {
          options.openNewBrowserTab = true;
        } else {
          options.openNewTab = true;
        }

        return changeUrl(targetUrl, options);
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
          formDefinition: getFormDefinitionUserStatus(),
          onSubmit: async submission => {
            const awayAuthDelegationEnabled = get(submission, 'data.awayAuthDelegationEnabled');
            await AppApi.doToggleAvailable(config.isAvailable, awayAuthDelegationEnabled);
          }
        });
      }
      case MenuSettings.ItemTypes.USER_CHANGE_PASSWORD: {
        return RecordActions.execForRecord(`${SourcesId.PERSON}@${getCurrentUserName()}`, { type: ActionTypes.EDIT_PASSWORD }).catch(e =>
          console.error('error', e)
        );
      }
      case MenuSettings.ItemTypes.USER_FEEDBACK: {
        return (async function() {
          const url = await AppApi.getCustomFeedbackUrl();
          window.open(url);
        })();
      }
      case MenuSettings.ItemTypes.USER_PROFILE: {
        const targetUrl = createProfileUrl(encodeURIComponent(getCurrentUserName()));

        return changeUrl(targetUrl, { openNewTab: true });
      }
      case MenuSettings.ItemTypes.USER_SEND_PROBLEM_REPORT: {
        return (async function() {
          const url = await AppApi.getCustomReportIssueUrl();
          window.open(url);
        })();
      }
      default:
        break;
    }
  };
}
