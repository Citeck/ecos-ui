# Add patches from node_modules

1. Edit code in the library folder `node_modules/${npm_lib}`
2. Execute shell command `yarn patch-package ${npm_lib}`

Example:

```sh
    ➜  ecos-ui git:(develop) ✗ yarn patch-package font-awesome
    yarn run v1.22.19
    $ /Users/unix/Workspace/ecos-ui/node_modules/.bin/patch-package font-awesome
    ➜  ecos-ui git:(develop) ✗ yarn patch-package font-awesome
    yarn run v1.22.19
    $ /Users/unix/Workspace/ecos-ui/node_modules/.bin/patch-package font-awesome
    patch-package 6.5.1
    • Creating temporary folder
    • Installing font-awesome@4.7.0 with yarn
    • Diffing your files with clean files
    ✔ Created file patches/font-awesome+4.7.0.patch

    💡 font-awesome is on GitHub! To draft an issue based on your patch run

        yarn patch-package font-awesome --create-issue

    ✨  Done in 2.40s.
```
