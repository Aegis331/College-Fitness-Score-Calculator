import type { Gender, Grade } from '../../types/fitness';
import type { RuleSet } from '../../types/scoring';
import { getGradeBand } from '../../types/fitness';
import { femaleLowerRuleSet } from './femaleLower';
import { femaleUpperRuleSet } from './femaleUpper';
import { maleLowerRuleSet } from './maleLower';
import { maleUpperRuleSet } from './maleUpper';

const RULE_SETS: Record<Gender, Record<'lower' | 'upper', RuleSet>> = {
  male: { lower: maleLowerRuleSet, upper: maleUpperRuleSet },
  female: { lower: femaleLowerRuleSet, upper: femaleUpperRuleSet },
};

export function getRuleSet(gender: Gender, grade: Grade): RuleSet {
  return RULE_SETS[gender][getGradeBand(grade)];
}

export { femaleLowerRuleSet, femaleUpperRuleSet, maleLowerRuleSet, maleUpperRuleSet };
