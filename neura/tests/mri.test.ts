import { describe, expect, it } from "vitest";
import type { NVImage } from "@niivue/niivue";
import { collectMRIFiles } from "../src/features/mri/files";
import { extractNiftiMetadata } from "../src/features/mri/nifti";
import {
  getDiagnosis,
  getSex,
  inferSubjectId,
  normalizeRecord,
  normalizeSubjectId,
} from "../src/features/mri/phenotypic";

describe("imported MRI data", () => {
  it("accepts NIfTI files and rejects empty/unsupported files without duplicating a batch", () => {
    const nii = new File(["test"], "site_0051456.nii", { lastModified: 1 });
    const gz = new File(["test"], "site_0051457.NII.GZ", { lastModified: 2 });
    const { added, rejected } = collectMRIFiles(
      [],
      [nii, nii, gz, new File([], "empty.nii"), new File(["x"], "wrong.gz")],
    );
    expect(added.map((entry) => entry.subjectId)).toEqual([
      "0051456",
      "0051457",
    ]);
    expect(rejected).toEqual(["empty.nii", "wrong.gz"]);
    expect(collectMRIFiles(added, [nii]).added).toEqual([]);
  });

  it("matches padded image IDs to CSV IDs and preserves unknown values", () => {
    const record = normalizeRecord({
      "\uFEFF sub_id ": "51456.0",
      dx_group: 2,
      sex: 1,
      age_at_scan: 12,
    });
    expect(
      normalizeSubjectId(inferSubjectId("Caltech_0051456_T1.nii.gz")),
    ).toBe(normalizeSubjectId(record.SUB_ID));
    expect(getDiagnosis(record)).toBe("Control");
    expect(getSex(record)).toBe("Мужской");
    expect(getDiagnosis(normalizeRecord({ DX_GROUP: 1 }))).toBe("ASD");
    expect(getDiagnosis(normalizeRecord({ DX_GROUP: "unknown" }))).toBe(
      "unknown",
    );
    expect(normalizeSubjectId(null)).toBe("");
    expect(inferSubjectId("scan.nii")).toBe("");
  });

  it("reads affine, voxel units and intensity range from the loaded volume", () => {
    const volume = {
      hdr: { datatypeCode: 4, xyzt_units: 10 },
      dims: [3, 32, 40, 24],
      pixDims: [1, -1, 2, 3],
      originalAffine: [
        [-1, 0, 0, 16],
        [0, 2, 0, -40],
        [0, 0, 3, -36],
        [0, 0, 0, 1],
      ],
      robust_min: 5,
      robust_max: 5,
    } as unknown as NVImage;
    const metadata = extractNiftiMetadata(volume);
    expect(metadata.dimensions).toEqual([32, 40, 24]);
    expect(metadata.voxelSpacing).toEqual([1, 2, 3]);
    expect(metadata.orientation).toBe("LAS");
    expect(metadata.spatialUnit).toBe("mm");
    expect(metadata.datatype).toBe("INT16");
    expect(metadata.intensityRange).toEqual([5, 6]);
  });
});
