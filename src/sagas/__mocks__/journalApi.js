export default class JournalApi {
  getLsJournalSettingId = _ => _;
  getJournalSetting = _ => ({});
  // Direct association: refs of the records the given record points at through `attributesToLoad`.
  // Empty by default — a reverse association resolves to no refs, that's what makes it "reverse".
  fetchLinkedRefs = () => Promise.resolve([]);
  // The footer sum is a plain executor now: it runs the query it is handed (`buildTotalSumQuery`).
  getTotalSum = jest.fn();
}
