/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { EditorThemeClasses } from 'lexical';

import invariant from '../shared/invariant';

function escapeClassName(className: string): string {
  return typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(className) : className;
}

/**
 * CSS selector for a theme value, or null when the theme does not define it.
 *
 * A theme value may hold several classes ("a b"); they describe ONE element, so the classes are
 * joined into a compound selector — `.a.b`. Joining them with a comma instead (what `join()`
 * without an argument does) would build a selector LIST — `.a,.b` — which matches any element
 * carrying either class, so `td.a,.b` would also match plain `<div class="b">`.
 */
export function getThemeClassSelector(theme: EditorThemeClasses | null | undefined, name: keyof EditorThemeClasses): string | null {
  const className = theme?.[name];

  if (typeof className !== 'string') {
    return null;
  }

  const classes = className.split(/\s+/g).filter(Boolean);

  return classes.length > 0 ? classes.map(cls => `.${escapeClassName(cls)}`).join('') : null;
}

/** Same, for theme values a caller cannot work without: throws when the theme does not define one */
export function getThemeSelector(getTheme: () => EditorThemeClasses | null | undefined, name: keyof EditorThemeClasses): string {
  const selector = getThemeClassSelector(getTheme(), name);
  invariant(typeof selector === 'string', 'getThemeClass: required theme property %s not defined', String(name));
  return selector;
}
