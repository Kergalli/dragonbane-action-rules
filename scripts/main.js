/**
 * Dragonbane Combat Assistant - Main Module
 * Core initialization and module management
 */

import { DragonbaneSettings } from './settings.js';
import { DragonbaneHooks } from './hooks.js';
import { DragonbaneValidator } from './validation.js';
import { DragonbaneRulesDisplay } from './rules-display.js';
import { DragonbaneEncumbranceMonitor } from './encumbrance-monitor.js';
import { DragonbaneYZEIntegration } from './yze-integration.js';
import { DragonbanePatternManager } from './pattern-manager.js';
import { DragonbaneUtils } from './utils.js';

class DragonbaneActionRules {
    static ID = 'dragonbane-action-rules';
    static VERSION = '1.3.8';
    
    static FLAGS = {
        RULES_MESSAGE: 'dragonbaneRulesMessage'
    };

    // Module components
    static settings = null;
    static hooks = null;
    static validator = null;
    static rulesDisplay = null;
    static encumbranceMonitor = null;
    static yzeIntegration = null;
    static patternManager = null;
    static utils = DragonbaneUtils; // Make utils available

    // Override state for keyboard shortcuts
    static overrides = {
        targetSelection: false,
        rangeChecking: false,
        yzeActionTracking: false,
        allValidations: false
    };

    /**
     * Initialize the module
     */
    static initialize() {
        try {
            if (game.system.id !== 'dragonbane') {
                console.warn(`${DragonbaneActionRules.ID} | ${game.i18n.localize("DRAGONBANE_ACTION_RULES.console.wrongSystem")}`);
                return;
            }

            // Initialize core components first
            DragonbaneActionRules.settings = new DragonbaneSettings(DragonbaneActionRules.ID);
            DragonbaneActionRules.patternManager = new DragonbanePatternManager(DragonbaneActionRules.ID);
            
            // Initialize other components with pattern manager dependency
            DragonbaneActionRules.hooks = new DragonbaneHooks(DragonbaneActionRules.ID);
            DragonbaneActionRules.validator = new DragonbaneValidator(DragonbaneActionRules.ID);
            DragonbaneActionRules.rulesDisplay = new DragonbaneRulesDisplay(DragonbaneActionRules.ID, DragonbaneActionRules.patternManager);
            DragonbaneActionRules.encumbranceMonitor = new DragonbaneEncumbranceMonitor(DragonbaneActionRules.ID);
            DragonbaneActionRules.yzeIntegration = new DragonbaneYZEIntegration(DragonbaneActionRules.ID, DragonbaneActionRules.patternManager);

            // Register settings and hooks
            DragonbaneActionRules.settings.register();
            DragonbaneActionRules.registerMainHooks();
            DragonbaneActionRules.registerKeybinds();

            // Conditional initialization logging
            setTimeout(() => {
                if (DragonbaneActionRules.settings?.isDebugMode()) {
                    console.log(`${DragonbaneActionRules.ID} | ${game.i18n.localize("DRAGONBANE_ACTION_RULES.console.initializing")} v${DragonbaneActionRules.VERSION}`);
                }
            }, 100); // Small delay to ensure settings are registered

        } catch (error) {
            console.error(`${DragonbaneActionRules.ID} | Critical initialization error:`, error);
            ui.notifications.error("Dragonbane Combat Assistant failed to initialize. Check console for details.");
            
            // Set components to null to prevent further errors
            DragonbaneActionRules.hooks = null;
            DragonbaneActionRules.settings = null;
            DragonbaneActionRules.validator = null;
            DragonbaneActionRules.rulesDisplay = null;
            DragonbaneActionRules.encumbranceMonitor = null;
            DragonbaneActionRules.yzeIntegration = null;
            DragonbaneActionRules.patternManager = null;
        }
    }

