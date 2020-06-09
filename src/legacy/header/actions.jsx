import { makeUserMenuItems, processMenuItemsFromOldMenu } from './misc/util';
import { t } from '../common/util';
import MenuConverter from '../../dto/menu';

const Alfresco = window.Alfresco || {};

/* MODAL */
export const SHOW_MODAL = 'SHOW_MODAL';
export const HIDE_MODAL = 'HIDE_MODAL';

export function showModal(payload) {
  return {
    type: SHOW_MODAL,
    payload
  };
}

export function hideModal() {
  return {
    type: HIDE_MODAL
  };
}
/* ---------------- */

/* Search */
export const SEARCH_AUTOCOMPLETE_VISIBILITY_TOGGLE = 'SEARCH_AUTOCOMPLETE_VISIBILITY_TOGGLE';
export const SEARCH_AUTOCOMPLETE_UPDATE_RESULTS = 'SEARCH_AUTOCOMPLETE_UPDATE_RESULTS';
export const SEARCH_AUTOCOMPLETE_UPDATE_DOCUMENTS_RESULTS = 'SEARCH_AUTOCOMPLETE_UPDATE_DOCUMENTS_RESULTS';
export const SEARCH_SET_LAST_SEARCH_INDEX = 'SEARCH_SET_LAST_SEARCH_INDEX';

export function setLastSearchIndex(payload) {
  return {
    type: SEARCH_SET_LAST_SEARCH_INDEX,
    payload
  };
}

export function getSearchTextFromHistory(isDesc, successCallback) {
  return (dispatch, getState, api) => {
    if (!('localStorage' in window && window.localStorage !== null)) {
      return null;
    }

    const searchPhrases = JSON.parse(localStorage.getItem('ALF_SEARCHBOX_HISTORY'));

    const state = getState();
    let lastSearchIndex = state.search.lastSearchIndex;

    if (isDesc) {
      // Up Arrow press
      if (lastSearchIndex === 0 || lastSearchIndex === null) {
        lastSearchIndex = searchPhrases.length - 1;
      } else {
        lastSearchIndex--;
      }
    } else {
      // Down Arrow press
      if (lastSearchIndex === searchPhrases.length - 1 || lastSearchIndex === null) {
        lastSearchIndex = 0;
      } else {
        lastSearchIndex++;
      }
    }

    dispatch(setLastSearchIndex(lastSearchIndex));
    typeof successCallback === 'function' && successCallback(searchPhrases[lastSearchIndex]);
  };
}

export function toggleAutocompleteVisibility(payload) {
  return {
    type: SEARCH_AUTOCOMPLETE_VISIBILITY_TOGGLE,
    payload
  };
}

export function updateAutocompleteResults(payload) {
  return {
    type: SEARCH_AUTOCOMPLETE_UPDATE_RESULTS,
    payload
  };
}

export function updateAutocompleteDocumentsResults(payload) {
  return {
    type: SEARCH_AUTOCOMPLETE_UPDATE_DOCUMENTS_RESULTS,
    payload
  };
}

export function fetchAutocompleteItems(payload, successCallback) {
  return (dispatch, getState, api) => {
    if (payload.length < 2) {
      dispatch(
        updateAutocompleteResults({
          documents: { items: [], hasMoreRecords: false },
          sites: { items: [] },
          people: { items: [] }
        })
      );
      return;
    }

    let promises = [api.getLiveSearchDocuments(payload, 0), api.getLiveSearchSites(payload), api.getLiveSearchPeople(payload)];

    Promise.all(promises).then(([documents, sites, people]) => {
      dispatch(updateAutocompleteResults({ documents, sites, people }));
      typeof successCallback === 'function' && successCallback();
    });
  };
}

export function fetchMoreAutocompleteDocuments(payload) {
  return (dispatch, getState, api) => {
    const state = getState();
    const documentsQty = state.search.autocomplete.documents.items.length;

    api.getLiveSearchDocuments(payload, documentsQty).then(documents => {
      dispatch(updateAutocompleteDocumentsResults(documents));
    });
  };
}
/* ---------------- */

/* Create case menu */
export const CREATE_CASE_WIDGET_SET_ITEMS = 'CREATE_CASE_WIDGET_SET_ITEMS';
export const CREATE_CASE_WIDGET_SET_IS_CASCADE = 'CREATE_CASE_WIDGET_SET_IS_CASCADE';

