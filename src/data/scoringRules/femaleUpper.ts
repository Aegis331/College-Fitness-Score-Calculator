import type { RuleSet } from '../../types/scoring';
import { bmiRule, createRuleSet, numericRule, rows, WEIGHTS } from './common';

export const femaleUpperRuleSet: RuleSet = createRuleSet('female', 'upper', {
  bmi: bmiRule('female'),
  vitalCapacity: numericRule('vitalCapacity', 'mL', WEIGHTS.vitalCapacity, 'higher-is-better', rows([
    [3450, 100], [3400, 95], [3350, 90], [3200, 85], [3050, 80], [2950, 78], [2850, 76], [2750, 74],
    [2650, 72], [2550, 70], [2450, 68], [2350, 66], [2250, 64], [2150, 62], [2050, 60], [2010, 50],
    [1970, 40], [1930, 30], [1890, 20], [1850, 10],
  ])),
  fiftyMeter: numericRule('fiftyMeter', '秒', WEIGHTS.fiftyMeter, 'lower-is-better', rows([
    [7.4, 100], [7.5, 95], [7.6, 90], [7.9, 85], [8.2, 80], [8.4, 78], [8.6, 76], [8.8, 74], [9.0, 72],
    [9.2, 70], [9.4, 68], [9.6, 66], [9.8, 64], [10.0, 62], [10.2, 60], [10.4, 50], [10.6, 40], [10.8, 30],
    [11.0, 20], [11.2, 10],
  ])),
  sitAndReach: numericRule('sitAndReach', 'cm', WEIGHTS.sitAndReach, 'higher-is-better', rows([
    [26.3, 100], [24.4, 95], [22.4, 90], [21.0, 85], [19.5, 80], [18.2, 78], [16.9, 76], [15.6, 74],
    [14.3, 72], [13.0, 70], [11.7, 68], [10.4, 66], [9.1, 64], [7.8, 62], [6.5, 60], [5.7, 50], [4.9, 40],
    [4.1, 30], [3.3, 20], [2.5, 10],
  ])),
  standingLongJump: numericRule('standingLongJump', 'cm', WEIGHTS.standingLongJump, 'higher-is-better', rows([
    [208, 100], [202, 95], [196, 90], [189, 85], [182, 80], [179, 78], [176, 76], [173, 74], [170, 72],
    [167, 70], [164, 68], [161, 66], [158, 64], [155, 62], [152, 60], [147, 50], [142, 40], [137, 30],
    [132, 20], [127, 10],
  ])),
  sitUp: numericRule('sitUp', '个', WEIGHTS.strength, 'higher-is-better', rows([
    [57, 100], [55, 95], [53, 90], [50, 85], [47, 80], [45, 78], [43, 76], [41, 74], [39, 72], [37, 70],
    [35, 68], [33, 66], [31, 64], [29, 62], [27, 60], [25, 50], [23, 40], [21, 30], [19, 20], [17, 10],
  ])),
  enduranceRun: numericRule('enduranceRun', '秒', WEIGHTS.enduranceRun, 'lower-is-better', rows([
    [196, 100], [202, 95], [208, 90], [215, 85], [222, 80], [227, 78], [232, 76], [237, 74], [242, 72],
    [247, 70], [252, 68], [257, 66], [262, 64], [267, 62], [272, 60], [282, 50], [292, 40], [302, 30],
    [312, 20], [322, 10],
  ])),
});
