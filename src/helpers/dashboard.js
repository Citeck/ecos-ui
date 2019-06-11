export function parseDashboardSaveResult(result) {
  if (!result || (result && !Object.keys(result).length)) {
    return {};
  }
  const DIV = '@';
  const fullId = result._id || '';
  const recordId = fullId && fullId.indexOf(DIV) ? fullId.split(DIV)[1] : null;

  const target = {
    recordId
  };
}
