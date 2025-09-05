/**
 * Dragonbane Combat Assistant - Attack Validation
 */

import { SETTINGS, getSetting } from "./settings.js";
import { DragonbaneUtils } from "./utils.js";

export class DragonbaneValidator {
  constructor(moduleId) {
    this.moduleId = moduleId;
  }

  /**
   * Perform weapon attack validation - main entry point
   */
  async performWeaponAttack(weaponName, actor = null) {
    try {
      // Get actor and token
      const { selectedActor, selectedToken } = this.getActorAndToken(actor);
      if (!selectedActor || !selectedToken) {
        return {
          success: false,
          message: game.i18n.format(
            "DRAGONBANE_ACTION_RULES.validation.selectToken",
            { weapon: weaponName }
          ),
        };
      }

      // Find weapon
      const weapon = selectedActor.items.find(
        (i) => i.name === weaponName && i.type === "weapon"
      );
      if (!weapon) {
        return {
          success: false,
          message: game.i18n.format(
            "DRAGONBANE_ACTION_RULES.validation.noWeapon",
            { weapon: weaponName }
          ),
        };
      }

      // Get validation settings with override checking
      const settings = this.getValidationSettings();
      DragonbaneUtils.debugLog(
        this.moduleId,
        "Validator",
        `Validation for ${weaponName} - Target: ${settings.enforceTarget}, Range: ${settings.enforceRange}`
      );

      // Perform validations
      if (settings.enforceTarget) {
        const targetValidation = this.validateTarget(weaponName);
        if (!targetValidation.success) return targetValidation;
      }

      if (
        settings.enforceRange &&
        selectedToken &&
        game.user.targets.size > 0
      ) {
        const targetToken = Array.from(game.user.targets)[0];
        const rangeValidation = this.validateRange(
          selectedToken,
          targetToken,
          weapon,
          weaponName
        );
        if (!rangeValidation.success) return rangeValidation;
      }

      return { success: true };
    } catch (error) {
      console.error(`${this.moduleId} | Error in weapon validation:`, error);
      return { success: true }; // Allow attack on error
    }
  }

  /**
   * Perform spell cast validation - mirrors performWeaponAttack
   */
  async performSpellCast(spellName, actor = null) {
    try {
      // Only validate if spell validation is enabled
      if (!DragonbaneUtils.getSetting(this.moduleId, "enableSpellValidation")) {
        return { success: true };
      }

      // Get actor and token
      const { selectedActor, selectedToken } = this.getActorAndToken(actor);
      if (!selectedActor || !selectedToken) {
        return {
          success: false,
          message: `You must select a token to cast ${spellName}`,
        };
      }

      // Find spell
      const spell = selectedActor.items.find(
        (i) => i.name === spellName && i.type === "spell"
      );
      if (!spell) {
        return {
          success: false,
          message: `Spell ${spellName} not found`,
        };
      }

      // Check if excluded from validation
      if (isSpellExcluded(spellName, this.moduleId)) {
        return { success: true };
      }

      // Perform target validation
      const validation = validateSpellTarget(spell, selectedActor);
      return validation;
    } catch (error) {
      console.error(`${this.moduleId} | Error in spell validation:`, error);
      return { success: true }; // Allow spell on error
    }
  }

  /**
   * Get actor and token from parameter or selection
   */
  // Simplified - straightforward token finding
  getActorAndToken(actor) {
    let selectedActor = actor;
    let selectedToken = null;

    if (!selectedActor) {
      // No actor provided - use selected token
      selectedToken = canvas.tokens.controlled[0];
      selectedActor = selectedToken?.actor;
    } else {
      // Actor provided - find its token (simple approach)
      selectedToken =
        selectedActor.getActiveTokens()[0] || canvas.tokens.controlled[0];
    }

    return { selectedActor, selectedToken };
  }

