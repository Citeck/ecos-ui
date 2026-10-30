import { basicSectionTest } from '../../../test/builder/helpers';
import Harness from '../../../test/harness';

import DateTimeComponent from './DateTime';
import comp1 from './fixtures/comp1';

import EcosFormUtils from '@/components/forms/EcosForm/EcosFormUtils/EcosFormUtils';

basicSectionTest(DateTimeComponent);

describe('DateTime Component', () => {
  it('Should build a date time component', done => {
    Harness.testCreate(DateTimeComponent, comp1).then(() => {
      done();
    });
  });
});

// Run this suite with TZ=Europe/Moscow, UTC and America/New_York.
describe('date fields with enableTime disabled', () => {
  let component;

  afterEach(() => component && component.destroy());

  async function create(overrides = {}) {
    component = await Harness.testCreate(DateTimeComponent, {
      type: 'datetime',
      key: 'date',
      input: true,
      enableTime: false,
      format: 'yyyy-MM-dd',
      ...overrides
    });
    return component;
  }

  it.each(['2026-01-01', '2026-01-08', '2026-02-23', '2026-03-08', '2026-11-01', '2027-01-01'])(
    'preserves %s through loading and a no-op save',
    async value => {
      const field = await create();
      field.setValue(value);
      expect(field.getValue()).toBe(value);
      expect(field.dataValue).toBe(value);
      expect(field.validationValue).toEqual(new Date(...value.split('-').map((part, i) => Number(part) - (i === 1 ? 1 : 0))));
      expect(field.checkValidity(field.data, true)).toBe(true);
      field.setValue(field.getValue());
      expect(field.getValue()).toBe(value);
    }
  );

  it('round-trips a typed DATE midnight-Z through the form loading and submit pipeline', async () => {
    const field = await create();
    const input = { component: field.component };
    const submission = EcosFormUtils.postProcessingAttrsData({
      recordData: { date: '2026-01-01T00:00:00Z' },
      inputByKey: { date: input }
    });
    field.setValue(submission.date);
    expect(field.getValue()).toBe('2026-01-01');
    expect(EcosFormUtils.processValueBeforeSubmit(field.getValue(), input, {})).toBe('2026-01-01');
  });

  it('serializes a newly selected local day and a range end without a timezone', async () => {
    const field = await create();
    field.widget.calendar.setDate(new Date(2027, 0, 1), true);
    expect(field.getValue()).toBe('2027-01-01');
    field.widget.calendar.setDate(new Date(2027, 0, 8), true);
    expect(field.getValue()).toBe('2027-01-08');
  });

  it('preserves null and serializes clearing a date as null', async () => {
    const field = await create();
    field.setValue(null);
    expect(field.getValue()).toBeNull();
    expect(field.dataValue).toBeNull();
    expect(field.validationValue).toBe('');
    expect(field.checkValidity(field.data, true)).toBe(true);
    field.setValue('2027-01-08');
    field.widget.calendar.clear(true);
    expect(field.getValue()).toBeNull();
  });

  it('supports a localized display format without changing the stored day', async () => {
    const field = await create({ format: 'dd-MM-yyyy' });
    field.setValue('1990-06-15T00:00:00Z');
    expect(field.getValue()).toBe('1990-06-15');
    expect(field.widget.input.value).toBe('15-06-1990');
  });

  it.each([{}, { enableDate: false }])('retains instant serialization when time is enabled: %p', async overrides => {
    const field = await create({ enableTime: true, format: 'yyyy-MM-dd HH:mm', ...overrides });
    field.setValue('2026-02-23T12:30:00+03:00');
    expect(field.getValue()).toBe('2026-02-23T09:30:00Z');
    expect(EcosFormUtils.processValueBeforeSubmit(field.getValue(), { component: field.component }, {})).toBe('2026-02-23T09:30:00Z');
  });
});
