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
      effectName: "EFFECT.StatusBirdsong",
      dseIcon:
        "modules/dragonbane-status-effects/assets/icons/bird-twitter.svg",
      fallbackIcon: "icons/svg/sound.svg",
      duration: 900, // 15 minutes
    },
    "Power Fist": {
      effectId: "dse-power-fist",
      effectName: "EFFECT.StatusPowerFist",
      dseIcon: "modules/dragonbane-status-effects/assets/icons/fist.svg",
      fallbackIcon: "icons/svg/pawprint.svg",
      duration: 900,
    },

    // Range/Touch spells (apply to target) - Alphabetized
    "Enchant Weapon": {
      effectId: "dse-enchanted-weapon",
      effectName: "EFFECT.StatusEnchantedWeapon",
      dseIcon: "modules/dragonbane-status-effects/assets/icons/magic-axe.svg",
      fallbackIcon: "icons/svg/sword.svg",
      duration: 900,
    },
    "Engulfing Forest": {
      effectId: "dse-ensnared", // Same as Ensnaring Roots
      effectName: "EFFECT.StatusEnsnared",
      dseIcon: "icons/svg/net.svg",
      fallbackIcon: "icons/svg/net.svg",
      duration: null,
    },
    "Ensnaring Roots": {
      effectId: "dse-ensnared",
      effectName: "EFFECT.StatusEnsnared",
      dseIcon: "icons/svg/net.svg",
      fallbackIcon: "icons/svg/net.svg",
      duration: null, // Permanent
    },
    Flight: {
      effectId: "dse-flying",
      effectName: "EFFECT.StatusFlying",
      dseIcon: "icons/svg/wing.svg",
      fallbackIcon: "icons/svg/wing.svg",
      duration: null,
    },
    Longstrider: {
      effectId: "dse-longstrider",
      effectName: "EFFECT.StatusLongstrider",
      dseIcon: "icons/svg/wingfoot.svg",
      fallbackIcon: "icons/svg/wingfoot.svg",
      duration: 900,
    },
    Protector: {
      effectId: "dse-protector",
      effectName: "EFFECT.StatusProtector",
      dseIcon: "icons/svg/shield.svg",
      fallbackIcon: "icons/svg/shield.svg",
      duration: 21600, // 6 hours in seconds
    },
    Sleep: {
      effectId: "dse-sleep",
      effectName: "EFFECT.StatusAsleep",
      dseIcon: "icons/svg/sleep.svg",
      fallbackIcon: "icons/svg/sleep.svg",
      duration: null,
    },
    "Stone Skin": {
      effectId: "dse-stone-skin",
      effectName: "EFFECT.StatusStoneSkin",
      dseIcon: "modules/dragonbane-status-effects/assets/icons/rock-golem.svg",
      fallbackIcon: "icons/svg/mountain.svg",
      duration: 900,
    },

    // Template spells (sphere/cone - skipped in Phase 1) - Alphabetized
    Chill: {
      effectId: "dse-chill",
      effectName: "EFFECT.StatusChill",
      dseIcon:
        "modules/dragonbane-status-effects/assets/icons/ice-spell-cast.svg",
      fallbackIcon: "icons/svg/frozen.svg",
      duration: 900,
    },
    Frost: {
      primary: {
        effectId: "dse-cold",
        effectName: "EFFECT.StatusCold",
        dseIcon:
          "modules/dragonbane-status-effects/assets/icons/thermometer-cold.svg",
        fallbackIcon: "icons/svg/frozen.svg",
        duration: null,
      },
      conditional: {
        effectId: "dse-frozen",
        effectName: "EFFECT.StatusFrozen",
        dseIcon: "icons/svg/frozen.svg",
        fallbackIcon: "icons/svg/frozen.svg",
        duration: null,
        condition: "non-monster",
      },
    },
    Heat: {
      effectId: "dse-heat",
      effectName: "EFFECT.StatusHeat",
      dseIcon: "modules/dragonbane-status-effects/assets/icons/heat-haze.svg",
      fallbackIcon: "icons/svg/fire.svg",
      duration: 900,
    },
  };

  // Swedish spell name translations - Alphabetized
  static SPELL_NAME_TRANSLATIONS = {
    Beskyddare: "Protector",
    Fågelsång: "Birdsong",
    Flygning: "Flight",
    Frost: "Frost", // Same in Swedish
    "Förtrollat vapen": "Enchant Weapon",
    Kraftnäve: "Power Fist",
    Kyla: "Chill",
    Långsteg: "Longstrider",
    "Snärjande rötter": "Ensnaring Roots",
    Stenhud: "Stone Skin",
    Sömn: "Sleep",
    "Uppslukande skog": "Engulfing Forest",
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

      // Handle Frost special case (though it's a template spell, keeping for future)
      if (spell.name === "Frost" || spell.name === "Frost") {
        return await this.applyFrostEffect(config, target, caster);
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

  /**
   * Apply a single effect to target
   */
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
      return true; // Already has effect
    }

    // We need to apply the effect manually to set the correct origin
    const effect = DragonbaneUtils.findStatusEffect(effectId);
    if (!effect) return false;

    // Create effect data with caster as origin
    const effectData = {
      name: game.i18n.localize(effect.name || effectId), // Removed effect.label
      img: effect.img || effect.icon || "icons/svg/aura.svg",
      statuses: [effect.id],
      origin: caster ? caster.uuid : target.uuid, // Use caster's UUID if available
    };

    // Add duration if specified
    if (config.duration) {
      effectData.duration = {
        seconds: config.duration,
        startTime: game.time.worldTime,
      };
    }

    // Check if we have permission to modify the target
    if (target.isOwner || game.user.isGM) {
      // We have permission - apply directly
      await target.createEmbeddedDocuments("ActiveEffect", [effectData]);
    } else {
      // No permission - use socket to request GM to apply it
      // FIXED: Pass actor UUID instead of just ID
      game.socket.emit("module.dragonbane-action-rules", {
        action: "applyStatusEffect",
        targetUuid: target.uuid, // Changed from targetId to targetUuid
        effectData: effectData,
      });

      // Also log for debugging
      if (game.users.find((u) => u.isGM && u.active)) {
        console.log(
          `Combat Assistant v2.3 | Requesting GM to apply ${effectId} to ${target.name}`
        );
      }
    }

    return true;
  }

  /**
   * Special handler for Frost spell (dual effects)
   * Note: Frost is a template spell, so this won't be used in Phase 1
   * Keeping for future template support
   */
  static async applyFrostEffect(config, target, caster) {
    // Apply Cold to all targets - pass caster for origin
    await this.applyEffect(config.primary, target, caster);

    // Apply Frozen only to non-monsters - pass caster for origin
    if (target.type !== "monster") {
      await this.applyEffect(config.conditional, target, caster);
    }

    return true;
  }
}
