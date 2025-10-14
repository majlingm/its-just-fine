import { spellRegistry } from '../spells/SpellRegistry.js';

// Spell-specific upgrade logic
export function upgradeWeapon(weaponInstance) {
  const spellKey = weaponInstance.spellKey;
  weaponInstance.level++;

  // Spell scaling is now handled by spellData.json - no manual modifications needed!
  // Just increment the level and the spell system will apply the correct scaling automatically.

  // Set upgrade descriptions for UI feedback
  const upgradeDescriptions = {
    THUNDER_STRIKE: ['', 'Increased damage', 'Faster strikes', 'Devastating power', 'Storm fury', 'Storm fury', 'Storm fury'],
    CHAIN_LIGHTNING: ['', 'More chains', 'High voltage', 'Extended range', 'Storm caller', 'Storm caller', 'Storm caller'],
    FIREBALL: ['', 'Hotter flames', 'Piercing fire', 'Twin flames', 'Inferno lance', 'Inferno lance', 'Inferno lance'],
    PYRO_EXPLOSION: ['', 'Bigger boom', 'Faster explosions', 'Mega explosions', 'Apocalypse', 'Apocalypse', 'Apocalypse'],
    RING_OF_FIRE: ['', 'Hotter flames', 'Larger ring', 'Inferno ring', 'Ring of doom', 'Ring of doom', 'Ring of doom'],
    ICE_LANCE: ['', 'Sharper ice', 'Deep freeze', 'Twin lances', 'Glacial storm', 'Glacial storm', 'Glacial storm'],
    RING_OF_ICE: ['', 'Colder ice', 'Freezing aura', 'Ice fortress', 'Absolute zero', 'Absolute zero', 'Absolute zero'],
    MAGIC_BULLET: ['', 'Empowered magic', 'Rapid fire', 'Piercing magic', 'Arcane barrage', 'Arcane barrage', 'Arcane barrage'],
    DASH_SHOCKWAVE: ['', 'Increased power', 'Wider shockwave', 'Devastating force', 'Cataclysmic wave', 'Cataclysmic wave', 'Cataclysmic wave']
  };

  // Store upgrade description on weaponInstance for UI
  const levelIndex = Math.min(weaponInstance.level, 7) - 1;
  weaponInstance.upgradeDesc = upgradeDescriptions[spellKey]?.[weaponInstance.level] || '';

  return weaponInstance;
}

// Generate spell upgrade option
export function createWeaponUpgradeOption(spellKey, currentLevel = 0) {
  const spell = spellRegistry.createSpell(spellKey, currentLevel + 1);
  const levelText = currentLevel === 0 ? '' : ` (Lv.${currentLevel + 1})`;

  // Get upgrade description
  const upgradeDescriptions = {
    THUNDER_STRIKE: ['', 'Increased damage', 'Faster strikes', 'Devastating power', 'Storm fury', 'Storm fury', 'Storm fury'],
    CHAIN_LIGHTNING: ['', 'More chains', 'High voltage', 'Extended range', 'Storm caller', 'Storm caller', 'Storm caller'],
    FIREBALL: ['', 'Hotter flames', 'Piercing fire', 'Twin flames', 'Inferno lance', 'Inferno lance', 'Inferno lance'],
    PYRO_EXPLOSION: ['', 'Bigger boom', 'Faster explosions', 'Mega explosions', 'Apocalypse', 'Apocalypse', 'Apocalypse'],
    RING_OF_FIRE: ['', 'Hotter flames', 'Larger ring', 'Inferno ring', 'Ring of doom', 'Ring of doom', 'Ring of doom'],
    ICE_LANCE: ['', 'Sharper ice', 'Deep freeze', 'Twin lances', 'Glacial storm', 'Glacial storm', 'Glacial storm'],
    RING_OF_ICE: ['', 'Colder ice', 'Freezing aura', 'Ice fortress', 'Absolute zero', 'Absolute zero', 'Absolute zero'],
    MAGIC_BULLET: ['', 'Empowered magic', 'Rapid fire', 'Piercing magic', 'Arcane barrage', 'Arcane barrage', 'Arcane barrage'],
    DASH_SHOCKWAVE: ['', 'Increased power', 'Wider shockwave', 'Devastating force', 'Cataclysmic wave', 'Cataclysmic wave', 'Cataclysmic wave']
  };

  const upgradeDesc = upgradeDescriptions[spellKey]?.[currentLevel + 1] || '';

  return {
    id: spellKey.toLowerCase(),
    name: spell.name + levelText,
    desc: currentLevel === 0 ? spell.description : 'Upgrade: ' + upgradeDesc,
    type: 'weapon',
    spellKey: spellKey,
    apply: (player) => {
      const existing = player.weapons.find(w => w.spellKey === spellKey);
      if (existing) {
        upgradeWeapon(existing);
      } else {
        player.weapons.push({ spellKey: spellKey, level: 1, lastShot: 0 });
      }
    }
  };
}
