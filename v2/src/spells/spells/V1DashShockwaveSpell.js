import { V1PersistentSpell as PersistentSpell } from '../V1PersistentSpell.js';
import { DashShockwave } from '../../entities/V1DashShockwave.js';

/**
 * DashShockwaveSpell - Passive ability that triggers shockwave on dash
 */
export class V1DashShockwaveSpell extends PersistentSpell {
  constructor(level = 1) {
    super({
      key: 'DASH_SHOCKWAVE',
      name: 'Dash Shockwave',
      description: 'Passive ability that creates a shockwave when you dash, damaging and knocking back enemies',
      category: 'magic',
      damage: 25,
      entityClass: DashShockwave,
      level: level
    });
  }
}
