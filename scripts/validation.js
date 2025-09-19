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
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Error in weapon validation: ${error.message}`);
      }
      return { success: true };
    }
  }

  /**
   * Perform spell cast validation
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
          message: game.i18n.format(
            "DRAGONBANE_ACTION_RULES.validation.spellSelectToken",
            { spell: spellName }
          ),
        };
      }

      // Find spell
      const spell = selectedActor.items.find(
        (i) => i.name === spellName && i.type === "spell"
      );
      if (!spell) {
        return {
          success: false,
          message: game.i18n.format(
            "DRAGONBANE_ACTION_RULES.validation.spellNotFound",
            { spell: spellName }
          ),
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
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Error in spell validation: ${error.message}`);
      }
      return { success: true };
    }
  }

  /**
   * Get actor and token from parameter or selection
   */
  getActorAndToken(actor) {
    let selectedActor = actor;
    let selectedToken = null;

    if (!selectedActor) {
      // No actor provided - use selected token
      selectedToken = canvas.tokens.controlled[0];
      selectedActor = selectedToken?.actor;
    } else {
      // Actor provided - find its token
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

      // Calculate distance using custom function
      const distance = computeTokenDistance(attackerToken, targetToken);

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
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Error in range validation: ${error.message}`);
      }
      return { success: true }; // Allow attack on error
    }
  }
}

/**
 * Check if spell should be excluded from validation
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

  // Auto-target caster for template and personal spells
  if (["cone", "sphere", "personal"].includes(rangeType)) {
    // Skip self-target validation if no actor
    if (!actor) {
      return {
        success: false,
        message: game.i18n.format(
          "DRAGONBANE_ACTION_RULES.validation.spellNoActor",
          { spell: spell.name }
        ),
      };
    }

    // Find the caster's token
    const casterToken =
      canvas.tokens.controlled[0] || actor.getActiveTokens()[0];

    if (!casterToken) {
      return {
        success: false,
        message: game.i18n.format(
          "DRAGONBANE_ACTION_RULES.validation.spellNoToken",
          { actor: actor.name, spell: spell.name }
        ),
      };
    }

    // Auto-target the caster - v12/v13 compatibility
    try {
      // Clear all existing targets with UI update
      if (game.user.targets.size > 0) {
        const currentTargets = Array.from(game.user.targets);
        currentTargets.forEach((t) => {
          if (t.setTarget) {
            t.setTarget(false, { user: game.user });
          }
        });
        game.user.targets.clear();
      }

      // Now set the new target
      if (casterToken.object) {
        // v13: tokens have an 'object' property
        casterToken.object.setTarget(true, {
          user: game.user,
          releaseOthers: true,
        });
      } else if (casterToken.setTarget) {
        // v12: tokens have setTarget directly
        casterToken.setTarget(true, { user: game.user, releaseOthers: true });
      } else if (game.user.updateTokenTargets) {
        // Older v12 method as fallback
        game.user.updateTokenTargets([casterToken.id]);
      }

      DragonbaneUtils.debugLog(
        this.moduleId,
        "Validation",
        `Auto-targeted ${actor.name} for ${rangeType} spell: ${spell.name}`
      );
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Auto-targeting failed for ${spell.name}, proceeding anyway: ${error.message}`
        );
      }
    }

    return { success: true };
  }

  // For range/touch spells, require exactly 1 target (same as weapons)
  if (game.user.targets.size === 0) {
    return {
      success: false,
      message: game.i18n.format(
        "DRAGONBANE_ACTION_RULES.validation.spellNoTarget",
        { spell: spell.name }
      ),
    };
  }

  if (game.user.targets.size > 1) {
    return {
      success: false,
      message: game.i18n.format(
        "DRAGONBANE_ACTION_RULES.validation.spellTooManyTargets",
        { spell: spell.name }
      ),
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
 * Validate spell range
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

  if (rangeType === "range" && targetToken.id === casterToken.id) {
    // Only block self-targeting for ranged spells that deal damage
    const spellDamage = spell.system.damage;
    if (
      spellDamage &&
      spellDamage.trim() !== "" &&
      spellDamage.trim().toLowerCase() !== "n/a"
    ) {
      return {
        success: false,
        message: game.i18n.format(
          "DRAGONBANE_ACTION_RULES.validation.spellCannotTargetSelf",
          { spell: spell.name }
        ),
      };
    }
  }

  // Calculate distance using same method as weapons
  const distance = computeTokenDistance(casterToken, targetToken);

  let maxRange;
  let errorMessage;

  if (rangeType === "touch") {
    // Touch spells require adjacency
    maxRange = 2; // 2 meters = adjacent
    errorMessage = game.i18n.format(
      "DRAGONBANE_ACTION_RULES.validation.spellTouchRange",
      { spell: spell.name, distance: Math.round(distance) }
    );
  } else if (rangeType === "range") {
    // Range spells use their listed range (unlike weapons at 2x range)
    maxRange = spell.system.range || 0;
    errorMessage = game.i18n.format(
      "DRAGONBANE_ACTION_RULES.validation.spellOutOfRange",
      { spell: spell.name, maxRange: maxRange, distance: Math.round(distance) }
    );
  } else {
    // Other range types skip validation (cone, sphere)
    return { success: true };
  }

  if (distance > maxRange) {
    return {
      success: false,
      message: errorMessage,
    };
  }

  return { success: true };
}

/**
 * Computes the shortest distance in grid units required for one token to enter the bounding box of another, taking token size into consideration.
 * Returns zero if tokens already overlap partially or completely.
 * In game terms this can represent attack distance, where attack is a "step" into the nearest grid cell of the target token.
 * Works only for square grids.
 *
 * @param {foundry.canvas.placeables.Token} token1 - First token {x, y, w, h}
 * @param {foundry.canvas.placeables.Token} token2 - Second token {x, y, w, h}
 * @returns {number} Distance in grid units
 */
function computeTokenDistance(token1, token2) {
  const r1 = { left: token1.x, right: token1.x + token1.w, top: token1.y, bottom: token1.y + token1.h };
  const r2 = { left: token2.x, right: token2.x + token2.w, top: token2.y, bottom: token2.y + token2.h };
  
  // Return zero distance for full or partial overlap
  const horizontalOverlap = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
  const verticalOverlap   = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
  if (horizontalOverlap > 0 && verticalOverlap > 0) {
    return 0;
  }
  
  // Calculate horizontal and vertical distance
  const dx = r1.right < r2.left ? r2.left - r1.right : r1.left - r2.right;
  const dy = r1.bottom < r2.top ? r2.top - r1.bottom : r1.top - r2.bottom;
  
  // Chebyshev (chess board) distance plus one.
  // Plus one represents the extra step to enter the token space.
  return (Math.max(dx, dy) / canvas.grid.size + 1) * canvas.grid.distance;
}
