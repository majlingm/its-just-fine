import { PersistentSpell } from '../PersistentSpell.js';
import { DashShockwave } from '../../entities/DashShockwave.js';

/**
 * DashShockwaveSpell - Passive ability that triggers shockwave on dash
 */
export class DashShockwaveSpell extends PersistentSpell {
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
