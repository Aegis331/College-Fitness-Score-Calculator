import type { RuleSet } from '../../types/scoring';
import { bmiRule, createRuleSet, numericRule, rows, WEIGHTS } from './common';

export const femaleLowerRuleSet: RuleSet = createRuleSet('female', 'lower', {
  bmi: bmiRule('female'),
  vitalCapacity: numericRule('vitalCapacity', 'mL', WEIGHTS.vitalCapacity, 'higher-is-better', rows([
    [3400, 100], [3350, 95], [3300, 90], [3150, 85], [3000, 80], [2900, 78], [2800, 76], [2700, 74],
    [2600, 72], [2500, 70], [2400, 68], [2300, 66], [2200, 64], [2100, 62], [2000, 60], [1960, 50],
    [1920, 40], [1880, 30], [1840, 20], [1800, 10],
  ])),
  fiftyMeter: numericRule('fiftyMeter', '秒', WEIGHTS.fiftyMeter, 'lower-is-better', rows([
    [7.5, 100], [7.6, 95], [7.7, 90], [8.0, 85], [8.3, 80], [8.5, 78], [8.7, 76], [8.9, 74], [9.1, 72],
    [9.3, 70], [9.5, 68], [9.7, 66], [9.9, 64], [10.1, 62], [10.3, 60], [10.5, 50], [10.7, 40], [10.9, 30],
    [11.1, 20], [11.3, 10],
  ])),
  sitAndReach: numericRule('sitAndReach', 'cm', WEIGHTS.sitAndReach, 'higher-is-better', rows([
    [25.8, 100], [24.0, 95], [22.2, 90], [20.6, 85], [19.0, 80], [17.7, 78], [16.4, 76], [15.1, 74],
    [13.8, 72], [12.5, 70], [11.2, 68], [9.9, 66], [8.6, 64], [7.3, 62], [6.0, 60], [5.2, 50], [4.4, 40],
    [3.6, 30], [2.8, 20], [2.0, 10],
  ])),
  standingLongJump: numericRule('standingLongJump', 'cm', WEIGHTS.standingLongJump, 'higher-is-better', rows([
    [207, 100], [201, 95], [195, 90], [188, 85], [181, 80], [178, 78], [175, 76], [172, 74], [169, 72],
    [166, 70], [163, 68], [160, 66], [157, 64], [154, 62], [151, 60], [146, 50], [141, 40], [136, 30],
    [131, 20], [126, 10],
  ])),
  sitUp: numericRule('sitUp', '个', WEIGHTS.strength, 'higher-is-better', rows([
    [56, 100], [54, 95], [52, 90], [49, 85], [46, 80], [44, 78], [42, 76], [40, 74], [38, 72], [36, 70],
    [34, 68], [32, 66], [30, 64], [28, 62], [26, 60], [24, 50], [22, 40], [20, 30], [18, 20], [16, 10],
  ])),
  enduranceRun: numericRule('enduranceRun', '秒', WEIGHTS.enduranceRun, 'lower-is-better', rows([
    [198, 100], [204, 95], [210, 90], [217, 85], [224, 80], [229, 78], [234, 76], [239, 74], [244, 72],
    [249, 70], [254, 68], [259, 66], [264, 64], [269, 62], [274, 60], [284, 50], [294, 40], [304, 30],
    [314, 20], [324, 10],
  ])),
});
