# Assigning a copied artifact to a type

The generated journal/form settings can create a persistent copy and assign it to the selected type. Creating the copy and changing the type are separate operations.

After the copy is saved, `PreSettingsModal.handleTypeToSave` checks the type's write permission and actual workspace (`workspace?str` on `emodel/types-repo`), then reads the saved artifact's `workspaceRef?localId`. It does not infer either scope from the current navigator workspace or from the generated source's ID.

The global scope is normalized using the shared `DEFAULT_WORKSPACE_ID` constant: the type's empty workspace becomes `default`. Missing metadata is rejected before normalization. `resolveRecordWorkspaceId` is for related-record queries and falls back to the navigator on errors; it is unsuitable for deciding whether a type may be mutated.

A global artifact (`default` in the journal/form workspace reference) can be assigned to global or workspace types. A workspace artifact can be assigned only to a type in that same workspace. An incompatible assignment is skipped: the copy remains saved and the journal opens normally, while the type's reference stays unchanged. Missing records or unavailable scope metadata also skip assignment. Clearing the type selection creates a copy without changing a type.

Records API adds the navigator's `_workspace` to mutations. This does not make a global type update local: ecos-model selects an existing type by its record ID and ignores `workspace`/`_workspace` changes for existing types. The assignment check must therefore happen before changing the type reference.

Regression coverage is in `src/components/admin/PreSettings/__tests__/PreSettingsModal.test.js`.
