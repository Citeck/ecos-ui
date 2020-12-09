export const history = Object.freeze({
  location: Object.freeze({
    pathname: '',
    search: ''
  }),
  history: Object.freeze([]),
  pushState: function({ path = '' } = {}) {
    const [pathname, search = ''] = path.split('?');

    this.location.search = search;
    this.location.pathname = pathname;
    this.history.push(path);
  },
  replaceState: function({ path = '' } = {}) {
    const [pathname, search] = path.split('?');

    this.location.search = search;
    this.location.pathname = pathname;

    if (!this.history.length) {
      this.history.push(path);
    } else {
      this.history.splice(this.history.length - 1, 1, path);
    }
  }
});
