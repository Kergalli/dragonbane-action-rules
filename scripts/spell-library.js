/**
 * Spell Library - Combat Assistant v2.3
 * Handles spell-to-effect mapping and application
 */

import { DragonbaneUtils } from "./utils.js";

export class SpellLibrary {
  // Complete spell-to-effect mapping from battle plan
  static SPELL_EFFECTS = {
    // Personal spells (apply to caster) - Alphabetized
    Birdsong: {
      effectId: "dse-birdsong",
      effectNameKey: "DRAGONBANE_ACTION_RULES.effects.birdsong",
      dseIcon:
        "modules/dragonbane-status-effects/assets/icons/bird-twitter.svg",
      fallbackIcon: "icons/svg/sound.svg",
      duration: 900, // 15 minutes
    },
    "Power Fist": {
      effectId: "dse-power-fist",
      effectNameKey: "DRAGONBANE_ACTION_RULES.effects.powerFist",
      dseIcon: "modules/dragonbane-status-effects/assets/icons/fist.svg",
      fallbackIcon: "icons/svg/pawprint.svg",
      duration: 900,
    },

    // Range/Touch spells (apply to target) - Alphabetized
    "Enchant Weapon": {
      effectId: "dse-enchanted-weapon",
      effectNameKey: "DRAGONBANE_ACTION_RULES.effects.enchantWeapon",
      dseIcon: "modules/dragonbane-status-effects/assets/icons/magic-axe.svg",
      fallbackIcon: "icons/svg/sword.svg",
      duration: 900,
    },
    "Engulfing Forest": {
      effectId: "dse-ensnared", // Same as Ensnaring Roots
      effectNameKey: "DRAGONBANE_ACTION_RULES.effects.engulfingForest",
      dseIcon: "icons/svg/net.svg",
      fallbackIcon: "icons/svg/net.svg",
      duration: null,
    },
    "Ensnaring Roots": {
      effectId: "dse-ensnared",
      effectNameKey: "DRAGONBANE_ACTION_RULES.effects.ensnaringRoots",
      dseIcon: "icons/svg/net.svg",
      fallbackIcon: "icons/svg/net.svg",
      duration: null, // Permanent
    },
    Flight: {
      effectId: "dse-flying",
      effectNameKey: "DRAGONBANE_ACTION_RULES.effects.flight",
      dseIcon: "icons/svg/wing.svg",
      fallbackIcon: "icons/svg/wing.svg",
      duration: null,
    },
    Longstrider: {
      effectId: "dse-longstrider",
      effectNameKey: "DRAGONBANE_ACTION_RULES.effects.longstrider",
      dseIcon: "icons/svg/wingfoot.svg",
      fallbackIcon: "icons/svg/wingfoot.svg",
      duration: 900,
    },
    Protector: {
      effectId: "dse-protector",
      effectNameKey: "DRAGONBANE_ACTION_RULES.effects.protector",
      dseIcon: "icons/svg/shield.svg",
      fallbackIcon: "icons/svg/shield.svg",
      duration: 21600, // 6 hours in seconds
    },
    Sleep: {
      effectId: "dse-sleep",
      effectNameKey: "DRAGONBANE_ACTION_RULES.effects.sleep",
      dseIcon: "icons/svg/sleep.svg",
      fallbackIcon: "icons/svg/sleep.svg",
      duration: null,
    },
    "Stone Skin": {
      effectId: "dse-stone-skin",
      effectNameKey: "DRAGONBANE_ACTION_RULES.effects.stoneSkin",
      dseIcon: "modules/dragonbane-status-effects/assets/icons/rock-golem.svg",
      fallbackIcon: "icons/svg/mountain.svg",
      duration: 900,
    },

    // Template spells (sphere/cone - skipped in Phase 1) - Alphabetized
    Chill: {
      effectId: "dse-chill",
      effectNameKey: "DRAGONBANE_ACTION_RULES.effects.chill",
      dseIcon:
        "modules/dragonbane-status-effects/assets/icons/ice-spell-cast.svg",
      fallbackIcon: "icons/svg/frozen.svg",
      duration: 900,
    },
    Frost: {
      primary: {
        effectId: "dse-cold",
        effectNameKey: "DRAGONBANE_ACTION_RULES.effects.cold",
        dseIcon:
          "modules/dragonbane-status-effects/assets/icons/thermometer-cold.svg",
        fallbackIcon: "icons/svg/frozen.svg",
        duration: null,
      },
      conditional: {
        effectId: "dse-frozen",
        effectNameKey: "DRAGONBANE_ACTION_RULES.effects.frost",
        dseIcon: "icons/svg/frozen.svg",
        fallbackIcon: "icons/svg/frozen.svg",
        duration: null,
        condition: "non-monster",
      },
    },
    Heat: {
      effectId: "dse-heat",
      effectNameKey: "DRAGONBANE_ACTION_RULES.effects.heat",
      dseIcon: "modules/dragonbane-status-effects/assets/icons/heat-haze.svg",
      fallbackIcon: "icons/svg/fire.svg",
      duration: 900,
    },
  };

