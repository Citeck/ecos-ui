# Add patches from node_modules

1. Execute shell command `yarn patch ${npm_lib}`
1. Edit code in the temporary folter
2. Execute shell command `yarn patch-commit -s /temp/to/temp/folder`

Example:

```sh
    ➜  C:\Users\user\ecos-ui>yarn patch bpmnlint 
    ➤ YN0000: Package bpmnlint@npm:8.1.1 got extracted with success!
    ➤ YN0000: You can now edit the following folder: C:\Users\user\AppData\Local\Temp\xfs-55b9d962\user
    ➤ YN0000: Once you are done run yarn patch-commit -s "C:\Users\user\AppData\Local\Temp\xfs-55b9d962\user" and Yarn will store a patchfile based on your changes.
    ➤ YN0000: Done in 0s 158ms

    ➜ yarn patch-commit -s "C:\Users\user\AppData\Local\Temp\xfs-55b9d962\user
```
