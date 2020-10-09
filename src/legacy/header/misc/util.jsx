import { getCurrentLocale, t } from '../../common/util';
import Records from '../../../components/Records';
import { SourcesId } from '../../../constants';

const BYTES_KB = 1024;
const BYTES_MB = 1048576;
const BYTES_GB = 1073741824;

const DEFAULT_FEEDBACK_URL = 'https://www.citeck.ru/feedback';
const DEFAULT_REPORT_ISSUE_URL =
  'mailto:support@citeck.ru?subject=Ошибка в работе Citeck ECOS: краткое описание&body=Summary: Короткое описание проблемы (продублировать в теме письма)%0A%0ADescription:%0AПожалуйста, детально опишите возникшую проблему, последовательность действий, которая привела к ней. При необходимости приложите скриншоты.';

// From FileSizeMixin.js (modified)
export function formatFileSize(fileSize, decimalPlaces) {
  decimalPlaces = decimalPlaces || 0;
  if (typeof fileSize === 'string') {
    fileSize = fileSize.replace(/,/gi, '');
    fileSize = parseInt(fileSize, 10);
  }
  if (fileSize < BYTES_KB) {
    return fileSize + ' ' + t('size.bytes');
  } else if (fileSize < BYTES_MB) {
    fileSize = (fileSize / BYTES_KB).toFixed(decimalPlaces);
    return fileSize + ' ' + t('size.kilobytes');
  } else if (fileSize < BYTES_GB) {
    fileSize = (fileSize / BYTES_MB).toFixed(decimalPlaces);
    return fileSize + ' ' + t('size.megabytes');
  } else if (isNaN(fileSize)) {
    // special case for missing content size
    return '0 ' + t('size.bytes');
  } else {
    fileSize = (fileSize / BYTES_GB).toFixed(decimalPlaces);
    return fileSize + ' ' + t('size.gigabytes');
  }
}

// From TemporalUtil.js (modified)
// TODO use moment.js in future
export function getRelativeTime(from, to) {
  const originalFrom = from;
  if (typeof from === 'string') {
    from = new Date(from);
  }

  if (!(from instanceof Date)) {
    return {
      relative: originalFrom,
      formatted: originalFrom
    };
  }

  if (typeof to === 'undefined') {
    to = new Date();
  } else if (typeof to === 'string') {
    to = new Date(to);
  }

  const seconds_ago = (to - from) / 1000;
  const minutes_ago = Math.floor(seconds_ago / 60);

  const fnTime = (...args) => {
    let locale = getCurrentLocale();
    let formatted = '';
    if (typeof from.toLocaleString === 'function') {
      formatted = from.toLocaleString(locale);
    } else {
      formatted = from.toString();
    }

    return {
      relative: t(...args),
      formatted
    };
  };

  if (minutes_ago <= 0) {
    return fnTime('relative.seconds', seconds_ago);
  }
  if (minutes_ago === 1) {
    return fnTime('relative.minute');
  }
  if (minutes_ago < 45) {
    return fnTime('relative.minutes', minutes_ago);
  }
  if (minutes_ago < 90) {
    return fnTime('relative.hour');
  }

  const hours_ago = Math.round(minutes_ago / 60);
  if (minutes_ago < 1440) {
    return fnTime('relative.hours', hours_ago);
  }
  if (minutes_ago < 2880) {
    return fnTime('relative.day');
  }

  const days_ago = Math.round(minutes_ago / 1440);
  if (minutes_ago < 43200) {
    return fnTime('relative.days', days_ago);
  }
  if (minutes_ago < 86400) {
    return fnTime('relative.month');
  }

  const months_ago = Math.round(minutes_ago / 43200);
  if (minutes_ago < 525960) {
    return fnTime('relative.months', months_ago);
  }
  if (minutes_ago < 1051920) {
    return fnTime('relative.year');
  }

  const years_ago = Math.round(minutes_ago / 525960);
  return fnTime('relative.years', years_ago);
}