  /**
   * Get validation settings with override checking
   */
  getValidationSettings() {
    // Check for validation bypass
    if (window.DragonbaneActionRules?.overrides?.validationBypass) {
      return {
        enforceTarget: false,
        enforceRange: false,
      };
    }

    // Get base settings from module configuration
    const enforceTarget = getSetting(
      this.moduleId,
      SETTINGS.ENFORCE_TARGET_SELECTION,
      true
    );
    const enforceRange = getSetting(
      this.moduleId,
      SETTINGS.ENFORCE_RANGE_CHECKING,
      true
    );

    return {
      enforceTarget,
      enforceRange,
    };
  }

  /**
   * Validate target selection
   */
  validateTarget(weaponName) {
    if (game.user.targets.size === 0) {
      return {
        success: false,
        message: game.i18n.format(
          "DRAGONBANE_ACTION_RULES.validation.noTarget",
          { weapon: weaponName }
        ),
      };
    }

    if (game.user.targets.size > 1) {
      return {
        success: false,
        message: game.i18n.format(
          "DRAGONBANE_ACTION_RULES.validation.tooManyTargets",
          { weapon: weaponName }
        ),
      };
    }

    return { success: true };
  }

  /**
   * Validate weapon range with thrown weapon support
   */
  validateRange(attackerToken, targetToken, weapon, weaponName) {
    try {
      if (!attackerToken || !targetToken || !weapon) {
        return { success: true }; // Skip validation if missing data
      }

      // Calculate distance using standard Foundry method
      const distance = canvas.grid.measurePath([
        attackerToken,
        targetToken,
      ]).distance;

      // Use core Dragonbane system methods for weapon detection
      const isThrownWeapon =
        weapon.hasWeaponFeature && weapon.hasWeaponFeature("thrown");
      const isRangedWeapon = weapon.isRangedWeapon;
      const isLongWeapon =
        weapon.hasWeaponFeature && weapon.hasWeaponFeature("long");
      const isMeleeWeapon = !isThrownWeapon && !isRangedWeapon;

      let maxRange;
      let weaponType;

      if (isRangedWeapon) {
        // Ranged weapon - use calculated range
        maxRange = (weapon.system.calculatedRange || 0) * 2; // Allow 2x range
        weaponType = "ranged weapon";
      } else if (isThrownWeapon) {
        // Thrown weapon - contextual range (melee range or thrown range)
        const meleeMaxRange = isLongWeapon ? 4 : 2;

        if (distance <= meleeMaxRange) {
          // In melee range - use melee range rules
          maxRange = meleeMaxRange;
          weaponType = "thrown weapon (melee range)";
        } else {
          // Beyond melee range - use thrown range (2x calculated range)
          maxRange = (weapon.system.calculatedRange || 0) * 2;
          weaponType = "thrown weapon (thrown range)";
        }
      } else {
        // Melee weapon - use calculated range with appropriate fallback
        if (
          weapon.system.calculatedRange &&
          weapon.system.calculatedRange > 0
        ) {
          maxRange = weapon.system.calculatedRange;
        } else {
          // Fallback: long weapons can reach 4m, regular melee weapons 2m
          maxRange = isLongWeapon ? 4 : 2;
        }
        weaponType = "melee weapon";
      }

      DragonbaneUtils.debugLog(
        this.moduleId,
        "Validator",
        `Range check: ${weaponName} (${weaponType}) - Distance: ${distance}m, Max: ${maxRange}m`
      );

      if (distance > maxRange) {
        // Use existing localization keys based on weapon type
        if (
          isRangedWeapon ||
          (isThrownWeapon && distance > (isLongWeapon ? 4 : 2))
        ) {
          // Ranged or thrown weapon - use rangedOutOfRange
          return {
            success: false,
            message: game.i18n.format(
              "DRAGONBANE_ACTION_RULES.validation.rangedOutOfRange",
              {
                weapon: weaponName,
                maxRange: maxRange,
                distance: distance,
              }
            ),
          };
        } else {
          // Melee weapon - use meleeOutOfRange
          const maxRangeText =
            maxRange <= 2 ? "adjacent to" : `within ${maxRange}m of`;
          return {
            success: false,
            message: game.i18n.format(
              "DRAGONBANE_ACTION_RULES.validation.meleeOutOfRange",
              {
                weapon: weaponName,
                weaponType: weaponType,
                maxRange: maxRangeText,
                distance: distance,
              }
            ),
          };
        }
      }

      return { success: true };
    } catch (error) {
      console.error(`${this.moduleId} | Error in range validation:`, error);
      return { success: true }; // Allow attack on error
    }
  }
}

