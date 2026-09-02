import { TestForm } from './TestForm';

const definition = {
  components: [{ label: 'field0', type: 'number', input: true, key: 'field0' }]
};

/**
 * The form's emitter carries formio's "infinite loop" guard: past `loadLimit` events it silently
 * drops every event for 500 ms — including the `change` the harness awaits — and the counter only
 * resets after 300 ms of silence. A multi-step test drives the form every ~200 ms (two 100 ms
 * change debounces), so a whole suite counts as one burst. With formio's default limit of 50 the
 * 9th test of allowCalculateOverride hit the pause and timed out in CI. The test form must use the
 * emitter budget the app gives its forms (EcosForm: loadLimit 200).
 */
describe('TestForm emitter budget', () => {
  it('survives the event burst of a multi-step suite without dropping events', async () => {
    const form = await TestForm.create(definition);
    const webform = form.getForm();
    const probe = jest.fn();

    webform.on('probe', probe);

    // ~20 consecutive harness steps worth of events, without a 300 ms gap in between
    for (let i = 0; i < 60; i++) {
      webform.emit('tick');
    }

    webform.emit('probe');

    expect(probe).toHaveBeenCalledTimes(1);
  });
});
