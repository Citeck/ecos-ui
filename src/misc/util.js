export function generateSearchTerm(terms, hiddenSearchTerms) {
  let searchTerm = hiddenSearchTerms ? '(' + terms + ') ' + hiddenSearchTerms : terms;

  return encodeURIComponent(searchTerm);
}

// TODO
export function t(messageId, multipleValues, scope = 'global') {
  // https://dev.alfresco.com/resource/docs/aikau-jsdoc/Core.js.html
  if (!messageId) {
    return '';
  }

  if (!window.Alfresco) {
    return messageId;
  }

  return window.Alfresco.util.message(messageId, scope, multipleValues);
}