export function makeSiteMenuItems(user, siteData) {
  let siteMenuItems = [];

  if (!(!user.isAdmin && siteData.profile.visibility !== 'PUBLIC' && siteData.userIsMember === false)) {
    // siteMenuItems = getSiteNavigationWidgets();
    siteMenuItems = [
      {
        id: 'HEADER_SITE_DASHBOARD',
        label: 'page.siteDashboard.title',
        targetUrl: '/share/page/site/' + siteData.siteId + '/dashboard'
      }
    ];

    let pages = [
      { pageId: 'documentlibrary', title: 'Каталог', pageUrl: 'documentlibrary' },
      { pageId: 'wiki-page', title: 'Журналы', pageUrl: 'journals2/list/main' },
      { pageId: 'blog-postlist', title: 'Управление типами кейсов на сайте', pageUrl: 'site-document-types' }
    ];

    for (var i = 0; i < pages.length; i++) {
      var targetUrl = '/share/page/site/' + siteData.siteId + '/' + pages[i].pageUrl;
      siteMenuItems.push({
        id: 'HEADER_SITE_' + pages[i].pageId.toUpperCase(),
        label: pages[i].sitePageTitle ? pages[i].sitePageTitle : pages[i].title,
        targetUrl: targetUrl
      });
    }

    siteMenuItems.push({
      id: 'HEADER_SITE_MEMBERS',
      label: 'page.siteMembers.title',
      targetUrl: '/share/page/site/' + siteData.siteId + '/site-members'
    });
  }

  // If the user is an admin, and a site member, but NOT the site manager then
  // add the menu item to let them become a site manager...
  if (user.isAdmin && siteData.userIsMember && !siteData.userIsSiteManager) {
    siteMenuItems.push({
      id: 'HEADER_BECOME_SITE_MANAGER',
      label: 'become_site_manager.label',
      control: {
        type: 'ALF_BECOME_SITE_MANAGER',
        payload: {
          site: siteData.siteId,
          siteTitle: siteData.profile.title,
          user: user.name,
          userFullName: user.fullName,
          reloadPage: true
        }
      }
    });
  }

  // If the user is a site manager then let them make custmomizations...
  if (siteData.userIsSiteManager) {
    // Add Customize Dashboard
    siteMenuItems.push({
      id: 'HEADER_CUSTOMIZE_SITE_DASHBOARD',
      label: 'customize_dashboard.label',
      targetUrl: '/share/page/site/' + siteData.siteId + '/customise-site-dashboard'
    });

    // Add the regular site manager options (edit site, customize site, leave site)
    siteMenuItems.push(
      {
        id: 'HEADER_EDIT_SITE_DETAILS',
        label: 'edit_site_details.label',
        control: {
          type: 'ALF_EDIT_SITE',
          payload: {
            site: siteData.siteId,
            siteTitle: siteData.profile.title,
            user: user.name,
            userFullName: user.fullName
          }
        }
      },
      {
        id: 'HEADER_CUSTOMIZE_SITE',
        label: 'customize_site.label',
        targetUrl: '/share/page/site/' + siteData.siteId + '/customise-site'
      },
      {
        id: 'HEADER_LEAVE_SITE',
        label: 'leave_site.label',
        control: {
          type: 'ALF_LEAVE_SITE',
          payload: {
            site: siteData.siteId,
            siteTitle: siteData.profile.title,
            user: user.name,
            userFullName: user.fullName
          }
        }
      }
    );
  } else if (siteData.userIsMember) {
    // If the user is a member of a site then give them the option to leave...
    siteMenuItems.push({
      id: 'HEADER_LEAVE_SITE',
      label: 'leave_site.label',
      control: {
        type: 'ALF_LEAVE_SITE',
        payload: {
          site: siteData.siteId,
          siteTitle: siteData.profile.title,
          user: user.name,
          userFullName: user.fullName
        }
      }
    });
  } else if (siteData.profile.visibility !== 'PRIVATE' || user.isAdmin) {
    // If the member is not a member of a site then give them the option to join...
    siteMenuItems.push({
      id: 'HEADER_JOIN_SITE',
      label: siteData.profile.visibility === 'MODERATED' ? 'join_site_moderated.label' : 'join_site.label',
      control: {
        type: siteData.profile.visibility === 'MODERATED' ? 'ALF_REQUEST_SITE_MEMBERSHIP' : 'ALF_JOIN_SITE',
        payload: {
          site: siteData.siteId,
          siteTitle: siteData.profile.title,
          user: user.name,
          userFullName: user.fullName
        }
      }
    });
  }

  return siteMenuItems;
}

