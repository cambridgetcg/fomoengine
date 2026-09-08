import type { CategoryId } from "../services/detection/taxonomy";
import type { MechanismId } from "./schema";

// 呢度只係去研究頁嘅連結；唔改 detector 判斷，亦唔將命中當成造假證據。
const DETECTOR_MECHANISMS: Readonly<Partial<Record<CategoryId, MechanismId>>> = {
  manufactured_urgency: "scarcity",
  fake_scarcity: "scarcity",
  false_exclusivity: "scarcity",
  fake_social_proof: "social-proof",
};

export function mechanismForCategory(id: CategoryId): MechanismId | undefined {
  // scam_composite 同無對應研究主題嘅 categories 刻意無策略入口。
  return Object.hasOwn(DETECTOR_MECHANISMS, id) ? DETECTOR_MECHANISMS[id] : undefined;
}