    /**
     * Register main module hooks
     */
    static registerMainHooks() {
        try {
            Hooks.once('ready', () => {
                try {
                    if (DragonbaneActionRules.settings?.isEnabled()) {
                        DragonbaneActionRules.enableModule();
                    }
                    
                    // Initialize encumbrance monitoring if enabled
                    if (DragonbaneActionRules.settings?.isEncumbranceMonitoringEnabled()) {
                        DragonbaneActionRules.encumbranceMonitor?.initialize();
                    }

                    // Initialize YZE integration if enabled
                    if (DragonbaneActionRules.settings?.isYZEIntegrationEnabled()) {
                        DragonbaneActionRules.yzeIntegration?.initialize();
                    }
                } catch (error) {
                    console.error(`${DragonbaneActionRules.ID} | Error in ready hook:`, error);
                    ui.notifications.warn("Some Dragonbane Combat Assistant features may not be working");
                }
            });
        } catch (error) {
            console.error(`${DragonbaneActionRules.ID} | Failed to register main hooks:`, error);
        }
    }

    /**
     * Register keyboard shortcuts for validation overrides
     */
    static registerKeybinds() {
        try {
            // Toggle Target Selection Override
            game.keybindings.register(DragonbaneActionRules.ID, "toggleTargetOverride", {
                name: "Toggle Target Selection Override",
                hint: "Temporarily disable/enable target selection enforcement",
                editable: [{ key: "KeyT", modifiers: ["Alt"] }],
                onDown: () => DragonbaneActionRules.toggleTargetOverride()
            });

            // Toggle Range Checking Override
            game.keybindings.register(DragonbaneActionRules.ID, "toggleRangeOverride", {
                name: "Toggle Range Checking Override",
                hint: "Temporarily disable/enable weapon range validation",
                editable: [{ key: "KeyR", modifiers: ["Alt"] }],
                onDown: () => DragonbaneActionRules.toggleRangeOverride()
            });

            // Toggle YZE Action Tracking Override
            game.keybindings.register(DragonbaneActionRules.ID, "toggleYZEOverride", {
                name: "Toggle YZE Action Tracking Override",
                hint: "Temporarily disable/enable YZE action tracking",
                editable: [{ key: "KeyY", modifiers: ["Alt"] }],
                onDown: () => DragonbaneActionRules.toggleYZEOverride()
            });

            // Show Override Status
            game.keybindings.register(DragonbaneActionRules.ID, "showOverrideStatus", {
                name: "Show Override Status",
                hint: "Display current override status via notification",
                editable: [{ key: "KeyS", modifiers: ["Alt"] }],
                onDown: () => DragonbaneActionRules.showOverrideStatus()
            });

            // Toggle All Validations Override
            game.keybindings.register(DragonbaneActionRules.ID, "toggleAllOverrides", {
                name: "Toggle All Overrides",
                hint: "Temporarily disable/enable all validation and tracking",
                editable: [{ key: "KeyA", modifiers: ["Alt"] }],
                onDown: () => DragonbaneActionRules.toggleAllOverrides()
            });

            // Reset All Overrides
            game.keybindings.register(DragonbaneActionRules.ID, "resetAllOverrides", {
                name: "Reset All Overrides",
                hint: "Clear all temporary overrides",
                editable: [{ key: "KeyX", modifiers: ["Alt"] }],
                onDown: () => DragonbaneActionRules.resetOverrides()
            });
        } catch (error) {
            console.error(`${DragonbaneActionRules.ID} | Failed to register keybinds:`, error);
        }
    }

