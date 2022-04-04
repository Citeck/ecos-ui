import Records from '../../components/Records';
import { getCurrentUserName } from '../util';
import { SourcesId } from '../../constants';

const isCurrentUserInGroup = group => {
  const currentPersonName = getCurrentUserName();

  return Records.get(`${SourcesId.PERSON}@${currentPersonName}`)
    .load(`authorities._has.${group}?bool`)
    .catch(e => {
      console.error(e);
      return false;
    });
};

const checkFunctionalAvailability = configKeyFromSysJournal => {
  return Records.get(`${SourcesId.UI_CFG}@${configKeyFromSysJournal}`)
    .load('value[]?str')
    .then(groupsList => {
      if (!groupsList || !groupsList.length) {
        return true;
      }
      const results = [];

      groupsList.forEach(group => results.push(isCurrentUserInGroup(group)));

      return Promise.all(results).then(values => (values || []).includes(true));
    });
};

/**
 * Function for checking availability functional for user by group's list
 * @param configKeyFromSysJournal - Key of config contains groups list
 * @returns {void|*|PromiseLike<any>|Promise<any>}
 */
export const checkFunctionalAvailabilityForUser = configKeyFromSysJournal => {
  return Records.get(`${SourcesId.UI_CFG}@main-menu-type`)
    .load('value?str')
    .then(result => (result && result.indexOf('left') === 0 ? checkFunctionalAvailability(configKeyFromSysJournal) : false));
};