export function processMenuItemsFromOldMenu(oldMenuItems) {
  let siteMenuItems = [];

  for (let item of oldMenuItems) {
    if (!item.config) {
      continue;
    }

    let newItem = {
      id: item.id,
      label: item.config.label
    };

    if (item.config.targetUrl) {
      if (item.config.targetUrlType && item.config.targetUrlType === 'FULL_PATH') {
        newItem.targetUrl = item.config.targetUrl;
      } else {
        newItem.targetUrl = '/share/page/' + item.config.targetUrl;
      }

      if (item.config.targetUrlLocation && item.config.targetUrlLocation === 'NEW') {
        newItem.target = '_blank';
      }
    }

    if (item.config.publishTopic) {
      newItem.control = {
        type: item.config.publishTopic
      };
      if (item.config.publishPayload) {
        newItem.control.payload = item.config.publishPayload;
      }
    }

    siteMenuItems.push(newItem);
  }

  return siteMenuItems;
}

export const makeUserMenuItems = (userName, isAvailable, isMutable, isExternalAuthentication) => {
  const customFeedbackUrlPromise = Records.get(`${SourcesId.CONFIG}@custom-feedback-url`)
    .load('value?str')
    .then(value => value || DEFAULT_FEEDBACK_URL)
    .catch(() => DEFAULT_FEEDBACK_URL);
  const customReportIssueUrlPromise = Records.get(`${SourcesId.CONFIG}@custom-report-issue-url`)
    .load('value?str', true)
    .then(value => value || DEFAULT_REPORT_ISSUE_URL)
    .catch(() => DEFAULT_REPORT_ISSUE_URL);

  return Promise.all([customFeedbackUrlPromise, customReportIssueUrlPromise]).then(urls => {
    const availability = 'make-' + (isAvailable === false ? '' : 'not') + 'available';

    let userMenuItems = [];

    userMenuItems.push(
      {
        id: 'HEADER_USER_MENU_MY_PROFILE',
        label: 'header.my-profile.label',
        targetUrl: '/share/page/user/' + encodeURIComponent(userName) + '/profile'
      },
      {
        id: 'HEADER_USER_MENU_AVAILABILITY',
        label: 'header.' + availability + '.label',
        targetUrl: '/share/page/components/deputy/make-available?available=' + (isAvailable === false ? 'true' : 'false'),
        control:
          isAvailable === false
            ? null
            : {
                type: 'ALF_SHOW_MODAL_MAKE_UNAVAILABLE',
                payload: {
                  isAvailable,
                  targetUrl: '/share/page/components/deputy/make-available?available=' + (isAvailable === false ? 'true' : 'false')
                }
              }
      }
    );

    if (isMutable) {
      userMenuItems.push({
        id: 'HEADER_USER_MENU_PASSWORD',
        label: 'header.change-password.label',
        targetUrl: '/share/page/user/' + encodeURIComponent(userName) + '/change-password'
      });
    }

    const customFeedbackUrl = urls[0] || DEFAULT_FEEDBACK_URL;
    const customReportIssueUrl = urls[1] || DEFAULT_REPORT_ISSUE_URL;
    userMenuItems.push(
      {
        id: 'HEADER_USER_MENU_FEEDBACK',
        label: 'header.feedback.label',
        targetUrl: customFeedbackUrl,
        targetUrlType: 'FULL_PATH',
        target: '_blank'
      },
      {
        id: 'HEADER_USER_MENU_REPORTISSUE',
        label: 'header.reportIssue.label',
        targetUrl: customReportIssueUrl,
        targetUrlType: 'FULL_PATH',
        target: '_blank'
      }
    );

    if (!isExternalAuthentication) {
      userMenuItems.push({
        id: 'HEADER_USER_MENU_LOGOUT',
        label: 'header.logout.label',
        control: {
          type: 'ALF_DOLOGOUT'
        }
      });
    }

    return userMenuItems;
  });
};
