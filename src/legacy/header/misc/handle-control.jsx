import { t } from '../../common/util';
import { showModal, hideModal, leaveSiteRequest, joinSiteRequest, becomeSiteManagerRequest, requestSiteMembership } from '../actions';
import ecosFetch from '../../../helpers/ecosFetch';
import DialogManager from '../../../components/common/dialogs/Manager';
import Records from '../../../components/Records';
import { getCurrentUserName } from '../../../helpers/util';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

const Alfresco = window.Alfresco || {};
const Citeck = window.Citeck || {};

export default function handleControl(type, payload, dispatch) {
  switch (type) {
    case 'ALF_DOLOGOUT':
      fetch(Alfresco.constants.URL_SERVICECONTEXT + 'dologout', {
        method: 'POST'
      }).then(() => {
        window.location.reload();
      });
      break;

    case 'ALF_SHOW_MODAL_MAKE_UNAVAILABLE':
      return (() => {
        if (!payload.isAvailable) {
          ecosFetch('/share/page/components/deputy/make-available?available=true').then(() => {
            window.location.reload();
          });
          return;
        }

        DialogManager.showFormDialog({
          title: t('header.make-notavailable.label'),
          showDefaultButtons: true,
          modalClass: 'ecos-modal_width-sm',
          reactstrapProps: {
            backdrop: true
          },
          formDefinition: {
            display: 'form',
            components: [
              {
                key: 'absenceBeginning',
                type: 'datetime',
                label: 'Начало отсутствия',
                labelPosition: 'left-left',
                format: 'yyyy-MM-dd H:mm',
                displayInTimezone: 'viewer',
                datepickerMode: 'day',
                customDefaultValue: 'value = moment();',
                datePicker: {
                  minDate: 'moment()'
                },
                timePicker: {
                  showMeridian: false
                }
              },
              {
                key: 'absenceEnd',
                type: 'datetime',
                label: 'Окончание отсутствия',
                labelPosition: 'left-left',
                format: 'yyyy-MM-dd H:mm',
                displayInTimezone: 'viewer',
                datepickerMode: 'day',
                customDefaultValue: "value = moment().add(5, 'm');",
                datePicker: {
                  minDate: "moment().add(1, 'm')"
                },
                timePicker: {
                  showMeridian: false
                },
                validate: {
                  required: true,
                  custom: "valid = moment(data.dateTime2).isBefore(value) ? true : 'Дата начала не может быть больше даты окончания';"
                }
              },
              {
                key: 'autoAnswer',
                type: 'textarea',
                label: 'Автоответ',
                labelPosition: 'left-left'
              }
            ]
          },
          onSubmit: async submission => {
            const userRef = await Records.get(`people@${getCurrentUserName()}`).load('nodeRef?str');
            const result = await ecosFetch(
              '/share/proxy/alfresco/citeck/ecos/forms/node-view?formType=type&formKey=deputy:selfAbsenceEvent',
              {
                method: 'POST',
                body: {
                  attributes: {
                    'deputy:endAbsence': get(submission, 'data.absenceBeginning', ''),
                    'deputy:startAbsence': get(submission, 'data.absenceEnd', ''),
                    'deputy:autoAnswer': get(submission, 'data.autoAnswer', ''),
                    'deputy:user': userRef
                  }
                }
              }
            )
              .then(response => response.json())
              .catch(e => {
                console.error(e);
              });

            if (!isEmpty(result)) {
              await ecosFetch('/share/page/components/deputy/make-available?available=false').then(() => {
                window.location.reload();
              });
            }
          }
        });
      })();

    case 'ALF_NAVIGATE_TO_PAGE':
      // TODO improve it
      // if (payload.targetUrlType === 'FULL_PATH')
      if (payload.target && payload.target === '_blank') {
        window.open(payload.url, '_blank');
      } else {
        window.location.href = payload.url;
      }
      break;

    case 'ALF_EDIT_SITE':
      if (Alfresco && Alfresco.module && typeof Alfresco.module.getEditSiteInstance === 'function') {
        Alfresco.module.getEditSiteInstance().show({
          shortName: payload.site
        });
      } else {
        const legacyEditSiteResource =
          Alfresco.constants.URL_RESCONTEXT + 'modules/edit-site' + (Alfresco.constants.DEBUG ? '.js' : '-min.js');
        require([legacyEditSiteResource], function() {
          Alfresco.module.getEditSiteInstance().show({
            shortName: payload.site
          });
        });
      }

      break;

    case 'ALF_LEAVE_SITE':
      dispatch(
        showModal({
          title: t('message.leave', { '0': payload.siteTitle }),
          content: t('message.leave-site-prompt', { '0': payload.siteTitle }),
          buttons: [
            {
              label: t('button.leave-site.confirm-label'),
              onClick: () => {
                dispatch(leaveSiteRequest(payload));
                dispatch(hideModal());
              },
              color: 'primary'
            },
            {
              label: t('button.leave-site.cancel-label'),
              isCloseButton: true
            }
          ]
        })
      );
      break;

    case 'ALF_JOIN_SITE':
      dispatch(joinSiteRequest(payload));
      break;

    case 'ALF_BECOME_SITE_MANAGER':
      dispatch(becomeSiteManagerRequest(payload));
      break;

    case 'ALF_REQUEST_SITE_MEMBERSHIP':
      dispatch(requestSiteMembership(payload));
      break;

    case 'ECOS_CREATE_VARIANT':
      Citeck.forms.handleHeaderCreateVariant(payload);
      break;

    default:
      console.log('Unknown control type: ', type);
  }
}
