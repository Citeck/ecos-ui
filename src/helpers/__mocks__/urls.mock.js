export const history = Object.freeze({
  location: Object.freeze({
    pathname: '',
    search: ''
  }),
  history: Object.freeze([]),
  push: function({ search, pathname }) {
    this.location.search = search ? `?${search}` : '';
    this.location.pathname = pathname;
    this.history.push(`${pathname}${this.location.search}`);
  },
  replace: function(link) {
    const [pathname, search] = link.split('?');

    this.location.search = search;
    this.location.pathname = pathname;

    if (!this.history.length) {
      this.history.push(link);
    } else {
      this.history.splice(this.history.length - 1, 1, link);
    }
  }
});
