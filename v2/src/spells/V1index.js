/**
 * Spell System - Exported from v1
 * Note: These are the original spell classes from v1, copied as-is for initial integration
 *
 * Dependencies required for full functionality:
 * - Entity classes (ColoredLightning, DashShockwave, IceLance, MagicBullet, etc.)
 * - Effect classes (FireEffect, LightningEffect)
 * - TypedProjectilePool system
 */

// Base spell classes
export { Spell } from './V1Spell.js';
export { ProjectileSpell } from './V1ProjectileSpell.js';
export { InstantSpell } from './V1InstantSpell.js';
export { PersistentSpell } from './V1PersistentSpell.js';

// Legacy spell
export { FireballSpell } from './FireballSpell.js';

// Spell implementations
export { ChainLightningSpell } from './spells/ChainLightningSpell.js';
export { DashShockwaveSpell } from './spells/DashShockwaveSpell.js';
export { IceLanceSpell } from './spells/IceLanceSpell.js';
export { MagicBulletSpell } from './spells/MagicBulletSpell.js';
export { PyroExplosionSpell } from './spells/PyroExplosionSpell.js';
export { RingOfFireSpell } from './spells/RingOfFireSpell.js';
export { RingOfIceSpell } from './spells/RingOfIceSpell.js';
export { ShadowBoltSpell } from './spells/ShadowBoltSpell.js';
export { SkullShieldSpell } from './spells/SkullShieldSpell.js';
export { ThunderStrikeSpell } from './spells/ThunderStrikeSpell.js';

// Utilities
export { SpellRegistry } from './SpellRegistry.js';
export { applySpellLevelScaling } from './V1spellLevelScaling.js';
