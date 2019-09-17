export default class SidebarService {
  static styleLevel = {
    noIcon: level => {
      return ![1].includes(level);
    },
    noBadge: level => {
      return ![1].includes(level);
    },
    noToggle: level => {
      return ![1].includes(level);
    },
    isDefExpanded: level => {
      return ![1].includes(level);
    }
  };
}
