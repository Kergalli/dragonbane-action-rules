/**
 * Dragonbane Combat Assistant - Attack Validation
 * Handles target selection and weapon range with thrown weapon support
 */

import { DragonbaneUtils } from './utils.js';

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
                    message: game.i18n.format("DRAGONBANE_ACTION_RULES.validation.selectToken", { weapon: weaponName })
                };
            }

            // Find weapon
            const weapon = selectedActor.items.find(i => i.name === weaponName && i.type === 'weapon');
            if (!weapon) {
                return {
                    success: false,
                    message: game.i18n.format("DRAGONBANE_ACTION_RULES.validation.noWeapon", { weapon: weaponName })
                };
            }

            // Get validation settings with override checking
            const settings = this.getValidationSettings();
            DragonbaneUtils.debugLog(this.moduleId, 'Validator', `Validation for ${weaponName} - Target: ${settings.enforceTarget}, Range: ${settings.enforceRange}`);

            // Perform validations
            if (settings.enforceTarget) {
                const targetValidation = this.validateTarget(weaponName);
                if (!targetValidation.success) return targetValidation;
            }

            if (settings.enforceRange && selectedToken && game.user.targets.size > 0) {
                const targetToken = Array.from(game.user.targets)[0];
                const rangeValidation = this.validateRange(selectedToken, targetToken, weapon, weaponName);
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
        // Get base settings from module configuration
        let enforceTarget = DragonbaneUtils.getSetting(this.moduleId, 'enforceTargetSelection', true);
        let enforceRange = DragonbaneUtils.getSetting(this.moduleId, 'enforceRangeChecking', true);
        
        // Check for keyboard shortcut overrides if the main class is available
        if (window.DragonbaneActionRules?.overrides) {
            const overrides = window.DragonbaneActionRules.overrides;
            enforceTarget = enforceTarget && !overrides.targetSelection && !overrides.allValidations;
            enforceRange = enforceRange && !overrides.rangeChecking && !overrides.allValidations;
        }
        
        return {
            enforceTarget,
            enforceRange
        };
    }

    /**
     * Validate target selection
     */
    validateTarget(weaponName) {
        const targets = Array.from(game.user.targets);

        if (targets.length === 0) {
            return {
                success: false,
                message: game.i18n.format("DRAGONBANE_ACTION_RULES.validation.noTarget", { weapon: weaponName })
            };
        }

        if (targets.length > 1) {
            return {
                success: false,
                message: game.i18n.format("DRAGONBANE_ACTION_RULES.validation.tooManyTargets", { weapon: weaponName })
            };
        }

        return { success: true };
    }

    /**
     * Validate attack range with thrown weapon support
     */
    validateRange(attackerToken, targetToken, weapon, weaponName) {
        try {
            const distance = this.calculateTokenDistance(attackerToken, targetToken);

            // Handle thrown weapons contextually based on distance
            if (DragonbaneUtils.hasThrownFeature(weapon)) {
                return this.validateThrownWeaponRange(distance, weapon, weaponName);
            }

            // Handle pure ranged weapons
            if (this.isRangedWeapon(weapon)) {
                return this.validateRangedWeaponRange(distance, weapon, weaponName);
            }

            // Handle pure melee weapons
            return this.validateMeleeWeaponRange(distance, weapon, weaponName);

        } catch (error) {
            console.error(`${this.moduleId} | Error validating range:`, error);
            return { success: true };
        }
    }

    /**
     * Validate thrown weapon range (contextual melee/ranged)
     */
    validateThrownWeaponRange(distance, weapon, weaponName) {
        // Determine melee range based on weapon length
        const meleeRange = DragonbaneUtils.hasLongProperty(weapon) ? 4 : 2; // 2m = standard melee, 4m = long melee

        // If within melee range, validate as melee weapon
        if (distance <= meleeRange) {
            DragonbaneUtils.debugLog(this.moduleId, 'Validator', `Thrown weapon ${weaponName} used in melee at ${distance}m`);
            return this.validateMeleeWeaponRange(distance, weapon, weaponName);
        }

        // If beyond melee range, validate as ranged weapon (thrown)
        DragonbaneUtils.debugLog(this.moduleId, 'Validator', `Thrown weapon ${weaponName} thrown at ${distance}m`);
        return this.validateRangedWeaponRange(distance, weapon, weaponName);
    }

    /**
     * Validate ranged weapon range
     */
    validateRangedWeaponRange(distance, weapon, weaponName) {
        const baseRange = weapon.system?.calculatedRange || 10;
        const maxRange = baseRange * 2;

        if (distance > maxRange) {
            return {
                success: false,
                message: game.i18n.format("DRAGONBANE_ACTION_RULES.validation.rangedOutOfRange", {
                    weapon: weaponName,
                    maxRange: maxRange,
                    distance: Math.round(distance)
                })
            };
        }

        return { success: true };
    }

    /**
     * Validate melee weapon range
     */
    validateMeleeWeaponRange(distance, weapon, weaponName) {
        const isLongWeapon = DragonbaneUtils.hasLongProperty(weapon);

        // Adjacent (0m) - all melee weapons can attack
        if (distance === 0) {
            return { success: true };
        }

        // Standard melee range (2m) - all melee weapons can attack
        if (distance <= 2) {
            return { success: true };
        }

        // Extended melee range (4m) - only long weapons can attack
        if (distance <= 4 && isLongWeapon) {
            return { success: true };
        }

        // Too far for melee attack
        const weaponType = isLongWeapon ? "longMelee" : "melee";
        const maxRange = isLongWeapon ?
            game.i18n.localize("DRAGONBANE_ACTION_RULES.range.upToFourMeters") :
            game.i18n.localize("DRAGONBANE_ACTION_RULES.range.upToTwoMeters");

        return {
            success: false,
            message: game.i18n.format("DRAGONBANE_ACTION_RULES.validation.meleeOutOfRange", {
                weapon: weaponName,
                weaponType: game.i18n.localize(`DRAGONBANE_ACTION_RULES.weaponTypes.${weaponType}`),
                maxRange: maxRange,
                distance: Math.round(distance)
            })
        };
    }

    /**
     * Calculate the minimum distance between two tokens accounting for their size
     */
    calculateTokenDistance(token1, token2) {
        try {
            const gridSize = canvas.grid.size;
            const gridDistance = canvas.grid.distance || 2;

            // Helper function to get token bounds
            const getTokenBounds = (token) => {
                const doc = token.document || token;
                const x = Math.round(doc.x / gridSize);
                const y = Math.round(doc.y / gridSize);
                const w = doc.width || 1;
                const h = doc.height || 1;
                return { left: x, right: x + w - 1, top: y, bottom: y + h - 1 };
            };

            const bounds1 = getTokenBounds(token1);
            const bounds2 = getTokenBounds(token2);

            // Calculate minimum distance between token boundaries
            const dx = Math.max(0, bounds2.left - bounds1.right, bounds1.left - bounds2.right);
            const dy = Math.max(0, bounds2.top - bounds1.bottom, bounds1.top - bounds2.bottom);

            // Use Chebyshev distance (8-directional movement) and convert to game distance
            const gridDistanceResult = Math.max(dx, dy);
            const gameDistance = gridDistanceResult <= 1 ? 0 : gridDistanceResult * gridDistance;

            return gameDistance;

        } catch (error) {
            console.error(`${this.moduleId} | Error calculating token distance:`, error);
            // Fallback to standard measurement
            return canvas.grid.measurePath ?
                canvas.grid.measurePath([token1, token2]).distance :
                canvas.grid.measureDistance(token1, token2, { gridSpaces: false });
        }
    }

    /**
     * Check if weapon is ranged
     */
    isRangedWeapon(weapon) {
        return weapon.isRangedWeapon || (weapon.system?.calculatedRange && weapon.system.calculatedRange >= 10);
    }
}
