###`Surroundings`

**Windows**

You need 
1. `Node v14` *(if it does't work, try `v12`)*
1. `node-sass` 4.12.0 *(check package)*
1. `Python27`
1. use `yarn`, not `npm` !
1. *maybe - windows-build-tools, but you can get everything with node installation ↓*


`Node` 

[download here v14](https://nodejs.org/download/release/v14.19.1/)

*After installation, check the box for downloading add-ons*

`Python`

[download here v27](https://www.python.org/downloads/release/python-2718/)

Set flag PATH

You can have different Python versions on your laptop, but for the project you need **27**. Check it. May need to be removed...

Check npm - python
```
npm config list
```
Response like:

`python = "C:\\Python27\\python.exe"`

```
C:\Users\...\AppData\Roaming>npm config list
; cli configs
metrics-registry = "https://registry.npmjs.org/"
scope = ""
user-agent = "npm/6.14.16 node/v14.19.1 win32 x64"

; userconfig C:\Users\...\.npmrc
python = "C:\\Python27\\python.exe"

; builtin config undefined
prefix = "C:\\Users\\...\\AppData\\Roaming\\npm"

; node bin location = C:\Program Files\nodejs\node.exe
; cwd = C:\Users\...\AppData\Roaming
; HOME = C:\Users\...
; "npm config ls -l" to show all defaults.
```
If there are dif versions set **27** 
```
//for Windows
npm config set python C:\Python27\python.exe
```
```
//btw for Linux
npm config set python /usr/bin/python27
```

---

Extra step `windows-build-tools`

If prev steps didn't help, you can try to install (windows-build-tools)[https://www.npmjs.com/package/windows-build-tools] it includes Python27. So, it's like enclosing solution

---

*And you can try to rebuild `node-sass`* 
```
yarn remove node-sass
yarn cache clean --all
yarn add node-sass@4.12.0
```

- [solution](https://danielwertheim.se/solution-to-issues-with-node-gyp-node-sass-on-windows/)
- [reason](https://sass-lang.com/dart-sass)
- [reason](https://github.com/sass/node-sass/issues/1176)
- google tag: node python27 node-sass

---
## Available Scripts

In the project directory, you can run:

**use YARN**

### `yarn cache clean --all`

Clean all cache

### `yarn`

Install dependencies 

### `yarn start`

**Important!** Before the first start you need to run the command:

### `yarn export`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
