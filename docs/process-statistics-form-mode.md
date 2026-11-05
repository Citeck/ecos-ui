# Process Statistics mode compatibility

The `process-statistics` widget stores its view mode in `config.formMode`.

| Stored value | Effective mode | Visualization |
| --- | --- | --- |
| `heatmap` or legacy `EXTENDED_MODE` | `heatmap` | Extended statistics and heatmap |
| `default` or legacy `SIMPLIFIED_MODE` | `default` | Process diagram |
| `kpi` or legacy `KPI_MODE` | `kpi` | KPI overlay |
| Missing or unrecognized value | `heatmap` | Default extended mode |

`normalizeFormMode` in the widget's `constants.js` is used when rendering the
widget and initializing settings. Saving settings writes the current value;
opening an existing dashboard does not modify its stored configuration.
Reporting permissions and administrator-only settings remain independent of mode
normalization.

Legacy values were valid before ECOSUI-2876. Commit
`d2748861f1341ab69073298edaef597eb64c1f58` (21 March 2024) changed the stored
values to `heatmap`, `default`, and `kpi`. Older dashboard configuration can survive
an application upgrade. Passing a legacy value directly to the heatmap plugin
selects its unsupported-mode branch: no renderer config/container is prepared,
and heatmap.js raises a `getComputedStyle` TypeError.

The crash needs the heatmap plugin, a displayed process diagram, a legacy or
unsupported mode, and nonempty heatmap statistics. Empty statistics skip heatmap
creation. Slow statistics postpone the crash until data arrives; they are not its
cause. A different resolved dashboard (including a personal override) can have a
different stored mode, so compare the configuration actually returned by the
`uiserv/dashboard` query rather than only comparing UI versions.

Regression coverage: `ProcessStatistics/__tests__/formMode.test.js` exercises the
mode passed to the model, journal visibility, settings save payload, and reporting
restrictions for current and legacy modes. Browser verification should also cover
settings/cancel, widget refresh, reopening, empty statistics and delayed statistics.
