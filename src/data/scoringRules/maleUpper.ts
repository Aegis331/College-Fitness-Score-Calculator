import type { RuleSet } from '../../types/scoring';
import { bmiRule, createRuleSet, numericRule, rows, WEIGHTS } from './common';

export const maleUpperRuleSet: RuleSet = createRuleSet('male', 'upper', {
  bmi: bmiRule('male'),
  vitalCapacity: numericRule('vitalCapacity', 'mL', WEIGHTS.vitalCapacity, 'higher-is-better', rows([
    [5140, 100], [5020, 95], [4900, 90], [4650, 85], [4400, 80], [4280, 78], [4160, 76], [4040, 74],
    [3920, 72], [3800, 70], [3680, 68], [3560, 66], [3440, 64], [3320, 62], [3200, 60], [3030, 50],
    [2860, 40], [2690, 30], [2520, 20], [2350, 10],
  ])),
  fiftyMeter: numericRule('fiftyMeter', '秒', WEIGHTS.fiftyMeter, 'lower-is-better', rows([
    [6.6, 100], [6.7, 95], [6.8, 90], [6.9, 85], [7.0, 80], [7.2, 78], [7.4, 76], [7.6, 74], [7.8, 72],
    [8.0, 70], [8.2, 68], [8.4, 66], [8.6, 64], [8.8, 62], [9.0, 60], [9.2, 50], [9.4, 40], [9.6, 30],
    [9.8, 20], [10.0, 10],
  ])),
  sitAndReach: numericRule('sitAndReach', 'cm', WEIGHTS.sitAndReach, 'higher-is-better', rows([
    [25.1, 100], [23.3, 95], [21.5, 90], [19.9, 85], [18.2, 80], [16.8, 78], [15.4, 76], [14.0, 74],
    [12.6, 72], [11.2, 70], [9.8, 68], [8.4, 66], [7.0, 64], [5.6, 62], [4.2, 60], [3.2, 50], [2.2, 40],
    [1.2, 30], [0.2, 20], [-0.8, 10],
  ])),
  standingLongJump: numericRule('standingLongJump', 'cm', WEIGHTS.standingLongJump, 'higher-is-better', rows([
    [275, 100], [270, 95], [265, 90], [258, 85], [250, 80], [246, 78], [242, 76], [238, 74], [234, 72],
    [230, 70], [226, 68], [222, 66], [218, 64], [214, 62], [210, 60], [205, 50], [200, 40], [195, 30],
    [190, 20], [185, 10],
  ])),
  pullUp: numericRule('pullUp', '个', WEIGHTS.strength, 'higher-is-better', rows([
    [20, 100], [19, 95], [18, 90], [17, 85], [16, 80], [15, 76], [14, 72], [13, 68], [12, 64], [11, 60],
    [10, 50], [9, 40], [8, 30], [7, 20], [6, 10],
  ])),
  enduranceRun: numericRule('enduranceRun', '秒', WEIGHTS.enduranceRun, 'lower-is-better', rows([
    [195, 100], [200, 95], [205, 90], [212, 85], [220, 80], [225, 78], [230, 76], [235, 74], [240, 72],
    [245, 70], [250, 68], [255, 66], [260, 64], [265, 62], [270, 60], [290, 50], [310, 40], [330, 30],
    [350, 20], [370, 10],
  ])),
});