  // Swedish spell name translations - Alphabetized
  static SPELL_NAME_TRANSLATIONS = {
    Beskyddare: "Protector",
    Fågelsång: "Birdsong",
    Flyga: "Flight",
    Frost: "Frost", // Same in Swedish
    "Förtrolla vapen": "Enchant Weapon",
    Kraftnäve: "Power Fist",
    Kyla: "Chill",
    Långstige: "Longstrider",
    Snärja: "Ensnaring Roots",
    Stenhud: "Stone Skin",
    Söva: "Sleep",
    Snärskog: "Engulfing Forest",
    Värme: "Heat",
  };

  /**
   * Get effect configuration for a spell (handles localization)
   */
  static getEffectForSpell(spellName) {
    // Check if it's a Swedish name and translate
    const englishName = this.SPELL_NAME_TRANSLATIONS[spellName] || spellName;
    return this.SPELL_EFFECTS[englishName];
  }

  /**
   * Apply spell effect to appropriate target
   */
  static async applySpellEffect(spell, message) {
    try {
      const config = this.getEffectForSpell(spell.name);
      if (!config) return false; // No effect defined for this spell

      // Get the caster (important - keep reference for origin)
      const caster = DragonbaneUtils.getActorFromMessage(message);
      if (!caster) return false;

      // Determine target based on spell type
      const rangeType = spell.system.rangeType;
      let target = caster; // Default for personal spells

      if (["range", "touch"].includes(rangeType)) {
        // Get the selected target for range/touch spells
        const targetToken = Array.from(game.user.targets)[0];
        target = targetToken?.actor || caster;
      }

      // Standard effect application - pass caster for origin
      return await this.applyEffect(config, target, caster);
    } catch (error) {
      console.error(
        `Combat Assistant v2.3 | Error applying spell effect: ${error.message}`
      );
      return false;
    }
  }

  static async applyEffect(config, target, caster = null) {
    const effectId = config.effectId;

    // Check if effect already exists in system
    const existingEffect = CONFIG.statusEffects?.find((e) => e.id === effectId);

    if (!existingEffect) {
      // Create the effect with appropriate icon
      const dseActive = game.modules.get("dragonbane-status-effects")?.active;
      const icon = dseActive ? config.dseIcon : config.fallbackIcon;

      DragonbaneUtils.ensureStatusEffectExists(effectId, icon);
    }

    // Check if target already has this effect
    if (DragonbaneUtils.hasStatusEffect(target, effectId)) {
      return true;
    }

    const effect = DragonbaneUtils.findStatusEffect(effectId);
    if (!effect) return false;

    // Get localized name
    let effectName;
    if (config.effectNameKey) {
      effectName = game.i18n.localize(config.effectNameKey);
    } else if (effect.name) {
      effectName = game.i18n.localize(effect.name);
    } else {
      // Fallback: format the effect ID nicely
      effectName = effectId.replace("dse-", "").replace(/-/g, " ");
      effectName = effectName.charAt(0).toUpperCase() + effectName.slice(1);
    }

    // Create effect data
    const effectData = {
      name: effectName,
      img: effect.img || effect.icon || "icons/svg/aura.svg",
      statuses: [effect.id],
      origin: caster ? caster.uuid : target.uuid,
    };

    // Only add description if it exists AND it's not the auto-generated default
    if (
      effect.description &&
      effect.description !== `${effectId} status effect`
    ) {
      effectData.description = effect.description;
    }
    // If no valid description, don't add a description field at all

    // Add duration if specified
    if (config.duration) {
      effectData.duration = {
        seconds: config.duration,
        startTime: game.time.worldTime,
      };
    }

    // Apply effect (rest of the code stays the same)
    if (target.isOwner || game.user.isGM) {
      await target.createEmbeddedDocuments("ActiveEffect", [effectData]);
    } else {
      if (window.DragonbaneActionRules?.socket) {
        await window.DragonbaneActionRules.socket.executeAsGM(
          "applyStatusEffect",
          {
            targetUuid: target.uuid,
            effectData: effectData,
          }
        );
      }
    }

    return true;
  }
}
