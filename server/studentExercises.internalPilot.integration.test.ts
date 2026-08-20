import { describe, expect, it } from "vitest";
import { getStudentAccessibleExercises } from "./curriculum";

describe("تغذية تمارين الطالب المقيدة بالمصدر", () => {
  it("تستبعد التمارين الداخلية المنشورة ظاهريًا حتى إذا كان مصدرها مرجع عمل معتمد", async () => {
    const exercises = await getStudentAccessibleExercises(-999999);
    expect(exercises.map(exercise => exercise.id)).not.toEqual(expect.arrayContaining([1, 30001, 30002]));
  });
});
