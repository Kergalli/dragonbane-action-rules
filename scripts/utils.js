/**
 * Dragonbane Combat Assistant - Shared Utility Methods
 * Common functionality used across multiple components
 */

export class DragonbaneUtils {
  /**
   * Get actor from chat message speaker data, preferring token-specific data
   */
  static getActorFromSpeakerData(speakerData) {
    if (!speakerData) return null;

    // Try token-specific actor first
    if (speakerData.scene && speakerData.token) {
      const scene = game.scenes.get(speakerData.scene);
      const token = scene?.tokens.get(speakerData.token);
      if (token?.actor) {
        return token.actor;
      }
    }

    // Fallback to base actor
    if (speakerData.actor) {
      return game.actors.get(speakerData.actor);
    }

    return null;
  }

  /**
   * Get actor from message speaker
   */
  static getActorFromMessage(message) {
    return DragonbaneUtils.getActorFromSpeakerData(message?.speaker);
  }

  /**
   * Extract item information from chat message by type
   */
  static extractItemFromMessage(message, itemType) {
    try {
      const UUID_PATTERN = /@UUID\[(?:[^\.]+\.)*Item\.([^\]]+)\]/;
      const uuidMatch = message.content.match(UUID_PATTERN);

      if (uuidMatch && message.speaker?.actor) {
        const itemId = uuidMatch[1];
        const actor = DragonbaneUtils.getActorFromMessage(message);
        const item = actor?.items.get(itemId);

        if (item && item.type === itemType) {
          return item;
        }
      }

      return null;
    } catch (error) {
      // CHANGED: Use DoD_Utility.WARNING instead of console.error
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Error extracting ${itemType}: ${error.message}`);
      } else {
        console.error(`DragonbaneUtils | Error extracting ${itemType}:`, error);
      }
      return null;
    }
  }

  /**
   * Extract weapon from message
   */
  static extractWeaponFromMessage(message) {
    return DragonbaneUtils.extractItemFromMessage(message, "weapon");
  }

  /**
   * Extract skill from message
   */
  static extractSkillFromMessage(message) {
    return DragonbaneUtils.extractItemFromMessage(message, "skill");
  }

  /**
   * Extract spell from message
   */
  static extractSpellFromMessage(message) {
    return DragonbaneUtils.extractItemFromMessage(message, "spell");
  }

  /**
   * Check if actor is monster type
   */
  static isMonsterActor(actor) {
    if (!actor) return false;

    if (actor.type === "monster") {
      DragonbaneUtils.debugLog(
        "DragonbaneUtils",
        "Utils",
        `Monster detected: ${actor.name}`
      );
      return true;
    }

    return false;
  }

  /**
   * Get setting value with fallback
   * Updated to align with new settings system
   */
  static getSetting(moduleId, settingName, fallback) {
    try {
      return game.settings.get(moduleId, settingName);
    } catch (error) {
      // CHANGED: Use DoD_Utility.WARNING instead of console.warn
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Failed to get setting ${settingName}: ${error.message}`
        );
      } else {
        console.warn(
          `${moduleId} | Failed to get setting ${settingName}:`,
          error
        );
      }
      return fallback;
    }
  }

  /**
   * Debug logging with component identification (robust version)
   */
  static debugLog(moduleId, component, message) {
    try {
      // Handle legacy calls with wrong moduleId
      const correctModuleId =
        moduleId === "DragonbaneUtils" ? "dragonbane-action-rules" : moduleId;

      // Only log if debug mode is enabled
      if (game.settings?.get?.(correctModuleId, "debugMode")) {
        console.log(`${correctModuleId} | ${component} | ${message}`);
      }
    } catch (error) {
      // Fallback for debug logging - don't break functionality
      console.log(`[DEBUG] ${component} | ${message}`);
    }
  }

  /**
   * Check if weapon has specific feature using core Dragonbane patterns
   */
  static hasWeaponFeature(weapon, dodFeatureKey, fallbackKey) {
    if (!weapon || !weapon.system?.features) return false;

    // Get localized feature name from core system
    const featureName = game.i18n.localize(dodFeatureKey);

    // Check if weapon has this feature
    return weapon.system.features.some((feature) => {
      return (
        feature === featureName ||
        feature.toLowerCase() === featureName.toLowerCase() ||
        feature.toLowerCase() === fallbackKey?.toLowerCase()
      );
    });
  }

  /**
   * Check if weapon has the "Topple" feature
   */
  static hasToppleFeature(weapon) {
    return DragonbaneUtils.hasWeaponFeature(
      weapon,
      "DoD.weaponFeatureTypes.toppling",
      "toppling"
    );
  }

  /**
   * Check if weapon has the "Long" property
   */
  static hasLongProperty(weapon) {
    return DragonbaneUtils.hasWeaponFeature(
      weapon,
      "DoD.weaponFeatureTypes.long",
      "long"
    );
  }

  /**
   * Check if weapon has the "Thrown" feature
   */
  static hasThrownFeature(weapon) {
    return DragonbaneUtils.hasWeaponFeature(
      weapon,
      "DoD.weaponFeatureTypes.thrown",
      "thrown"
    );
  }

  /**
   * Detect dragon roll in message (simplified)
   */
  static detectDragonRoll(message) {
    if (!message || !message.content) return false;

    const dragonTerm = game.i18n.localize("DoD.roll.dragon") || "dragon";
    const dragonWord = dragonTerm.split(" ")[0] || "dragon";

    // Simple case-insensitive search
    return message.content.toLowerCase().includes(dragonWord.toLowerCase());
  }

  /**
   * Check if combat is currently active and started
   */
  static isCombatActive() {
    return game.combat?.started || false;
  }

  /**
   * Check if combat exists (but may not be started)
   */
  static hasCombat() {
    return game.combat !== null && game.combat !== undefined;
  }

  /**
   * Find a status effect by name or ID - FIXED for Foundry v12+
   */
  static findStatusEffect(effectName) {
    if (!effectName) return null;

    const statusEffectId = effectName.toLowerCase().replace(/\s+/g, "-");

    return (
      CONFIG.statusEffects?.find(
        (effect) =>
          effect.id === statusEffectId ||
          effect.name === effectName ||
          effect.id === effectName ||
          // Legacy support for v11 and earlier
          effect.label === effectName
      ) || null
    );
  }

  /**
   * Check if an actor has a specific status effect
   */
  static hasStatusEffect(actor, effectName) {
    if (!actor || !effectName) return false;

    // Updated for v12+ compatibility
    return (
      actor.statuses?.has(effectName.toLowerCase().replace(/\s+/g, "-")) ||
      false
    );
  }

  /**
   * FIXED: Toggle status effect using v12+ API to avoid deprecation warnings
   */
  static async toggleStatusEffect(actor, effectName, active = true) {
    if (!actor || !effectName) return false;

    try {
      const effect = DragonbaneUtils.findStatusEffect(effectName);
      if (!effect) return false;

      const hasEffect = DragonbaneUtils.hasStatusEffect(actor, effectName);

      if (active && !hasEffect) {
        // FIXED: Use Foundry's native ActiveEffect API instead of core system's deprecated path
        const effectData = {
          name: game.i18n.localize(effect.name || effect.label || effectName),
          img: effect.img || effect.icon || "icons/svg/aura.svg",
          statuses: [effect.id],
          origin: actor.uuid,
        };

        await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
        return true;
      } else if (!active && hasEffect) {
        // Remove the effect using native API
        const activeEffect = actor.effects.find(
          (e) =>
            e.statuses?.has(effect.id) ||
            e.name === effectName ||
            e.name === effect.name ||
            e.name === effect.label
        );

        if (activeEffect) {
          await activeEffect.delete();
          return true;
        }
      }

      return false;
    } catch (error) {
      // CHANGED: Use DoD_Utility.WARNING instead of console.error
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error toggling status effect ${effectName}: ${error.message}`
        );
      } else {
        console.error(
          `DragonbaneUtils | Error toggling status effect ${effectName}:`,
          error
        );
      }
      return false;
    }
  }

  /**
   * Ensure a status effect exists in the system
   */
  static ensureStatusEffectExists(effectName, iconPath = "icons/svg/aura.svg") {
    if (!effectName) return false;

    const existingEffect = DragonbaneUtils.findStatusEffect(effectName);
    if (existingEffect) return true;

    try {
      // For Foundry v12+, status effects are typically managed through CONFIG
      const effectId = effectName.toLowerCase().replace(/\s+/g, "-");

      // Check if we can add it to the system (this may require GM permissions)
      const newEffect = {
        id: effectId,
        name: effectName,
        img: iconPath, // Updated property name for v12+
        description: `${effectName} status effect`,
      };

      // Add to CONFIG.statusEffects if possible
      if (CONFIG.statusEffects && Array.isArray(CONFIG.statusEffects)) {
        CONFIG.statusEffects.push(newEffect);
        return true;
      }

      return false;
    } catch (error) {
      // CHANGED: Use DoD_Utility.WARNING instead of console.error
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error ensuring status effect exists ${effectName}: ${error.message}`
        );
      } else {
        console.error(
          `DragonbaneUtils | Error ensuring status effect exists ${effectName}:`,
          error
        );
      }
      return false;
    }
  }

  /**
   * Check if skill is EVADE skill (language-agnostic)
   */
  static isEvadeSkill(skill) {
    if (!skill || !skill.name) return false;

    // Get localized EVADE skill name
    const evadeName = game.i18n.localize("DoD.skills.evade") || "evade";

    return (
      skill.name.toLowerCase() === evadeName.toLowerCase() ||
      skill.name.toLowerCase().includes("evade")
    );
  }

  /**
   * Check if message content indicates EVADE skill roll from text
   */
  static isEvadeSkillRollFromText(content) {
    if (!content) return false;

    const lowerContent = content.toLowerCase();
    const evadeTerm = (
      game.i18n.localize("DoD.skills.evade") || "evade"
    ).toLowerCase();
    const successTerm = (
      game.i18n.localize("DoD.roll.success") || "succeeded"
    ).toLowerCase();

    return (
      lowerContent.includes(evadeTerm) &&
      (lowerContent.includes(successTerm) || lowerContent.includes("succeed"))
    );
  }

  /**
   * Compare STR damage bonuses to determine if shove is possible
   */
  static canShove(attacker, defender) {
    const attackerBonus = DragonbaneUtils.extractStrDamageBonus(attacker);
    const defenderBonus = DragonbaneUtils.extractStrDamageBonus(defender);

    return attackerBonus >= defenderBonus;
  }

  /**
   * Check if spell attack
   */
  static isSpellAttack(message) {
    const item = DragonbaneUtils.extractItemFromMessage(message, "spell");
    return item && item.type === "spell";
  }

  /**
   * Check if spell has reaction casting time
   */
  static isSpellReactionCastingTime(spell) {
    if (!spell || !spell.system) return false;

    try {
      const castingTime = spell.system.castingTime || "";
      // Check for "Reaction" casting time (case-insensitive)
      return castingTime.toLowerCase().includes("reaction");
    } catch (error) {
      // CHANGED: Use DoD_Utility.WARNING instead of console.error
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error checking spell casting time: ${error.message}`
        );
      } else {
        console.error(
          "DragonbaneUtils | Error checking spell casting time:",
          error
        );
      }
      return false;
    }
  }

  /**
   * Determine if this client should create rules messages
   */
  static shouldCreateRules(message) {
    // If there's a GM online, only let the GM create rules
    const activeGM = game.users.find((user) => user.active && user.isGM);
    if (activeGM) {
      return game.user.isGM;
    }

    // If no GM is online, let the message author create rules
    const messageAuthor = game.users.get(message.author || message.user);
    if (messageAuthor && messageAuthor.active) {
      return game.user.id === (message.author || message.user);
    }

    // Fallback: let the first active user create rules
    const firstActiveUser = game.users.find((user) => user.active);
    return firstActiveUser && game.user.id === firstActiveUser.id;
  }

  /**
   * Get current target from user's targets
   */
  static getCurrentTarget() {
    const targets = Array.from(game.user.targets);
    if (targets.length !== 1) return null;
    return targets[0].actor;
  }

  /**
   * Extract STR damage bonus from actor
   */
  static extractStrDamageBonus(actor) {
    if (!actor || !actor.system) return 0;
    const bonusValue = actor.system?.damageBonus?.str?.value;
    if (!bonusValue) return 0;
    if (typeof bonusValue === "number") return bonusValue;
    if (typeof bonusValue === "string") {
      if (
        bonusValue.toLowerCase() === "none" ||
        bonusValue === "" ||
        bonusValue === "0"
      )
        return 0;
      const diceKeyMatch = bonusValue.match(/^d(\d+)$/i);
      if (diceKeyMatch) return parseInt(diceKeyMatch[1]);
      const displayMatch = bonusValue.match(/^D(\d+)$/i);
      if (displayMatch) return parseInt(displayMatch[1]);
      const numericMatch = bonusValue.match(/^(\d+)$/);
      if (numericMatch) return parseInt(numericMatch[1]);
    }
    return 0;
  }
}
