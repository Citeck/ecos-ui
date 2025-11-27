# Global Icons

This `global` folder contains *non-system* icons that are available beyond local development. Icons placed here are automatically exposed to users in the icon selection UI (for example, when choosing icons from a menu).

---

## 📁 What belongs in `global`

* Icons that should be available for both **local development** and for **end users** to select through the UI.
* Reusable, generally useful icons that can appear in menus, toolbars, or other UI components.

---

## How it works

* Any icon file placed inside this folder is automatically included in the **user-selectable icon list**.
* If you **do not** want an icon to appear in the user-facing list, move it up one level to `../icons`. Icons in `../icons` remain available for local development only and will **not** be shown to users.

---

## Sorting icons for the user list

The user-facing list can be ordered using a `weight` parameter. The `weight` represents the icon’s index or priority in the list — larger values push the icon further down the list.

**Default behavior:** every icon has a very large default weight (so new icons appear later in the list).

**To assign a custom weight**, add the following line to your icon module:

```js
// Set a custom weight for the icon. Higher numbers appear later in the user list.
export const weight = 0; // replace 0 with any numeric value
```

Notes:

* Use higher values to make the icon appear further *down* the list.
* Use lower values (including negative numbers) to bring icons closer to the top.

---

## Recommendations & best practices

* Use `global` for icons that are stable, generic, and useful to many users.
* Keep highly specialized or experimental icons in `../icons` to avoid cluttering the user-facing list.
* When changing the `weight`, consider how it affects overall discoverability — frequent, commonly used icons should have lower weights.

---

## Troubleshooting

* If an icon is not showing in the UI, verify that:

  1. The icon file is located inside the `global` folder.
  2. The file exports the icon correctly.
  3. There are no build or import errors preventing the icon from being registered.

---
