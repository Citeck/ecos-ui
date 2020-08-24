import Records from '../../components/Records';
import { getCurrentUserName } from '../../helpers/util';

const isCurrentUserInGroup = group => {
  const currentPersonName = getCurrentUserName();
  return Records.queryOne(
    {
      query: `TYPE:"cm:authority" AND =cm:authorityName:"${group}"`,
      language: 'fts-alfresco'
    },
    'cm:member[].cm:userName'
  ).then(usernames => (usernames || []).includes(currentPersonName));
};

const checkFunctionalAvailability = configKeyFromSysJournal => {
  return Records.get(`ecos-config@${configKeyFromSysJournal}`)
    .load('.str')
    .then(groupsInOneString => {
      if (!groupsInOneString) {
        return false;
      }
      const groups = groupsInOneString.split(',');
      const results = [];
      groups.forEach(group => results.push(isCurrentUserInGroup(group)));
      return Promise.all(results).then(values => (values || []).includes(true));
    });
};

/**
 * Function for checking availability functional for user by group's list
 * @param configKeyFromSysJournal - Key of config contains groups list
 * @returns {void|*|PromiseLike<any>|Promise<any>}
 */
export const checkFunctionalAvailabilityForUser = configKeyFromSysJournal => {
  return Records.get('ecos-config@default-ui-main-menu')
    .load('.str')
    .then(result => (result.indexOf('left') === 0 ? checkFunctionalAvailability(configKeyFromSysJournal) : false));
};
