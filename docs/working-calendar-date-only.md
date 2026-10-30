# Dates without a time in forms

A `datetime` component with `enableTime: false` represents a calendar day. It loads
and submits `YYYY-MM-DD`, independently of the browser timezone. No additional
form flag is needed; the production calendar form remains unchanged.

The calendar widget uses a date-only value format while retaining the configured
display format, such as `dd-MM-yyyy`. Typed DATE values returned as midnight-Z
retain their calendar portion. Formio submission data preserves empty dates as
`null`, and validation handles the nullable value. The old top-level timezone
adjustments in `EcosFormUtils` are removed because serialization now happens in
the date component, including fields nested inside JSON grids.

Components with time enabled, including time-only components, retain their
instant serialization. Existing fields with time disabled now submit dates
instead of timestamps. Consumers requiring a time must enable it explicitly.

## Backend contracts

Verified against the local backend's ecos-data-sql 1.75.0 and
ecos-working-schedule 1.5.0 (with ecos-commons 3.9.1):

- DATE accepts `YYYY-MM-DD` as `LocalDate`; the Records API can return midnight-Z.
- DATETIME also accepts `YYYY-MM-DD` and normalizes it to midnight UTC.
- Both typed attributes accept `null`; nested JSON retains date strings and nulls.
- Working calendar row dates are `LocalDate`, with nullable inclusive `until`.
  A null row `until` means one day. Root calendar bounds are nullable when read,
  but missing bounds become MAX/MIN and do not define a valid calendar range.

The matching ecos-data 1.75.0 source tag is
`6e702abe1fd31aeecb8df7461439f603e4b30819`; the registry checkout at
`3878665b09abb58b9774173b6ee8d3614c011b99` is older and uses `java.sql.Date`.
The actual backend runtime was inspected separately. The local schedule action
uses a license fallback which ignores a custom calendar, so calendar parsing and
single/range holiday semantics were additionally checked using the deployed
library and real persisted calendar JSON in an isolated Java harness.

No existing timestamp migration is included. Recovering an intended date from a
previously shifted timestamp requires knowing its origin timezone.

## Verification

Run `yarn test:ci src/forms/components/override/datetime/DateTime.spec.js
src/components/forms/EcosForm/__tests__/EcosFormUtils.test.js --runInBand` with
`TZ=Europe/Moscow`, `TZ=UTC` and `TZ=America/New_York`.

The tests exercise real components, typed DATE load/submit, JSON grid dates,
year and DST boundaries, local selections, null/clearing/validation, localized
display formats, and unchanged datetime/time-only serialization. Browser checks
use the full local `yarn start` app and original calendar form, disposable records
and independent Records API readback in all three timezones.
