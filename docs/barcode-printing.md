# Barcode widget PDF printing

## Modern ECOS records

Modern printing requires the transformations service version supporting explicit PDF geometry
(`pageWidth`, `pageHeight`, `printScale`, `pageMarginLeft`, `pageMarginTop`) and full-image fit
validation. There is no silent fallback to the previous, incorrectly sized print URL.

The widget stores a separate configuration:

```json
{
  "printSettings": {
    "version": 1,
    "pageFormat": "A4",
    "scalePercent": 100,
    "offsetLeftMm": 20,
    "offsetTopMm": 20
  }
}
```

These are also the defaults when `printSettings` is absent. Missing fields are filled individually;
explicit zero offsets are preserved. Unknown versions/formats block printing. Opening settings,
checking the values and explicitly saving repairs the schema to version 1 / A4.
Modern saves preserve `config.settings`, unrelated config, and existing action display conditions.

The PDF is a complete portrait A4 page: **595.276 × 841.89 points**. Scale is percent / 100;
top/left offsets are real millimetres converted by **mm × 72 / 25.4**. Scale affects the entire
server-generated image, including caption and quiet zone. No print raster `width`, `height` or
quiet-zone `margin` is sent: the server chooses natural raster dimensions from content and record
configuration (default 1D height 50, default 2D 60 × 60). Format comes from the record type.
There is no arbitrary scale cap, automatic fitting, cropping, right/bottom margin control,
landscape mode, or promise of identical physical sizing to the legacy renderer.

Decimal dot and comma inputs are supported. Scale must be finite and > 0; left must be finite,
>= 0 and < 210 mm; top must be finite, >= 0 and < 297 mm. Blank, negative, nonnumeric and infinite
inputs cannot be saved or printed. The backend remains authoritative for whether the complete
image fits: long content/captions can overflow even at 100%. A 400 response asks the user to reduce
scale/offsets or check settings, never silently resizes the output.

The widget preview stays on its existing independent **210 × 100 requested raster** profile.
It is not a physical-size or WYSIWYG print preview. Printing errors leave the preview intact.

## Alfresco compatibility

A record reference containing `workspace://SpacesStore/` uses the existing legacy route, settings,
parameter order and values. `config.printSettings` does not affect this path. The historical
`config.settings` defaults (500%, left/top 20, right 200, bottom 50) and legacy serializer are
unchanged. The URL helper's historical omitted-settings default (bottom 500) is also preserved.
Those raw legacy values are not converted to real millimetres or migrated into modern settings.
The legacy controls and action conditions remain available.

## Request and browser lifetime

A modern click validates settings, locks duplicate submissions synchronously, and reserves a tab
before any asynchronous work. If popup blocking prevents the tab, no PDF request is made. A local
loading message and disabled print button report progress. The authenticated API request goes
through the barcode action/saga and `ecosFetch`; no Blob or Window is stored in reducer state.

Only a successful HTTP response with `application/pdf` content type and a `%PDF-` signature is
opened. HTML/login/error bodies are never rendered as PDF or injected into the widget. Access
errors (401/403), unavailable record/resource (404), fit/settings errors (400), and preparation or
network failures have localized retry guidance. A failed preparation closes the unused tab.
Closing the reserved tab does not trigger an automatic replacement: retry requires a fresh click.

Record changes and unmount abort/retire pending operations and close their reserved tabs. A stale
result cannot navigate a tab or alter the current widget. After successful navigation, the PDF tab
owns its Blob URL: a small close observer revokes it only when the tab closes, not on widget
unmount or a short timeout. This preserves the browser PDF viewer's later download/print controls.
The placeholder clears its opener and only navigates to an application-created Blob URL. Printing
itself uses the browser's PDF viewer, not automatic page printing.

## Manual acceptance smoke

Use an authenticated local UI build with the new transformations version. Do not change business
records or shared dashboards merely to test this feature. Use an approved own test record/dashboard
if configuration changes are necessary.

1. Confirm the running UI actually contains this build. Open a modern record with a barcode.
2. With no new print settings, open Print: verify one authenticated PDF request, no raster width/
   height/quiet-zone overrides, A4 MediaBox, `printScale=1`, and 20 mm -> ~56.693 pt offsets.
3. Save fractional values (both dot and comma), zero offsets, and another scale. Verify request
   geometry and PDF placement. Verify conditions and unrelated/old settings survive saving.
4. Confirm blank/negative/zero-scale/NaN/infinite and exhausted-page offsets show linked field
   errors and cannot be saved. Unknown schema blocks printing and can be explicitly repaired.
5. Force an overflowing image/scale: verify local recoverable fit guidance, no raw 400 page, preview
   retained, and successful retry after reducing values. Check access/network/HTML failures too.
6. Check popup blocking, rapid double clicks, tab closure before response, record switch and widget
   removal during a request. There must be no stale/new automatic tab or duplicated request.
7. Open a successful PDF, remove/navigate away from the widget, then use the PDF viewer's download
   and print controls. They must still work. Close the PDF tab to release its URL.
8. Verify legacy records still use their original route, serialized settings and controls.

Browser/API/PDF geometry checks are not physical printer or scanner certification. Test actual
print scaling (including the viewer/printer's own fit settings) and scan readability separately.
