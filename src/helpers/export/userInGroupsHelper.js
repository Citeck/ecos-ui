import Records from '../../components/Records';
import { getCurrentUserName } from '../../helpers/util';

const isCurrentUserInGroup = group => {
  const currentPersonName = getCurrentUserName();

  return Records.get('people@' + currentPersonName)
    .load(`.att(n:"authorities"){has(n:"${group}")}`)
    .catch(e => {
      console.error(e);
      return false;
    });
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
    .then(result => (result && result.indexOf('left') === 0 ? checkFunctionalAvailability(configKeyFromSysJournal) : false));
};
