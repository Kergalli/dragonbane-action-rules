/**
 * Dragonbane Combat Assistant - Attack Validation
 * Handles target selection and weapon range validation
 * 
 * Author: Matthias Weeks
 * Version: 1.0.0
 */

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

            // Get validation settings
            const settings = this.getValidationSettings();
            this.debugLog(`Validation settings - Target: ${settings.enforceTarget}, Range: ${settings.enforceRange}`);
            this.debugLog(`Current targets: ${game.user.targets.size}, Selected token: ${!!selectedToken}`);

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

            this.debugLog(`Validation passed for weapon: ${weaponName}`);
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
     * Get validation settings
     */
    getValidationSettings() {
        return {
            enforceTarget: this.getSetting('enforceTargetSelection', true),
            enforceRange: this.getSetting('enforceRangeChecking', true)
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
     * Validate attack range with localized text
     */
    validateRange(attackerToken, targetToken, weapon, weaponName) {
        try {
            const distance = this.calculateTokenDistance(attackerToken, targetToken);
            const isRanged = this.isRangedWeapon(weapon);
            
            if (isRanged) {
                return this.validateRangedWeaponRange(distance, weapon, weaponName);
            } else {
                return this.validateMeleeWeaponRange(distance, weapon, weaponName);
            }

        } catch (error) {
            console.error(`${this.moduleId} | Error validating range:`, error);
            return { success: true };
        }
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
        const isLongWeapon = this.hasLongProperty(weapon);
        
        // Adjacent - all melee weapons can attack
        if (distance === 0) {
            return { success: true };
        }
        
        // 1 square away (4m) - only long weapons can attack
        if (distance === 4 && isLongWeapon) {
            return { success: true };
        }
        
        // Too far for melee attack
        const weaponType = isLongWeapon ? "longMelee" : "melee";
        const maxRange = isLongWeapon ? 
            game.i18n.localize("DRAGONBANE_ACTION_RULES.range.adjacentOrOneSquare") : 
            game.i18n.localize("DRAGONBANE_ACTION_RULES.range.adjacentOnly");
        
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
            
            this.debugLog(`Distance calculation: ${gameDistance}m between ${token1.name} and ${token2.name}`);
            return gameDistance;
            
        } catch (error) {
            console.error(`${this.moduleId} | Error calculating token distance:`, error);
            // Fallback to standard measurement
            return canvas.grid.measurePath ? 
                canvas.grid.measurePath([token1, token2]).distance :
                canvas.grid.measureDistance(token1, token2, {gridSpaces: false});
        }
    }

    /**
     * Check if weapon is ranged
     */
    isRangedWeapon(weapon) {
        return weapon.isRangedWeapon || (weapon.system?.calculatedRange && weapon.system.calculatedRange >= 10);
    }

    /**
     * Check if weapon has the "Long" property
     */
    hasLongProperty(weapon) {
        if (weapon.system?.features && Array.isArray(weapon.system.features)) {
            return weapon.system.features.some(feature => feature.toLowerCase() === 'long');
        }
        if (typeof weapon.hasWeaponFeature === 'function') {
            return weapon.hasWeaponFeature('long');
        }
        return false;
    }

    /**
     * Get setting value with fallback
     */
    getSetting(settingName, fallback) {
        try {
            return game.settings.get(this.moduleId, settingName);
        } catch (error) {
            console.warn(`${this.moduleId} | Failed to get setting ${settingName}:`, error);
            return fallback;
        }
    }

    /**
     * Debug logging
     */
    debugLog(message) {
        if (this.getSetting('debugMode', false)) {
            console.log(`${this.moduleId} | Validator: ${message}`);
        }
    }
}