    /**
     * Enable the module functionality
     */
    static enableModule() {
        try {
            if (!DragonbaneActionRules.hooks) {
                console.error(`${DragonbaneActionRules.ID} | Cannot enable module - hooks not initialized`);
                return;
            }

            if (DragonbaneActionRules.hooks.isEnabled()) return;

            // Enable all hook systems with callbacks and pass rulesDisplay instance
            DragonbaneActionRules.hooks.enableAll({
                onChatMessage: DragonbaneActionRules.rulesDisplay?.onChatMessage?.bind(DragonbaneActionRules.rulesDisplay),
                performWeaponAttack: DragonbaneActionRules.validator?.performWeaponAttack?.bind(DragonbaneActionRules.validator),
                // Encumbrance callbacks
                onActorUpdate: DragonbaneActionRules.encumbranceMonitor?.onActorUpdate?.bind(DragonbaneActionRules.encumbranceMonitor),
                onItemUpdate: DragonbaneActionRules.encumbranceMonitor?.onItemUpdate?.bind(DragonbaneActionRules.encumbranceMonitor),
                onItemChange: DragonbaneActionRules.encumbranceMonitor?.onItemChange?.bind(DragonbaneActionRules.encumbranceMonitor),
                // YZE integration callback (post-roll via chat detection)
                onChatMessageAction: DragonbaneActionRules.yzeIntegration?.onChatMessageAction?.bind(DragonbaneActionRules.yzeIntegration)
            }, DragonbaneActionRules.rulesDisplay); // Pass the rulesDisplay instance
            
            DragonbaneUtils.debugLog(DragonbaneActionRules.ID, 'Main', game.i18n.localize("DRAGONBANE_ACTION_RULES.console.moduleEnabled"));
        } catch (error) {
            console.error(`${DragonbaneActionRules.ID} | Failed to enable module:`, error);
            ui.notifications.error("Failed to enable Dragonbane Combat Assistant");
        }
    }

    /**
     * Disable the module functionality
     */
    static disableModule() {
        try {
            if (DragonbaneActionRules.hooks) {
                DragonbaneActionRules.hooks.disableAll();
            }
            DragonbaneUtils.debugLog(DragonbaneActionRules.ID, 'Main', game.i18n.localize("DRAGONBANE_ACTION_RULES.console.moduleDisabled"));
        } catch (error) {
            console.error(`${DragonbaneActionRules.ID} | Error disabling module:`, error);
        }
    }

    /**
     * Toggle target selection override
     */
    static toggleTargetOverride() {
        try {
            DragonbaneActionRules.overrides.targetSelection = !DragonbaneActionRules.overrides.targetSelection;
            const messageKey = DragonbaneActionRules.overrides.targetSelection ? 
                'DRAGONBANE_ACTION_RULES.overrides.targetEnforcementDisabled' : 
                'DRAGONBANE_ACTION_RULES.overrides.targetEnforcementEnabled';
            ui.notifications.info(game.i18n.localize(messageKey), { permanent: false });
            DragonbaneUtils.debugLog(DragonbaneActionRules.ID, 'Main', `Target selection override: ${DragonbaneActionRules.overrides.targetSelection}`);
        } catch (error) {
            console.error(`${DragonbaneActionRules.ID} | Error toggling target override:`, error);
        }
    }

    /**
     * Toggle range checking override
     */
    static toggleRangeOverride() {
        try {
            DragonbaneActionRules.overrides.rangeChecking = !DragonbaneActionRules.overrides.rangeChecking;
            const messageKey = DragonbaneActionRules.overrides.rangeChecking ? 
                'DRAGONBANE_ACTION_RULES.overrides.rangeCheckingDisabled' : 
                'DRAGONBANE_ACTION_RULES.overrides.rangeCheckingEnabled';
            ui.notifications.info(game.i18n.localize(messageKey), { permanent: false });
            DragonbaneUtils.debugLog(DragonbaneActionRules.ID, 'Main', `Range checking override: ${DragonbaneActionRules.overrides.rangeChecking}`);
        } catch (error) {
            console.error(`${DragonbaneActionRules.ID} | Error toggling range override:`, error);
        }
    }

    /**
     * Toggle YZE action tracking override
     */
    static toggleYZEOverride() {
        try {
            DragonbaneActionRules.overrides.yzeActionTracking = !DragonbaneActionRules.overrides.yzeActionTracking;
            const messageKey = DragonbaneActionRules.overrides.yzeActionTracking ? 
                'DRAGONBANE_ACTION_RULES.overrides.yzeActionTrackingDisabled' : 
                'DRAGONBANE_ACTION_RULES.overrides.yzeActionTrackingEnabled';
            ui.notifications.info(game.i18n.localize(messageKey), { permanent: false });
            DragonbaneUtils.debugLog(DragonbaneActionRules.ID, 'Main', `YZE action tracking override: ${DragonbaneActionRules.overrides.yzeActionTracking}`);
        } catch (error) {
            console.error(`${DragonbaneActionRules.ID} | Error toggling YZE override:`, error);
        }
    }

