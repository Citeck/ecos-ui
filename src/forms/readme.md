# Form Extension

descriptions and rules

- `Webform` _overrides formio class_ which is responsible for form view for user

- `WebformBuilder` _overrides formio class_ which is responsible for formbuilder for user-builder

[Demo Form Builder page](http://localhost:3000/v2/debug/formio-develop) for localhost

[official formio builder page](https://formio.github.io/formio.js/app/builder)

- `utils`

  - `disabledComponents` these components are not in the builder; deactivated
  - `groups` : _basic, advanced, layout, data_ - content overridden

- `components/index` D:\mmtr\ecos-ui\src\constants\documentation.js default, custom and override componetns and also extends common props for ex sorts by weight, prepares url for documentation...

  ### New component

  1. add key in map `components`
  1. there are some own settings in component
  1. check groups & etc
  1. register documentation
     - go `src/constants/documentation` is responsible for documentation
     - add key component and value - link anchor / if there isn't anchor - ask/make

  ### Custom

  ### Override

---

**P.S. update this file if you have new information**
