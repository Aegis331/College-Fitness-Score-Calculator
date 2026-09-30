import type { RuleSet } from '../../types/scoring';
import { bmiRule, createRuleSet, numericRule, rows, WEIGHTS } from './common';

export const maleLowerRuleSet: RuleSet = createRuleSet('male', 'lower', {
  bmi: bmiRule('male'),
  vitalCapacity: numericRule('vitalCapacity', 'mL', WEIGHTS.vitalCapacity, 'higher-is-better', rows([
    [5040, 100], [4920, 95], [4800, 90], [4550, 85], [4300, 80], [4180, 78], [4060, 76], [3940, 74],
    [3820, 72], [3700, 70], [3580, 68], [3460, 66], [3340, 64], [3220, 62], [3100, 60], [2940, 50],
    [2780, 40], [2620, 30], [2460, 20], [2300, 10],
  ])),
  fiftyMeter: numericRule('fiftyMeter', '秒', WEIGHTS.fiftyMeter, 'lower-is-better', rows([
    [6.7, 100], [6.8, 95], [6.9, 90], [7.0, 85], [7.1, 80], [7.3, 78], [7.5, 76], [7.7, 74], [7.9, 72],
    [8.1, 70], [8.3, 68], [8.5, 66], [8.7, 64], [8.9, 62], [9.1, 60], [9.3, 50], [9.5, 40], [9.7, 30],
    [9.9, 20], [10.1, 10],
  ])),
  sitAndReach: numericRule('sitAndReach', 'cm', WEIGHTS.sitAndReach, 'higher-is-better', rows([
    [24.9, 100], [23.1, 95], [21.3, 90], [19.5, 85], [17.7, 80], [16.3, 78], [14.9, 76], [13.5, 74],
    [12.1, 72], [10.7, 70], [9.3, 68], [7.9, 66], [6.5, 64], [5.1, 62], [3.7, 60], [2.7, 50], [1.7, 40],
    [0.7, 30], [-0.3, 20], [-1.3, 10],
  ])),
  standingLongJump: numericRule('standingLongJump', 'cm', WEIGHTS.standingLongJump, 'higher-is-better', rows([
    [273, 100], [268, 95], [263, 90], [256, 85], [248, 80], [244, 78], [240, 76], [236, 74], [232, 72],
    [228, 70], [224, 68], [220, 66], [216, 64], [212, 62], [208, 60], [203, 50], [198, 40], [193, 30],
    [188, 20], [183, 10],
  ])),
  pullUp: numericRule('pullUp', '个', WEIGHTS.strength, 'higher-is-better', rows([
    [19, 100], [18, 95], [17, 90], [16, 85], [15, 80], [14, 76], [13, 72], [12, 68], [11, 64], [10, 60],
    [9, 50], [8, 40], [7, 30], [6, 20], [5, 10],
  ])),
  enduranceRun: numericRule('enduranceRun', '秒', WEIGHTS.enduranceRun, 'lower-is-better', rows([
    [197, 100], [202, 95], [207, 90], [214, 85], [222, 80], [227, 78], [232, 76], [237, 74], [242, 72],
    [247, 70], [252, 68], [257, 66], [262, 64], [267, 62], [272, 60], [292, 50], [312, 40], [332, 30],
    [352, 20], [372, 10],
  ])),
});
