import manifest from "./demo-manifest.json";

export const demoSizeMB = manifest.compressedBytes / 1048576;

export async function loadDemoScan(signal: AbortSignal) {
  const response = await fetch(
    `${import.meta.env.BASE_URL}demo/${manifest.file}`,
    { signal },
  );
  if (!response.ok) throw new Error("Demo download failed");
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const compressed =
    bytes[0] === 0x1f &&
    bytes[1] === 0x8b &&
    buffer.byteLength === manifest.compressedBytes;
  // Vite and some static hosts serve .gz with Content-Encoding: gzip, which
  // fetch transparently decodes. Both transport representations are valid.
  const decoded =
    buffer.byteLength === manifest.originalBytes &&
    new DataView(buffer).getInt32(0, true) === 348 &&
    bytes[344] === 110 &&
    bytes[345] === 43 &&
    bytes[346] === 49;
  if (!compressed && !decoded) {
    throw new Error("Incomplete demo download");
  }
  return new File(
    [buffer],
    decoded ? manifest.file.replace(/\.gz$/, "") : manifest.file,
    {
      type: compressed ? "application/gzip" : "application/octet-stream",
    },
  );
}
