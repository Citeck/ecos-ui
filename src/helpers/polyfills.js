/* eslint no-extend-native: ["error", { "exceptions": ["String", "Object", "Array"] }] */

export const polyfills = () => {
  if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: function(searchString, position) {
        position = position || 0;

        return this.indexOf(searchString, position) === position;
      }
    });
  }
};
