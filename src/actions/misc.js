export function loadOrgStructUsers(searchText = '') {
  return (dispatch, getState, { api }) => {
    return api.orgStruct.getUsers(searchText).then(json => {
      return json.map(item => {
        return { value: item.nodeRef, label: item.displayName };
      });
    });
  };
}
