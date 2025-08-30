/**
 * Dragonbane Combat Assistant - Attack Validation
 * Handles target selection and weapon range with thrown weapon support
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
   * Get actor and token from parameter or selection
   */
  getActorAndToken(actor) {
    let selectedActor = actor;
    let selectedToken = null;

    if (!selectedActor) {
      selectedToken = canvas.tokens.controlled[0];
      if (selectedToken) {
        selectedActor = selectedToken.actor;
      }
    } else {
      // Find the token for this actor for range calculations
      selectedToken = selectedActor.getActiveTokens()[0];
      if (!selectedToken) {
        selectedToken = canvas.tokens.controlled[0];
      }
    }

    return { selectedActor, selectedToken };
  }

  /**
   * Get validation settings with override checking
   */
  getValidationSettings() {
    // Get base settings from module configuration using new settings system
    let enforceTarget = getSetting(
      this.moduleId,
      SETTINGS.ENFORCE_TARGET_SELECTION,
      true
    );
    let enforceRange = getSetting(
      this.moduleId,
      SETTINGS.ENFORCE_RANGE_CHECKING,
      true
    );

    // Check for keyboard shortcut overrides if the main class is available
    if (window.DragonbaneActionRules?.overrides) {
      const overrides = window.DragonbaneActionRules.overrides;
      enforceTarget =
        enforceTarget &&
        !overrides.targetSelection &&
        !overrides.allValidations;
      enforceRange =
        enforceRange && !overrides.rangeChecking && !overrides.allValidations;
    }

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

      // Get weapon data
      const weaponData = weapon.system;
      if (!weaponData) {
        return { success: true }; // Skip if no weapon data
      }

      // Calculate distance using standard Foundry method
      const distance = canvas.grid.measurePath([
        attackerToken,
        targetToken,
      ]).distance;

      // Get weapon range based on type
      let maxRange;
      let weaponType;

      if (weaponData.ranged) {
        // Ranged weapon
        maxRange = parseInt(weaponData.range) || 0;
      } else if (weaponData.throwable && weaponData.thrownRange) {
        // Thrown weapon
        maxRange = parseInt(weaponData.thrownRange) || 0;
      } else {
        // Melee weapon - use short range
        maxRange = 1; // Short range in Dragonbane
        weaponType = "melee weapon";
      }

      DragonbaneUtils.debugLog(
        this.moduleId,
        "Validator",
        `Range check: ${weaponName} - Distance: ${distance}m, Max: ${maxRange}m`
      );

      if (distance > maxRange) {
        // Use existing localization keys based on weapon type
        if (
          weaponData.ranged ||
          (weaponData.throwable && weaponData.thrownRange)
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
            maxRange === 1 ? "adjacent to" : `within ${maxRange}m of`;
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
