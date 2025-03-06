/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SerializedDocument } from '@lexical/file';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function* generateReader<T = any>(reader: ReadableStreamDefaultReader<T>) {
  let done = false;
  while (!done) {
    const res = await reader.read();
    const { value } = res;
    if (value !== undefined) {
      yield value;
    }
    done = res.done;
  }
}

export async function docFromHash(hash: string): Promise<SerializedDocument | null> {
  const m = /^#doc=(.*)$/.exec(hash);
  if (!m) {
    return null;
  }
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  const b64 = atob(m[1].replace(/_/g, '/').replace(/-/g, '+'));
  const array = new Uint8Array(b64.length);
  for (let i = 0; i < b64.length; i++) {
    array[i] = b64.charCodeAt(i);
  }
  const closed = writer.write(array).then(() => writer.close());
  const output = [];
  for await (const chunk of generateReader(ds.readable.pipeThrough(new TextDecoderStream()).getReader())) {
    output.push(chunk);
  }
  await closed;
  return JSON.parse(output.join(''));
}