export function setCreateCaseWidgetItems(payload) {
  return {
    type: CREATE_CASE_WIDGET_SET_ITEMS,
    payload
  };
}

export function setCreateCaseWidgetIsCascade(payload) {
  return {
    type: CREATE_CASE_WIDGET_SET_IS_CASCADE,
    payload
  };
}
/* ---------------- */

/* User */
export const USER_SET_FULLNAME = 'USER_SET_FULLNAME';
export const USER_SET_PHOTO = 'USER_SET_PHOTO';

export function setUserFullName(payload) {
  return {
    type: USER_SET_FULLNAME,
    payload
  };
}

export function setUserPhoto(payload) {
  return {
    type: USER_SET_PHOTO,
    payload
  };
}
/* ---------------- */

/* User menu */
export const USER_MENU_SET_ITEMS = 'USER_MENU_SET_ITEMS';

export function setUserMenuItems(payload) {
  return {
    type: USER_MENU_SET_ITEMS,
    payload
  };
}

export function loadUserMenuPhoto(userNodeRef) {
  return (dispatch, getState, api) => {
    if (!userNodeRef) {
      return;
    }

    api.getPhotoSize(userNodeRef).then(size => {
      if (size > 0) {
        let photoUrl =
          window.Alfresco.constants.PROXY_URI + `citeck/ecos/image/thumbnail?nodeRef=${userNodeRef}&property=ecos:photo&width=150`;
        dispatch(setUserPhoto(photoUrl));
      }
    });
  };
}
/* ---------------- */

/* Site menu */
export const SITE_MENU_SET_SITE_MENU_ITEMS = 'SITE_MENU_SET_SITE_MENU_ITEMS';

export function setCurrentSiteMenuItems(payload) {
  return {
    type: SITE_MENU_SET_SITE_MENU_ITEMS,
    payload
  };
}
/* ---------------- */

/* View */
export const VIEW_SET_IS_MOBILE = 'VIEW_SET_IS_MOBILE';

export function setIsMobile(payload) {
  return {
    type: VIEW_SET_IS_MOBILE,
    payload
  };
}
/* ---------------- */

/* COMMON */
export function loadTopMenuData(userName, isUserAvailable, isUserMutable, isExternalAuthentication, oldMenuSiteWidgetItems) {
  return (dispatch, getState, api) => {
    const promises = [];
    const getCreateCaseMenuDataRequest = api.getCreateVariantsForAllSites().then(sites => {
      let menuItems = [];

      // TODO add it to API response
      menuItems.push({
        id: 'HEADER_CREATE_WORKFLOW',
        label: 'header.create-workflow.label',
        items: [
          {
            id: 'HEADER_CREATE_WORKFLOW_ADHOC',
            label: 'header.create-workflow-adhoc.label',
            targetUrl: '/share/page/workflow-start-page?formType=workflowId&formKey=activiti$perform'
          },
          {
            id: 'HEADER_CREATE_WORKFLOW_CONFIRM',
            label: 'header.create-workflow-confirm.label',
            targetUrl: '/share/page/start-specified-workflow?workflowId=activiti$confirm'
          }
        ]
      });

      for (let site of sites) {
        let createVariants = [];
        for (let variant of site.createVariants) {
          if (!variant.canCreate) {
            continue;
          }

          createVariants.push({
            id: 'HEADER_' + (site.siteId + '_' + variant.type).replace(/\-/g, '_').toUpperCase(),
            label: variant.title,
            control: {
              type: 'ECOS_CREATE_VARIANT',
              payload: variant
            }
          });
        }

        menuItems.push({
          id: 'HEADER_' + site.siteId.replace(/\-/g, '_').toUpperCase(),
          siteId: site.siteId,
          label: site.siteTitle,
          items: createVariants
        });
      }

      return menuItems;
    });
    const getCreateCustomMenuDataRequest = api.getCustomCreateVariants().then(items => MenuConverter.getCreateCustomItems(items));

    promises.push(getCreateCaseMenuDataRequest);
    promises.push(getCreateCustomMenuDataRequest);

    Promise.all(promises)
      .then(([_sites, _customs]) => {
        const { sites, customs } = MenuConverter.mergeCustomsAndSites(_customs, _sites);
        return makeUserMenuItems(userName, isUserAvailable, isUserMutable, isExternalAuthentication).then(items => {
          return {
            createCaseMenu: [].concat(customs, sites),
            siteMenu: processMenuItemsFromOldMenu(oldMenuSiteWidgetItems),
            userMenu: items
          };
        });
      })
      .then(result => {
        dispatch(setCreateCaseWidgetItems(result.createCaseMenu));
        dispatch(setCurrentSiteMenuItems(result.siteMenu));
        dispatch(setUserMenuItems(result.userMenu));
      });
  };
}

