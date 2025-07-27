/**
 * Dragonbane Combat Assistant - Initial Release
 * Complete tactical enhancement for Dragonbane combat: Attack validation + automatic rule display
 * 
 * Author: Matthias Weeks
 * Version: 1.0.0 - Initial Release
 */

class DragonbaneActionRules {
    static ID = 'dragonbane-action-rules';
    static VERSION = '1.0.0';
    
    static SETTINGS = {
        ENABLED: 'enabled',
        DELAY: 'delay',
        SHOW_PARRY_DURABILITY: 'showParryDurability',
        ENFORCE_TARGET_SELECTION: 'enforceTargetSelection',
        ENFORCE_RANGE_CHECKING: 'enforceRangeChecking',
        DEBUG_MODE: 'debugMode'
    };

    static FLAGS = {
        RULES_MESSAGE: 'dragonbaneRulesMessage'
    };

    // Pre-compiled patterns for efficiency
    static UUID_PATTERN = /@UUID\[Actor\.[^\.]+\.Item\.([^\]]+)\]/;
    static ACTION_PATTERN = /(parry|topple|disarm|weakpoint|weak\s+spot)/i;

    // Consolidated hook storage
    static hooks = {
        chat: null,
        ready: null,
        sheet: null
    };
    
    static originalRollItem = null;
    static originalWeaponTestRoll = null;

    /**
     * Initialize the module
     */
    static initialize() {
        console.log(`${DragonbaneActionRules.ID} | ${game.i18n.localize("DRAGONBANE_ACTION_RULES.console.initializing")} v${DragonbaneActionRules.VERSION}`);
        
        if (game.system.id !== 'dragonbane') {
            console.warn(`${DragonbaneActionRules.ID} | ${game.i18n.localize("DRAGONBANE_ACTION_RULES.console.wrongSystem")}`);
            return;
        }

        DragonbaneActionRules.registerSettings();
        DragonbaneActionRules.registerHooks();
    }

    /**
     * Register module settings
     */
    static registerSettings() {
        game.settings.register(DragonbaneActionRules.ID, DragonbaneActionRules.SETTINGS.ENABLED, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enabled.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enabled.hint"),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true,
            onChange: (value) => value ? DragonbaneActionRules.enableModule() : DragonbaneActionRules.disableModule()
        });

        game.settings.register(DragonbaneActionRules.ID, DragonbaneActionRules.SETTINGS.DELAY, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.delay.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.delay.hint"),
            scope: 'world',
            config: true,
            type: Number,
            default: 3000,
            range: { min: 0, max: 10000, step: 500 }
        });

        game.settings.register(DragonbaneActionRules.ID, DragonbaneActionRules.SETTINGS.SHOW_PARRY_DURABILITY, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.showParryDurability.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.showParryDurability.hint"),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.register(DragonbaneActionRules.ID, DragonbaneActionRules.SETTINGS.ENFORCE_TARGET_SELECTION, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enforceTargetSelection.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enforceTargetSelection.hint"),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.register(DragonbaneActionRules.ID, DragonbaneActionRules.SETTINGS.ENFORCE_RANGE_CHECKING, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enforceRangeChecking.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enforceRangeChecking.hint"),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.register(DragonbaneActionRules.ID, DragonbaneActionRules.SETTINGS.DEBUG_MODE, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.debugMode.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.debugMode.hint"),
            scope: 'world',
            config: true,
            type: Boolean,
            default: false
        });
    }

    /**
     * Register Foundry hooks
     */
    static registerHooks() {
        Hooks.once('ready', () => {
            if (game.settings.get(DragonbaneActionRules.ID, DragonbaneActionRules.SETTINGS.ENABLED)) {
                DragonbaneActionRules.enableModule();
            }
        });

        // Add console commands
        Hooks.once('ready', () => {
            window.DragonbaneActionRules = {
                enable: () => DragonbaneActionRules.enableModule(),
                disable: () => DragonbaneActionRules.disableModule(),
                version: DragonbaneActionRules.VERSION,
                debug: () => {
                    console.log(game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.header"));
                    console.log(`${game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.moduleEnabled")}: ${!!DragonbaneActionRules.hooks.chat}`);
                    console.log(`${game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.controlledTokens")}: ${canvas.tokens.controlled.length}`);
                    console.log(`${game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.targetedTokens")}: ${game.user.targets.size}`);
                    console.log(game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.manualOverride"));
                    console.log(game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.rangeRules"));
                    console.log(game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.footer"));
                }
            };
        });
    }

    /**
     * Enable the module functionality
     */
    static enableModule() {
        if (DragonbaneActionRules.hooks.chat) return;

        // Hook for post-attack rules display
        DragonbaneActionRules.hooks.chat = Hooks.on('createChatMessage', DragonbaneActionRules.onChatMessage);
        
        // Hook for Token Action HUD attacks via game.dragonbane.rollItem
        DragonbaneActionRules.hookTokenActionHUD();
        
        // Hook character sheet attacks directly  
        DragonbaneActionRules.hookActorTestSkill();
        
        // Wait for system to be ready, then try global DoDWeaponTest hook
        DragonbaneActionRules.hooks.ready = Hooks.once('ready', () => {
            setTimeout(() => DragonbaneActionRules.hookWeaponTestGlobally(), 1000);
        });
        
        DragonbaneActionRules.debugLog(game.i18n.localize("DRAGONBANE_ACTION_RULES.console.moduleEnabled"));
    }

    /**
     * Hook character sheet methods directly
     */
    static hookActorTestSkill() {
        // Hook character sheets when they render
        DragonbaneActionRules.hooks.sheet = Hooks.on('renderActorSheet', (sheet, html, data) => {
            if (sheet.constructor.name === 'DoDCharacterSheet' && !sheet._dragonbaneHooked) {
                DragonbaneActionRules.debugLog(`Hooking character sheet for ${sheet.actor.name}`);
                
                // Mark as hooked to prevent duplicate hooks
                sheet._dragonbaneHooked = true;
                
                // Store original method
                const originalOnSkillRoll = sheet._onSkillRoll;
                
                // Override the _onSkillRoll method
                sheet._onSkillRoll = async function(event) {
                    event.preventDefault();
                    
                    const itemId = event.currentTarget.closest(".sheet-table-data").dataset.itemId;
                    const item = this.actor.items.get(itemId);
                    
                    DragonbaneActionRules.debugLog(`Character sheet _onSkillRoll: ${item?.name || 'unknown'}, type: ${item?.type || 'unknown'}, event: ${event.type}`);
                    
                    // Only validate weapon left-clicks (attacks)
                    if (item?.type === "weapon" && event.type === "click") {
                        DragonbaneActionRules.debugLog(`Validating weapon attack from character sheet: ${item.name}`);
                        
                        const validation = await DragonbaneActionRules.performWeaponAttack(item.name, this.actor);
                        if (!validation.success) {
                            ui.notifications.warn(validation.message);
                            DragonbaneActionRules.debugLog(`Character sheet weapon attack blocked: ${validation.message}`);
                            return; // Stop execution
                        }
                        
                        DragonbaneActionRules.debugLog(`Character sheet weapon attack validation passed: ${item.name}`);
                    }
                    
                    // Call the original method
                    return originalOnSkillRoll.call(this, event);
                };
                
                // Re-bind the event handlers to use our new method
                if (sheet.object.isOwner) {
                    html.find(".rollable-skill").off("click contextmenu").on("click contextmenu", sheet._onSkillRoll.bind(sheet));
                    DragonbaneActionRules.debugLog("Re-bound weapon skill event handlers");
                } else if (sheet.object.isObserver) {
                    html.find(".rollable-skill").off("contextmenu").on("contextmenu", sheet._onSkillRoll.bind(sheet));
                    DragonbaneActionRules.debugLog("Re-bound observer weapon skill event handlers");
                }
                
                DragonbaneActionRules.debugLog(`Successfully hooked character sheet _onSkillRoll for ${sheet.actor.name}`);
            }
        });
        
        DragonbaneActionRules.debugLog("Character sheet render hook registered");
    }

    /**
     * Try to hook DoDWeaponTest globally by searching for it (Optimized)
     */
    static hookWeaponTestGlobally() {
        try {
            const targets = [
                window.DoDWeaponTest,
                CONFIG.DoD?.DoDWeaponTest,
                game.system?.constructor?.DoDWeaponTest
            ].find(target => target?.prototype?.roll);
            
            if (targets) {
                DragonbaneActionRules.hookWeaponTestClass(targets);
                DragonbaneActionRules.debugLog("Found and hooked DoDWeaponTest class");
                return;
            }

            DragonbaneActionRules.debugLog("Could not locate DoDWeaponTest class for global hooking");

        } catch (error) {
            DragonbaneActionRules.debugLog(`Error in global weapon test hook: ${error.message}`);
        }
    }

    /**
     * Hook a specific weapon test class
     */
    static hookWeaponTestClass(WeaponTestClass) {
        if (!WeaponTestClass?.prototype?.roll) {
            DragonbaneActionRules.debugLog("WeaponTestClass has no roll method");
            return false;
        }

        DragonbaneActionRules.originalWeaponTestRoll = WeaponTestClass.prototype.roll;
        WeaponTestClass.prototype.roll = async function() {
            DragonbaneActionRules.debugLog(`DoDWeaponTest.roll() intercepted for weapon: ${this.weapon?.name}`);
            
            if (this.weapon && this.actor) {
                const validation = await DragonbaneActionRules.performWeaponAttack(this.weapon.name, this.actor);
                if (!validation.success) {
                    ui.notifications.warn(validation.message);
                    DragonbaneActionRules.debugLog(`DoDWeaponTest.roll() blocked: ${validation.message}`);
                    // Set cancelled flag and return
                    this.options = { ...this.options, cancelled: true };
                    return this;
                }
                DragonbaneActionRules.debugLog(`DoDWeaponTest.roll() validation passed for ${this.weapon.name}`);
            }
            
            return DragonbaneActionRules.originalWeaponTestRoll.call(this);
        };
        
        DragonbaneActionRules.debugLog("Successfully hooked WeaponTestClass.prototype.roll");
        return true;
    }

    /**
     * Hook Token Action HUD attacks
     */
    static hookTokenActionHUD() {
        if (game.dragonbane?.rollItem) {
            DragonbaneActionRules.originalRollItem = game.dragonbane.rollItem;
            game.dragonbane.rollItem = async function(itemName, ...args) {
                DragonbaneActionRules.debugLog(`Token Action HUD rollItem called: ${itemName}`);
                
                const selectedToken = canvas.tokens.controlled[0];
                if (selectedToken?.actor) {
                    const item = selectedToken.actor.items.find(i => i.name === itemName && i.type === 'weapon');
                    if (item) {
                        DragonbaneActionRules.debugLog(`Token Action HUD weapon found: ${item.name}`);
                        
                        const validation = await DragonbaneActionRules.performWeaponAttack(itemName, selectedToken.actor);
                        if (!validation.success) {
                            ui.notifications.warn(validation.message);
                            DragonbaneActionRules.debugLog(`Token Action HUD blocked: ${validation.message}`);
                            return null;
                        }
                        
                        DragonbaneActionRules.debugLog(`Token Action HUD validation passed for ${itemName}`);
                    }
                }
                return DragonbaneActionRules.originalRollItem.call(this, itemName, ...args);
            };
            DragonbaneActionRules.debugLog("Hooked Token Action HUD attacks");
        }
    }

    /**
     * Helper method to clean up a hook
     */
    static cleanupHook(hookName, hookId) {
        if (DragonbaneActionRules.hooks[hookName]) {
            Hooks.off(hookId, DragonbaneActionRules.hooks[hookName]);
            DragonbaneActionRules.hooks[hookName] = null;
            DragonbaneActionRules.debugLog(`Cleaned up ${hookName} hook`);
        }
    }

    /**
     * Helper method to restore original methods
     */
    static restoreOriginalMethods() {
        // Restore Token Action HUD hook
        if (DragonbaneActionRules.originalRollItem && game.dragonbane) {
            game.dragonbane.rollItem = DragonbaneActionRules.originalRollItem;
            DragonbaneActionRules.originalRollItem = null;
            DragonbaneActionRules.debugLog("Restored Token Action HUD original method");
        }
        
        // Restore global weapon test hook
        if (DragonbaneActionRules.originalWeaponTestRoll) {
            const targets = [
                window.DoDWeaponTest,
                CONFIG.DoD?.DoDWeaponTest,
                game.system?.constructor?.DoDWeaponTest
            ].find(target => target?.prototype?.roll);
            
            if (targets) {
                targets.prototype.roll = DragonbaneActionRules.originalWeaponTestRoll;
                DragonbaneActionRules.originalWeaponTestRoll = null;
                DragonbaneActionRules.debugLog("Restored original DoDWeaponTest.prototype.roll");
            }
        }
    }

    /**
     * Helper method to clean up character sheet hooks
     */
    static cleanupCharacterSheets() {
        if (DragonbaneActionRules.hooks.sheet) {
            Hooks.off('renderActorSheet', DragonbaneActionRules.hooks.sheet);
            DragonbaneActionRules.hooks.sheet = null;
            
            // Clean up existing hooked sheets
            Object.values(ui.windows)
                .filter(app => app.constructor.name === 'DoDCharacterSheet' && app._dragonbaneHooked)
                .forEach(app => delete app._dragonbaneHooked);
                
            DragonbaneActionRules.debugLog("Cleaned up character sheet hooks");
        }
    }

    /**
     * Disable the module functionality (Consolidated)
     */
    static disableModule() {
        // Clean up standard hooks
        DragonbaneActionRules.cleanupHook('chat', 'createChatMessage');
        DragonbaneActionRules.cleanupHook('ready', 'ready');
        
        // Clean up character sheet hooks
        DragonbaneActionRules.cleanupCharacterSheets();
        
        // Restore original methods
        DragonbaneActionRules.restoreOriginalMethods();
        
        DragonbaneActionRules.debugLog(game.i18n.localize("DRAGONBANE_ACTION_RULES.console.moduleDisabled"));
    }

    /**
     * Perform weapon attack validation
     */
    static async performWeaponAttack(weaponName, actor = null) {
        try {
            // Manual bypass with Shift key
            if (game.keyboard?.isModifierActive(KeyboardManager.MODIFIER_KEYS.SHIFT)) {
                ui.notifications.info(game.i18n.format("DRAGONBANE_ACTION_RULES.notifications.validationBypassed", { weapon: weaponName }));
                return { success: true };
            }

            // Get actor from parameter or selected token
            let selectedActor = actor;
            let selectedToken = null;
            
            if (!selectedActor) {
                selectedToken = canvas.tokens.controlled[0];
                if (!selectedToken) {
                    return { success: false, message: game.i18n.format("DRAGONBANE_ACTION_RULES.validation.selectToken", { weapon: weaponName }) };
                }
                selectedActor = selectedToken.actor;
            } else {
                // Find the token for this actor for range calculations
                selectedToken = selectedActor.getActiveTokens()[0];
                if (!selectedToken) {
                    selectedToken = canvas.tokens.controlled[0];
                }
            }

            // Find weapon
            const weapon = selectedActor.items.find(i => i.name === weaponName && i.type === 'weapon');
            if (!weapon) {
                return { success: false, message: game.i18n.format("DRAGONBANE_ACTION_RULES.validation.noWeapon", { weapon: weaponName }) };
            }

            const enforceTarget = game.settings.get(DragonbaneActionRules.ID, DragonbaneActionRules.SETTINGS.ENFORCE_TARGET_SELECTION);
            const enforceRange = game.settings.get(DragonbaneActionRules.ID, DragonbaneActionRules.SETTINGS.ENFORCE_RANGE_CHECKING);

            DragonbaneActionRules.debugLog(`Validation settings - Target: ${enforceTarget}, Range: ${enforceRange}`);
            DragonbaneActionRules.debugLog(`Current targets: ${game.user.targets.size}, Selected token: ${!!selectedToken}`);

            // Target validation
            if (enforceTarget) {
                const targetValidation = DragonbaneActionRules.validateTarget(weaponName);
                if (!targetValidation.success) return targetValidation;
            }

            // Range validation (only if we have a token and targets)
            if (enforceRange && selectedToken && game.user.targets.size > 0) {
                const targetToken = Array.from(game.user.targets)[0];
                const rangeValidation = DragonbaneActionRules.validateRange(selectedToken, targetToken, weapon, weaponName);
                if (!rangeValidation.success) return rangeValidation;
            }

            DragonbaneActionRules.debugLog(`Validation passed for weapon: ${weaponName}`);
            return { success: true };

        } catch (error) {
            console.error(`${DragonbaneActionRules.ID} | Error in weapon validation:`, error);
            return { success: true }; // Allow attack on error
        }
    }

    /**
     * Validate target selection
     */
    static validateTarget(weaponName) {
        const targets = Array.from(game.user.targets);
        if (targets.length === 0) {
            return { success: false, message: game.i18n.format("DRAGONBANE_ACTION_RULES.validation.noTarget", { weapon: weaponName }) };
        }
        if (targets.length > 1) {
            return { success: false, message: game.i18n.format("DRAGONBANE_ACTION_RULES.validation.tooManyTargets", { weapon: weaponName }) };
        }
        return { success: true };
    }

    /**
     * Calculate the minimum distance between two tokens accounting for their size (Optimized)
     */
    static calculateTokenDistance(token1, token2) {
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
            
            DragonbaneActionRules.debugLog(`Distance calculation: ${gameDistance}m between ${token1.name} and ${token2.name}`);
            return gameDistance;
            
        } catch (error) {
            console.error(`${DragonbaneActionRules.ID} | Error calculating token distance:`, error);
            // Fallback to standard measurement
            return canvas.grid.measurePath ? 
                canvas.grid.measurePath([token1, token2]).distance :
                canvas.grid.measureDistance(token1, token2, {gridSpaces: false});
        }
    }

    /**
     * Validate attack range with localized text
     */
    static validateRange(attackerToken, targetToken, weapon, weaponName) {
        try {
            const distance = DragonbaneActionRules.calculateTokenDistance(attackerToken, targetToken);
            const isRanged = DragonbaneActionRules.isRangedWeapon(weapon);
            
            if (isRanged) {
                const baseRange = weapon.system?.calculatedRange || 10;
                const maxRange = baseRange * 2;
                
                if (distance > maxRange) {
                    return {
                        success: false,
                        message: game.i18n.format("DRAGONBANE_ACTION_RULES.validation.rangedOutOfRange", {
                            weapon: weaponName,
                            maxRange: maxRange,
                            baseRange: baseRange,
                            distance: Math.round(distance)
                        })
                    };
                }
            } else {
                // Melee weapon range check - requires adjacency
                const isLongWeapon = DragonbaneActionRules.hasLongProperty(weapon);
                
                if (distance === 0) {
                    // Adjacent - all melee weapons can attack
                    return { success: true };
                } else if (distance === 4 && isLongWeapon) {
                    // 1 square away (4m) - only long weapons can attack
                    return { success: true };
                } else {
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
            }

            return { success: true };

        } catch (error) {
            console.error(`${DragonbaneActionRules.ID} | Error validating range:`, error);
            return { success: true };
        }
    }

    /**
     * Check if weapon is ranged
     */
    static isRangedWeapon(weapon) {
        return weapon.isRangedWeapon || (weapon.system?.calculatedRange && weapon.system.calculatedRange >= 10);
    }

    /**
     * Check if weapon has the "Long" property
     */
    static hasLongProperty(weapon) {
        if (weapon.system?.features && Array.isArray(weapon.system.features)) {
            return weapon.system.features.some(feature => feature.toLowerCase() === 'long');
        }
        if (typeof weapon.hasWeaponFeature === 'function') {
            return weapon.hasWeaponFeature('long');
        }
        return false;
    }

    /**
     * Handle successful action detection and rule display
     */
    static onChatMessage(message) {
        try {
            if (message.getFlag(DragonbaneActionRules.ID, DragonbaneActionRules.FLAGS.RULES_MESSAGE)) return;

            const content = message.content;
            if (!content) return;

            const actionMatch = content.match(DragonbaneActionRules.ACTION_PATTERN);
            if (!actionMatch) return;

            // Only show rules for successful attacks
            const successMatch = content.match(/(succeeded|succeded|dragon)/i);
            const failureMatch = content.match(/failed/i);
            if (!successMatch || failureMatch) return;

            // Prevent duplicate rules when multiple users are online
            if (!DragonbaneActionRules.shouldCreateRules(message)) return;

            DragonbaneActionRules.processAction(message, actionMatch);

        } catch (error) {
            console.error(`${DragonbaneActionRules.ID} | Error processing chat message:`, error);
        }
    }

    /**
     * Determine if this client should create the rules message to prevent duplicates
     */
    static shouldCreateRules(message) {
        // If there's a GM online, only let the GM create rules
        const activeGM = game.users.find(user => user.active && user.isGM);
        if (activeGM) {
            return game.user.isGM;
        }

        // If no GM is online, let the message author create rules
        const messageAuthor = game.users.get(message.user);
        if (messageAuthor && messageAuthor.active) {
            return game.user.id === message.user;
        }

        // Fallback: let the first active user (by ID) create rules
        const firstActiveUser = game.users.find(user => user.active);
        return firstActiveUser && game.user.id === firstActiveUser.id;
    }

    /**
     * Process detected action and display rules
     */
    static async processAction(message, actionMatch) {
        const action = actionMatch[1].toLowerCase();
        const normalizedAction = action.includes('weak') ? 'weakspot' : action;
        let ruleContent;

        if (normalizedAction === 'parry') {
            const weapon = DragonbaneActionRules.extractWeaponFromMessage(message);
            ruleContent = DragonbaneActionRules.getParryRules(weapon);
        } else {
            ruleContent = DragonbaneActionRules.getActionRules(normalizedAction);
        }

        if (ruleContent) {
            await DragonbaneActionRules.displayRules(normalizedAction, ruleContent);
        }
    }

    /**
     * Extract weapon information from chat message
     */
    static extractWeaponFromMessage(message) {
        try {
            const uuidMatch = message.content.match(DragonbaneActionRules.UUID_PATTERN);
            if (uuidMatch && message.speaker?.actor) {
                const actor = game.actors.get(message.speaker.actor);
                const weapon = actor?.items.get(uuidMatch[1]);
                if (weapon && weapon.type === 'weapon') return weapon;
            }

            // Fallback: equipped weapons
            if (message.speaker?.actor) {
                const actor = game.actors.get(message.speaker.actor);
                const equippedWeapons = actor?.items.filter(i => 
                    i.type === "weapon" && (i.system?.worn === true || i.system?.mainHand === true)
                );
                if (equippedWeapons?.length === 1) return equippedWeapons[0];
            }

            return null;
        } catch (error) {
            console.error(`${DragonbaneActionRules.ID} | Error extracting weapon:`, error);
            return null;
        }
    }

    /**
     * Get parry rules with weapon durability
     */
    static getParryRules(weapon) {
        const showDurability = game.settings.get(DragonbaneActionRules.ID, DragonbaneActionRules.SETTINGS.SHOW_PARRY_DURABILITY);
        let content = "";
        
        if (showDurability && weapon) {
            const durability = weapon.system?.durability || 0;
            const weaponName = weapon.name || game.i18n.localize("DRAGONBANE_ACTION_RULES.unknownWeapon");
            content += `<li><strong>${weaponName} ${game.i18n.localize("DRAGONBANE_ACTION_RULES.durability")}:</strong> ${durability}</li>`;
        } else if (showDurability && !weapon) {
            content += `<li class="weapon-warning">${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.noWeaponFound")}</li>`;
        }
        
        content += `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.reaction")}</li>
                   <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.success")}</li>
                   <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.piercing")}</li>
                   <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.parry.monster")}</li>`;
        
        return content;
    }

    /**
     * Get rules for non-parry actions
     */
    static getActionRules(action) {
        const rules = {
            topple: () => `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.topple.noDamage")}</li>
                          <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.topple.evadeRoll")}</li>
                          <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.topple.cannotDefend")}</li>
                          <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.topple.success")}</li>`,
            
            disarm: () => `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.noDamage")}</li>
                          <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.skillRoll")}</li>
                          <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.cannotDefend")}</li>
                          <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.twoHanded")}</li>
                          <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.success")}</li>
                          <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.disarm.limitations")}</li>`,
            
            weakspot: () => `<li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.weakspot.piercing")}</li>
                             <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.weakspot.bane")}</li>
                             <li>${game.i18n.localize("DRAGONBANE_ACTION_RULES.weakspot.success")}</li>`
        };

        return rules[action] ? rules[action]() : null;
    }

    /**
     * Display rules in chat
     */
    static async displayRules(action, content) {
        const delay = game.settings.get(DragonbaneActionRules.ID, DragonbaneActionRules.SETTINGS.DELAY);
        
        const actionName = game.i18n.localize(`DRAGONBANE_ACTION_RULES.actions.${action}`);
        const speakerName = game.i18n.format("DRAGONBANE_ACTION_RULES.speakers.generic", { action: actionName });

        setTimeout(async () => {
            try {
                await ChatMessage.create({
                    content: `<div class="dragonbane-action-rules"><ul>${content}</ul></div>`,
                    speaker: { alias: speakerName },
                    flags: { [DragonbaneActionRules.ID]: { [DragonbaneActionRules.FLAGS.RULES_MESSAGE]: true } }
                });
            } catch (error) {
                console.error(`${DragonbaneActionRules.ID} | Error creating chat message:`, error);
            }
        }, delay);
    }

    /**
     * Debug logging
     */
    static debugLog(message) {
        if (game.settings.get(DragonbaneActionRules.ID, DragonbaneActionRules.SETTINGS.DEBUG_MODE)) {
            console.log(`${DragonbaneActionRules.ID} | ${message}`);
        }
    }
}

// Initialize when Foundry is ready
Hooks.once('init', DragonbaneActionRules.initialize);