    /**
     * Toggle all validation overrides
     */
    static toggleAllOverrides() {
        try {
            DragonbaneActionRules.overrides.allValidations = !DragonbaneActionRules.overrides.allValidations;
            const messageKey = DragonbaneActionRules.overrides.allValidations ? 
                'DRAGONBANE_ACTION_RULES.overrides.allValidationDisabled' : 
                'DRAGONBANE_ACTION_RULES.overrides.allValidationEnabled';
            ui.notifications.warn(game.i18n.localize(messageKey), { permanent: false });
            DragonbaneUtils.debugLog(DragonbaneActionRules.ID, 'Main', `All validations override: ${DragonbaneActionRules.overrides.allValidations}`);
        } catch (error) {
            console.error(`${DragonbaneActionRules.ID} | Error toggling all overrides:`, error);
        }
    }

    /**
     * Show override status to the current user
     */
    static showOverrideStatus() {
        try {
            const activeOverrides = [];
            
            if (DragonbaneActionRules.overrides.targetSelection) {
                activeOverrides.push(game.i18n.localize('DRAGONBANE_ACTION_RULES.overrides.status.targetSelection'));
            }
            
            if (DragonbaneActionRules.overrides.rangeChecking) {
                activeOverrides.push(game.i18n.localize('DRAGONBANE_ACTION_RULES.overrides.status.rangeChecking'));
            }
            
            if (DragonbaneActionRules.overrides.yzeActionTracking) {
                activeOverrides.push(game.i18n.localize('DRAGONBANE_ACTION_RULES.overrides.status.yzeActionTracking'));
            }
            
            if (DragonbaneActionRules.overrides.allValidations) {
                activeOverrides.push(game.i18n.localize('DRAGONBANE_ACTION_RULES.overrides.status.allValidations'));
            }
            
            let message;
            if (activeOverrides.length === 0) {
                message = game.i18n.localize('DRAGONBANE_ACTION_RULES.overrides.status.allActive');
            } else {
                const overrideList = activeOverrides.join(', ');
                message = game.i18n.format('DRAGONBANE_ACTION_RULES.overrides.status.activeOverrides', { overrides: overrideList });
            }
            
            ui.notifications.info(message, { permanent: false });
            DragonbaneUtils.debugLog(DragonbaneActionRules.ID, 'Main', `Override status requested: ${message}`);
        } catch (error) {
            console.error(`${DragonbaneActionRules.ID} | Error showing override status:`, error);
        }
    }

    /**
     * Reset all overrides to default state
     */
    static resetOverrides() {
        try {
            const hadOverrides = DragonbaneActionRules.overrides.targetSelection || 
                                DragonbaneActionRules.overrides.rangeChecking || 
                                DragonbaneActionRules.overrides.yzeActionTracking ||
                                DragonbaneActionRules.overrides.allValidations;
            
            DragonbaneActionRules.overrides.targetSelection = false;
            DragonbaneActionRules.overrides.rangeChecking = false;
            DragonbaneActionRules.overrides.yzeActionTracking = false;
            DragonbaneActionRules.overrides.allValidations = false;
            
            if (hadOverrides) {
                ui.notifications.info(game.i18n.localize('DRAGONBANE_ACTION_RULES.overrides.allOverridesCleared'), { permanent: false });
                DragonbaneUtils.debugLog(DragonbaneActionRules.ID, 'Main', 'All overrides reset');
            }
        } catch (error) {
            console.error(`${DragonbaneActionRules.ID} | Error resetting overrides:`, error);
        }
    }
}

// Initialize when Foundry is ready
Hooks.once('init', DragonbaneActionRules.initialize);

// Make the class globally available
window.DragonbaneActionRules = DragonbaneActionRules;

// Export for use by other modules
export { DragonbaneActionRules };