/**
 * Check if spell should be excluded from validation
 * (Reuse existing exclusion logic from Phase 1)
 */
function isSpellExcluded(spellName, moduleId) {
  const excludedSpells = DragonbaneUtils.getSetting(
    moduleId,
    "excludedSpells",
    ""
  )
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return excludedSpells.includes(spellName);
}

/**
 * Validate spell target selection with auto-targeting for personal spells
 */
function validateSpellTarget(spell, actor = null) {
  const rangeType = spell.system.rangeType;

  // Skip validation for template spells (use template placement)
  if (["cone", "sphere"].includes(rangeType)) {
    return { success: true };
  }

  // Auto-target the caster for personal spells
  if (rangeType === "personal") {
    if (!actor) {
      return {
        success: false,
        message: `No actor found to cast ${spell.name}`,
      };
    }

    // Find the caster's token
    const casterToken =
      canvas.tokens.controlled[0] || actor.getActiveTokens()[0];

    if (!casterToken) {
      return {
        success: false,
        message: `No token found for ${actor.name} to cast ${spell.name}`,
      };
    }

    // Auto-target the caster
    game.user.targets.clear();
    casterToken.setTarget(true, { user: game.user });

    console.log(
      `Combat Assistant v2.0: Auto-targeting ${actor.name} for personal spell: ${spell.name}`
    );
    return { success: true };
  }

  // For range/touch spells, require exactly 1 target (same as weapons)
  if (game.user.targets.size === 0) {
    return {
      success: false,
      message: `You must select a target to cast ${spell.name}`,
    };
  }

  if (game.user.targets.size > 1) {
    return {
      success: false,
      message: `You must select exactly one target to cast ${spell.name}`,
    };
  }

  // Perform range validation for range/touch spells
  const rangeValidation = validateSpellRange(spell, actor);
  if (!rangeValidation.success) {
    return rangeValidation;
  }

  return { success: true };
}

/**
 * Validate spell range - simpler than weapon range validation
 */
function validateSpellRange(spell, actor) {
  const rangeType = spell.system.rangeType;

  // Get caster and target tokens
  const casterToken =
    canvas.tokens.controlled[0] || actor?.getActiveTokens()[0];
  const targetToken = Array.from(game.user.targets)[0];

  if (!casterToken || !targetToken) {
    // Can't validate range without tokens, let it through
    return { success: true };
  }

  // Calculate distance using same method as weapons
  const distance = canvas.grid.measurePath([casterToken, targetToken]).distance;

  let maxRange;
  let errorMessage;

  if (rangeType === "touch") {
    // Touch spells require adjacency (like melee weapons)
    maxRange = 2; // 2 meters = adjacent
    errorMessage = `${
      spell.name
    } requires touch! You must be adjacent (within 2m). Distance: ${Math.round(
      distance
    )}m`;
  } else if (rangeType === "range") {
    // Range spells use their listed range (unlike weapons at 2x range)
    maxRange = spell.system.range || 0;
    errorMessage = `${
      spell.name
    } is out of range! Max: ${maxRange}m, Distance: ${Math.round(distance)}m`;
  } else {
    // Other range types skip validation (personal, cone, sphere)
    return { success: true };
  }

  if (distance > maxRange) {
    return {
      success: false,
      message: errorMessage,
    };
  }

  console.log(
    `Combat Assistant v2.0: Range check passed - ${
      spell.name
    } (${rangeType}) - Distance: ${Math.round(distance)}m, Max: ${maxRange}m`
  );
  return { success: true };
}
