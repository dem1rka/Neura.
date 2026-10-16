import { inferSubjectId } from "./phenotypic";

export type MRIEntry = {
  id: string;
  file: File;
  subjectId: string;
  source: "local" | "example";
};

// randomUUID is unavailable on plain HTTP LAN addresses used by phones.
export function createMRIId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}

export function collectMRIFiles(existing: MRIEntry[], incoming: File[]) {
  const added: MRIEntry[] = [];
  const rejected: string[] = [];
  for (const file of incoming) {
    if (!/\.nii(\.gz)?$/i.test(file.name) || file.size === 0) {
      rejected.push(file.name);
      continue;
    }
    if (
      [...existing, ...added].some(
        (entry) =>
          entry.file.name === file.name &&
          entry.file.size === file.size &&
          entry.file.lastModified === file.lastModified,
      )
    )
      continue;
    added.push({
      id: createMRIId(),
      file,
      subjectId: inferSubjectId(file.name),
      source: "local",
    });
  }
  return { added, rejected };
}
