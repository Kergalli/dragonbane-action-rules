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
      console.error(`DragonbaneUtils | Error extracting ${itemType}:`, error);
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
      console.warn(
        `${moduleId} | Failed to get setting ${settingName}:`,
        error
      );
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

      // Get debug setting - use direct game.settings.get since this might be called
      // before settings are fully initialized
      let debugEnabled = false;
      try {
        debugEnabled = game.settings.get(correctModuleId, "debugMode") || false;
      } catch (error) {
        // Settings not ready yet, default to false
        debugEnabled = false;
      }

      if (debugEnabled) {
        console.log(`${correctModuleId} | ${component}: ${message}`);
      }
    } catch (error) {
      // Fallback for any errors
      console.log(`${moduleId} | ${component}: ${message}`);
    }
  }

  /**
   * Check if skill is EVADE skill (simplified)
   */
  static isEvadeSkill(skill) {
    if (!skill || skill.type !== "skill") return false;

    const skillNameLower = skill.name.toLowerCase();
    const evadeTerm = (
      game.i18n.localize("DoD.skills.evade") || "evade"
    ).toLowerCase();

    return skillNameLower === evadeTerm;
  }

  /**
   * Check if spell has reaction casting time (fixed for localization)
   */
  static isSpellReactionCastingTime(spell) {
    if (!spell || spell.type !== "spell") return false;

    const castingTime = spell.system?.castingTime;
    if (!castingTime) return false;

    // Compare against English key since castingTime is stored as English key
    return castingTime.toLowerCase() === "reaction";
  }

  /**
   * Detect EVADE from text content (simplified)
   */
  static isEvadeSkillRollFromText(content) {
    if (!content) return false;

    const lowerContent = content.toLowerCase();
    const evadeTerm = (
      game.i18n.localize("DoD.skills.evade") || "evade"
    ).toLowerCase();
    const successTerm = (
      game.i18n.localize("DoD.roll.success") || "success"
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

  /**
   * Check if weapon has specific feature (enhanced for localization)
   */
  static hasWeaponFeature(weapon, featureKey, fallbackTerm) {
    if (!weapon || !weapon.system) return false;

    const localizedTerm = (
      game.i18n.localize(featureKey) || fallbackTerm
    ).toLowerCase();

    // Check in features array
    if (weapon.system.features && Array.isArray(weapon.system.features)) {
      return weapon.system.features.some((feature) => {
        const featureLower = feature.toLowerCase();
        // Check both localized term and fallback term (English key)
        return (
          featureLower === localizedTerm ||
          featureLower === fallbackTerm.toLowerCase()
        );
      });
    }

    // Check if weapon has feature method
    if (typeof weapon.hasWeaponFeature === "function") {
      return (
        weapon.hasWeaponFeature(localizedTerm) ||
        weapon.hasWeaponFeature(fallbackTerm)
      );
    }

    return false;
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
  static hasStatusEffect(actor, effectIdOrName) {
    if (!actor || !effectIdOrName) return false;

    const statusEffectId = effectIdOrName.toLowerCase().replace(/\s+/g, "-");

    return actor.effects.some(
      (effect) =>
        effect.statuses?.has(effectIdOrName) ||
        effect.statuses?.has(statusEffectId) ||
        effect.name === effectIdOrName
    );
  }

  /**
   * Ensure a status effect exists in CONFIG.statusEffects - FIXED for v12+
   */
  static ensureStatusEffectExists(
    effectName,
    iconPath = "icons/svg/anchor.svg"
  ) {
    if (!effectName) return false;

    const statusEffectId = effectName.toLowerCase().replace(/\s+/g, "-");

    // Check if it already exists
    const existingEffect = DragonbaneUtils.findStatusEffect(effectName);
    if (existingEffect) {
      return true;
    }

    // Create new status effect with v12+ compatible properties
    const newStatusEffect = {
      id: statusEffectId,
      name: effectName, // Use 'name' instead of deprecated 'label'
      img: iconPath, // Also include 'img' for v12+ compatibility
    };

    if (!CONFIG.statusEffects) CONFIG.statusEffects = [];
    CONFIG.statusEffects.push(newStatusEffect);

    return true;
  }

  /**
   * Toggle a status effect on an actor
   */
  static async toggleStatusEffect(actor, effectIdOrName, isActive) {
    if (!actor) return false;

    const statusEffect = DragonbaneUtils.findStatusEffect(effectIdOrName);
    if (!statusEffect) return false;

    try {
      await actor.toggleStatusEffect(statusEffect.id, { active: isActive });
      return true;
    } catch (error) {
      console.error("DragonbaneUtils | Error toggling status effect:", error);
      return false;
    }
  }

  /**
   * Escape special regex characters
   */
  static escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
