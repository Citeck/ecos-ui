export const selectedMenuItemIdKey = 'selectedMenuItemId';

export function fetchExpandableItems(items, selectedId) {
  let flatList = [];
  items.map(item => {
    const hasNestedList = !!item.items;
    if (hasNestedList) {
      let isNestedListExpanded = !!item.sectionTitle || hasChildWithId(item.items, selectedId);
      flatList.push(
        {
          id: item.id,
          hasNestedList,
          isNestedListExpanded
        },
        ...fetchExpandableItems(item.items, selectedId)
      );
    }
    return null;
  });

  return flatList;
}

export function hasChildWithId(items, selectedId) {
  let childIndex = items.findIndex(item => item.id === selectedId);
  if (childIndex !== -1) {
    return true;
  }

  let totalItems = items.length;

  for (let i = 0; i < totalItems; i++) {
    if (!items[i].items) {
      continue;
    }

    let hasChild = hasChildWithId(items[i].items, selectedId);
    if (hasChild) {
      return true;
    }
  }

  return false;
}

export function getNewJournalsPageEnable() {
  var isCurrentUserInGroup = function isCurrentUserInGroup(group) {
    var currentPersonName = window.Alfresco.constants.USERNAME;
    return window.Citeck.Records.queryOne(
      {
        query: 'TYPE:"cm:authority" AND =cm:authorityName:"' + group + '"',
        language: 'fts-alfresco'
      },
      'cm:member[].cm:userName'
    ).then(function(usernames) {
      return (usernames || []).indexOf(currentPersonName) !== -1;
    });
  };
  var checkJournalsAvailability = function isShouldDisplayJournals() {
    return window.Citeck.Records.get('ecos-config@default-ui-left-menu-access-groups')
      .load('.str')
      .then(function(groupsInOneString) {
        if (!groupsInOneString) {
          return false;
        }

        var groups = groupsInOneString.split(',');
        var results = [];
        for (var groupsCounter = 0; groupsCounter < groups.length; ++groupsCounter) {
          results.push(isCurrentUserInGroup.call(this, groups[groupsCounter]));
        }
        return Promise.all(results).then(function(values) {
          return values.indexOf(false) === -1;
        });
      });
  };
  var checkJournalsAvailabilityForUser = function isShouldDisplayJournalForUser() {
    return window.Citeck.Records.get('ecos-config@default-ui-main-menu')
      .load('.str')
      .then(function(result) {
        if (result === 'left') {
          return checkJournalsAvailability.call(this);
        }
        return false;
      });
  };

  const isNewJournalPageEnable = window.Citeck.Records.get('ecos-config@new-journals-page-enable').load('.bool');
  const isJournalAvailibleForUser = checkJournalsAvailabilityForUser.call(this);

  return Promise.all([isNewJournalPageEnable, isJournalAvailibleForUser]).then(function(values) {
    return values[0] || values[1];
  });
}
