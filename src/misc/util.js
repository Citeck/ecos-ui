export function generateSearchTerm(terms, hiddenSearchTerms) {
  let searchTerm = hiddenSearchTerms ? '(' + terms + ') ' + hiddenSearchTerms : terms;

  return encodeURIComponent(searchTerm);
}