export function leaveSiteRequest({ site, siteTitle, user, userFullName }) {
  return (dispatch, getState, api) => {
    const url = Alfresco.constants.PROXY_URI + `api/sites/${encodeURIComponent(site)}/memberships/${encodeURIComponent(user)}`;
    return fetch(url, {
      method: 'DELETE'
    })
      .then(resp => {
        if (resp.status !== 200) {
          return dispatch(
            showModal({
              content: t('message.leave-failure', { '0': userFullName, '1': siteTitle }),
              buttons: [
                {
                  label: t('button.close-modal'),
                  isCloseButton: true
                }
              ]
            })
          );
        }

        dispatch(
          showModal({
            content: t('message.leaving', { '0': userFullName, '1': siteTitle })
          })
        );

        window.location.href = Alfresco.constants.URL_PAGECONTEXT + 'user/' + encodeURIComponent(user) + '/dashboard';
      })
      .catch(err => {
        console.log('error', err);
      });
  };
}

export function joinSiteRequest({ site, siteTitle, user, userFullName }) {
  return (dispatch, getState, api) => {
    const url = Alfresco.constants.PROXY_URI + `api/sites/${encodeURIComponent(site)}/memberships`;
    const data = {
      role: 'SiteConsumer',
      person: {
        userName: user
      }
    };

    return fetch(url, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(resp => {
        if (resp.status !== 200) {
          // TODO
          console.log('joinSiteRequest err', resp);
          return;
        }

        dispatch(
          showModal({
            content: t('message.joining', { '0': user, '1': site })
          })
        );

        window.location.reload();
      })
      .catch(err => {
        console.log('error', err);
      });
  };
}

export function becomeSiteManagerRequest({ site, siteTitle, user, userFullName }) {
  return (dispatch, getState, api) => {
    const url = Alfresco.constants.PROXY_URI + `api/sites/${encodeURIComponent(site)}/memberships`;
    const data = {
      role: 'SiteManager',
      person: {
        userName: user ? user : Alfresco.constants.USERNAME
      }
    };

    return fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(resp => {
        if (resp.status !== 200) {
          // TODO
          console.log('becomeSiteManagerRequest err', resp);
          return;
        }

        window.location.reload();
      })
      .catch(err => {
        console.log('error', err);
      });
  };
}

export function requestSiteMembership({ site, siteTitle, user, userFullName }) {
  return (dispatch, getState, api) => {
    const url = Alfresco.constants.PROXY_URI + `api/sites/${encodeURIComponent(site)}/invitations`;
    const data = {
      invitationType: 'MODERATED',
      inviteeRoleName: 'SiteConsumer',
      inviteeUserName: user,
      inviteeComments: ''
    };

    return fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(resp => {
        // console.log('requestSiteMembership resp', resp);
        if (resp.status !== 200) {
          const responseMessage = resp.message;
          const requestPendingMessage = 'A request to join this site is in pending'; // NOTE: This is a string-literal in Share's "Site.java" file
          const failedBecausePending = responseMessage && responseMessage.indexOf(requestPendingMessage) !== -1;
          const failureMessage = failedBecausePending ? 'message.request-join-site-pending-failure' : 'message.request-join-site-failure';
          dispatch(
            showModal({
              content: t(failureMessage)
            })
          );
          return;
        }

        return dispatch(
          showModal({
            title: t('message.request-join-success-title'),
            content: t('message.request-join-success', { '0': user, '1': siteTitle || site }),
            onCloseCallback: () => {
              window.location.href = Alfresco.constants.URL_PAGECONTEXT + 'user/' + encodeURIComponent(user) + '/dashboard';
            },
            buttons: [
              {
                label: t('button.leave-site.confirm-label'),
                isCloseButton: true
              }
            ]
          })
        );
      })
      .catch(err => {
        console.log('error', err);
      });
  };
}
