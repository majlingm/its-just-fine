import { SPELL_TYPES } from '../spells/spellTypes.js';
import { spellCaster } from '../systems/SpellCaster.js';

// Spell-specific upgrade logic
export function upgradeWeapon(weaponInstance) {
  const spell = weaponInstance.type;
  weaponInstance.level++;

  // Notify spell caster to clear cache for this spell
  spellCaster.upgradeSpell(weaponInstance);

  // Apply upgrades based on spell type and level (temporary compatibility)
  switch (spell) {
    // Lightning Spells
    case SPELL_TYPES.THUNDER_STRIKE:
      if (weaponInstance.level === 2) {
        spell.damage *= 1.3;
        spell.desc = 'Increased damage';
      } else if (weaponInstance.level === 3) {
        spell.baseCooldownMax *= 0.8;
        spell.baseCooldownMin *= 0.8;
        spell.desc = 'Faster strikes';
      } else if (weaponInstance.level === 4) {
        spell.damage *= 1.4;
        spell.desc = 'Devastating power';
      } else if (weaponInstance.level >= 5) {
        spell.baseCooldownMax *= 0.7;
        spell.baseCooldownMin *= 0.7;
        spell.damage *= 1.3;
        spell.desc = 'Storm fury';
      }
      break;

    case SPELL_TYPES.CHAIN_LIGHTNING:
      if (weaponInstance.level === 2) {
        spell.chainCount = 4;
        spell.desc = 'More chains';
      } else if (weaponInstance.level === 3) {
        spell.damage *= 1.4;
        spell.desc = 'High voltage';
      } else if (weaponInstance.level === 4) {
        spell.chainRange *= 1.5;
        spell.desc = 'Extended range';
      } else if (weaponInstance.level >= 5) {
        spell.chainCount = 6;
        spell.cooldown *= 0.8;
        spell.desc = 'Storm caller';
      }
      break;

    // Fire Spells
    case SPELL_TYPES.FIREBALL:
      if (weaponInstance.level === 2) {
        spell.damage *= 1.3;
        spell.desc = 'Hotter flames';
      } else if (weaponInstance.level === 3) {
        spell.pierce += 1;
        spell.desc = 'Piercing fire';
      } else if (weaponInstance.level === 4) {
        spell.projectileCount = 2;
        spell.spread = 0.2;
        spell.desc = 'Twin flames';
      } else if (weaponInstance.level >= 5) {
        spell.cooldown *= 0.75;
        spell.damage *= 1.3;
        spell.desc = 'Inferno lance';
      }
      break;

    case SPELL_TYPES.PYRO_EXPLOSION:
      if (weaponInstance.level === 2) {
        spell.damage *= 1.4;
        spell.desc = 'Bigger boom';
      } else if (weaponInstance.level === 3) {
        spell.cooldown *= 0.85;
        spell.desc = 'Faster explosions';
      } else if (weaponInstance.level === 4) {
        spell.damage *= 1.5;
        spell.desc = 'Mega explosions';
      } else if (weaponInstance.level >= 5) {
        spell.cooldown *= 0.75;
        spell.damage *= 1.4;
        spell.desc = 'Apocalypse';
      }
      break;

    case SPELL_TYPES.RING_OF_FIRE:
      if (weaponInstance.level === 2) {
        spell.damage *= 1.4;
        spell.desc = 'Hotter flames';
      } else if (weaponInstance.level === 3) {
        // Increase ring radius (need to update RingOfFire entity to use spell config)
        spell.desc = 'Larger ring';
      } else if (weaponInstance.level === 4) {
        spell.damage *= 1.5;
        spell.desc = 'Inferno ring';
      } else if (weaponInstance.level >= 5) {
        spell.damage *= 1.4;
        spell.desc = 'Ring of doom';
      }
      break;

    // Ice Spells
    case SPELL_TYPES.ICE_LANCE:
      if (weaponInstance.level === 2) {
        spell.damage *= 1.3;
        spell.desc = 'Sharper ice';
      } else if (weaponInstance.level === 3) {
        spell.pierce += 1;
        spell.desc = 'Deep freeze';
      } else if (weaponInstance.level === 4) {
        spell.projectileCount = 2;
        spell.spread = 0.15;
        spell.desc = 'Twin lances';
      } else if (weaponInstance.level >= 5) {
        spell.cooldown *= 0.75;
        spell.damage *= 1.4;
        spell.desc = 'Glacial storm';
      }
      break;

    // Magic Spells
    case SPELL_TYPES.MAGIC_BULLET:
      if (weaponInstance.level === 2) {
        spell.damage *= 1.3;
        spell.desc = 'Empowered magic';
      } else if (weaponInstance.level === 3) {
        spell.cooldown *= 0.8;
        spell.desc = 'Rapid fire';
      } else if (weaponInstance.level === 4) {
        spell.pierce += 1;
        spell.desc = 'Piercing magic';
      } else if (weaponInstance.level >= 5) {
        spell.cooldown *= 0.7;
        spell.damage *= 1.4;
        spell.desc = 'Arcane barrage';
      }
      break;
  }

  return weaponInstance;
}

// Generate spell upgrade option
export function createWeaponUpgradeOption(spellType, currentLevel = 0) {
  const levelText = currentLevel === 0 ? '' : ` (Lv.${currentLevel + 1})`;

  return {
    id: spellType.name.toLowerCase().replace(/\s+/g, '_'),
    name: spellType.name + levelText,
    desc: currentLevel === 0 ? spellType.desc : 'Upgrade: ' + spellType.desc,
    type: 'weapon',
    weaponType: spellType,
    apply: (player) => {
      const existing = player.weapons.find(w => w.type === spellType);
      if (existing) {
        upgradeWeapon(existing);
      } else {
        player.weapons.push({ type: spellType, level: 1, lastShot: 0 });
      }
    }
  };
}
