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
    static VERSION = '1.3.1';
    
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

        // Add console commands
        DragonbaneActionRules.setupConsoleCommands();

        // Conditional initialization logging
        setTimeout(() => {
            if (DragonbaneActionRules.settings?.isDebugMode()) {
                console.log(`${DragonbaneActionRules.ID} | ${game.i18n.localize("DRAGONBANE_ACTION_RULES.console.initializing")} v${DragonbaneActionRules.VERSION}`);
            }
        }, 100); // Small delay to ensure settings are registered
    }

    /**
     * Register main module hooks
     */
    static registerMainHooks() {
        Hooks.once('ready', () => {
            if (DragonbaneActionRules.settings.isEnabled()) {
                DragonbaneActionRules.enableModule();
            }
            
            // Initialize encumbrance monitoring if enabled
            if (DragonbaneActionRules.settings.isEncumbranceMonitoringEnabled()) {
                DragonbaneActionRules.encumbranceMonitor.initialize();
            }

            // Initialize YZE integration if enabled
            if (DragonbaneActionRules.settings.isYZEIntegrationEnabled()) {
                DragonbaneActionRules.yzeIntegration.initialize();
            }
        });
    }

    /**
     * Register keyboard shortcuts for validation overrides
     */
    static registerKeybinds() {
        // Toggle Target Selection Override
        game.keybindings.register(DragonbaneActionRules.ID, "toggleTargetOverride", {
            name: "Toggle Target Selection Override",
            hint: "Temporarily disable target selection enforcement",
            editable: [{ key: "KeyT", modifiers: ["Alt"] }],
            onDown: () => DragonbaneActionRules.toggleTargetOverride()
        });

        // Toggle Range Checking Override
        game.keybindings.register(DragonbaneActionRules.ID, "toggleRangeOverride", {
            name: "Toggle Range Checking Override", 
            hint: "Temporarily disable weapon range validation",
            editable: [{ key: "KeyR", modifiers: ["Alt"] }],
            onDown: () => DragonbaneActionRules.toggleRangeOverride()
        });

        // Toggle YZE Action Tracking Override
        game.keybindings.register(DragonbaneActionRules.ID, "toggleYZEOverride", {
            name: "Toggle YZE Action Tracking Override",
            hint: "Temporarily disable automatic YZE action status effect application",
            editable: [{ key: "KeyY", modifiers: ["Alt"] }],
            onDown: () => DragonbaneActionRules.toggleYZEOverride()
        });

        // Show Override Status
        game.keybindings.register(DragonbaneActionRules.ID, "showOverrideStatus", {
            name: "Show Override Status",
            hint: "Display current status of all validation and tracking overrides",
            editable: [{ key: "KeyS", modifiers: ["Alt"] }],
            onDown: () => DragonbaneActionRules.showOverrideStatus()
        });

        // Override All Validations
        game.keybindings.register(DragonbaneActionRules.ID, "toggleAllOverrides", {
            name: "Override All Validations",
            hint: "Temporarily disable all attack validation rules and YZE action tracking",
            editable: [{ key: "KeyA", modifiers: ["Alt"] }],
            onDown: () => DragonbaneActionRules.toggleAllOverrides()
        });

        // Reset All Overrides
        game.keybindings.register(DragonbaneActionRules.ID, "resetOverrides", {
            name: "Reset All Overrides",
            hint: "Clear all temporary validation and tracking overrides",
            editable: [{ key: "KeyX", modifiers: ["Alt"] }],
            onDown: () => DragonbaneActionRules.resetOverrides()
        });
    }

    /**
     * Enable the module functionality
     */
    static enableModule() {
        if (DragonbaneActionRules.hooks.isEnabled()) return;

        // Enable all hook systems with callbacks and pass rulesDisplay instance
        DragonbaneActionRules.hooks.enableAll({
            onChatMessage: DragonbaneActionRules.rulesDisplay.onChatMessage.bind(DragonbaneActionRules.rulesDisplay),
            performWeaponAttack: DragonbaneActionRules.validator.performWeaponAttack.bind(DragonbaneActionRules.validator),
            // Encumbrance callbacks
            onActorUpdate: DragonbaneActionRules.encumbranceMonitor.onActorUpdate.bind(DragonbaneActionRules.encumbranceMonitor),
            onItemUpdate: DragonbaneActionRules.encumbranceMonitor.onItemUpdate.bind(DragonbaneActionRules.encumbranceMonitor),
            onItemChange: DragonbaneActionRules.encumbranceMonitor.onItemChange.bind(DragonbaneActionRules.encumbranceMonitor),
            // YZE integration callback (post-roll via chat detection)
            onChatMessageAction: DragonbaneActionRules.yzeIntegration.onChatMessageAction.bind(DragonbaneActionRules.yzeIntegration)
        }, DragonbaneActionRules.rulesDisplay); // Pass the rulesDisplay instance
        
        DragonbaneUtils.debugLog(DragonbaneActionRules.ID, 'Main', game.i18n.localize("DRAGONBANE_ACTION_RULES.console.moduleEnabled"));
    }

    /**
     * Disable the module functionality
     */
    static disableModule() {
        DragonbaneActionRules.hooks.disableAll();
        DragonbaneUtils.debugLog(DragonbaneActionRules.ID, 'Main', game.i18n.localize("DRAGONBANE_ACTION_RULES.console.moduleDisabled"));
    }

    /**
     * Toggle target selection override
     */
    static toggleTargetOverride() {
        DragonbaneActionRules.overrides.targetSelection = !DragonbaneActionRules.overrides.targetSelection;
        const messageKey = DragonbaneActionRules.overrides.targetSelection ? 
            'DRAGONBANE_ACTION_RULES.overrides.targetEnforcementDisabled' : 
            'DRAGONBANE_ACTION_RULES.overrides.targetEnforcementEnabled';
        ui.notifications.info(game.i18n.localize(messageKey), { permanent: false });
        DragonbaneUtils.debugLog(DragonbaneActionRules.ID, 'Main', `Target selection override: ${DragonbaneActionRules.overrides.targetSelection}`);
    }

    /**
     * Toggle range checking override
     */
    static toggleRangeOverride() {
        DragonbaneActionRules.overrides.rangeChecking = !DragonbaneActionRules.overrides.rangeChecking;
        const messageKey = DragonbaneActionRules.overrides.rangeChecking ? 
            'DRAGONBANE_ACTION_RULES.overrides.rangeCheckingDisabled' : 
            'DRAGONBANE_ACTION_RULES.overrides.rangeCheckingEnabled';
        ui.notifications.info(game.i18n.localize(messageKey), { permanent: false });
        DragonbaneUtils.debugLog(DragonbaneActionRules.ID, 'Main', `Range checking override: ${DragonbaneActionRules.overrides.rangeChecking}`);
    }

    /**
     * Toggle YZE action tracking override
     */
    static toggleYZEOverride() {
        DragonbaneActionRules.overrides.yzeActionTracking = !DragonbaneActionRules.overrides.yzeActionTracking;
        const messageKey = DragonbaneActionRules.overrides.yzeActionTracking ? 
            'DRAGONBANE_ACTION_RULES.overrides.yzeActionTrackingDisabled' : 
            'DRAGONBANE_ACTION_RULES.overrides.yzeActionTrackingEnabled';
        ui.notifications.info(game.i18n.localize(messageKey), { permanent: false });
        DragonbaneUtils.debugLog(DragonbaneActionRules.ID, 'Main', `YZE action tracking override: ${DragonbaneActionRules.overrides.yzeActionTracking}`);
    }

    /**
     * Toggle all validation overrides
     */
    static toggleAllOverrides() {
        DragonbaneActionRules.overrides.allValidations = !DragonbaneActionRules.overrides.allValidations;
        const messageKey = DragonbaneActionRules.overrides.allValidations ? 
            'DRAGONBANE_ACTION_RULES.overrides.allValidationDisabled' : 
            'DRAGONBANE_ACTION_RULES.overrides.allValidationEnabled';
        ui.notifications.warn(game.i18n.localize(messageKey), { permanent: false });
        DragonbaneUtils.debugLog(DragonbaneActionRules.ID, 'Main', `All validations override: ${DragonbaneActionRules.overrides.allValidations}`);
    }

    /**
     * Show override status to the current user
     */
    static showOverrideStatus() {
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
    }

    /**
     * Reset all overrides to default state
     */
    static resetOverrides() {
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
    }

    /**
     * Setup console commands for debugging
     */
    static setupConsoleCommands() {
        Hooks.once('ready', () => {
            // Add console commands to the existing class instead of replacing it
            Object.assign(window.DragonbaneActionRules, {
                enable: () => DragonbaneActionRules.enableModule(),
                disable: () => DragonbaneActionRules.disableModule(),
                version: DragonbaneActionRules.VERSION,
                yze: DragonbaneActionRules.yzeIntegration,
                utils: DragonbaneActionRules.utils,
                patterns: DragonbaneActionRules.patternManager,
                // Override controls for manual testing
                overrides: {
                    target: () => DragonbaneActionRules.toggleTargetOverride(),
                    range: () => DragonbaneActionRules.toggleRangeOverride(),
                    yze: () => DragonbaneActionRules.toggleYZEOverride(),
                    all: () => DragonbaneActionRules.toggleAllOverrides(),
                    reset: () => DragonbaneActionRules.resetOverrides(),
                    status: () => DragonbaneActionRules.showOverrideStatus(),
                    consoleStatus: () => {
                        console.log('Override Status:');
                        console.log(`  Target Selection: ${DragonbaneActionRules.overrides.targetSelection ? 'DISABLED' : 'enabled'}`);
                        console.log(`  Range Checking: ${DragonbaneActionRules.overrides.rangeChecking ? 'DISABLED' : 'enabled'}`);
                        console.log(`  YZE Action Tracking: ${DragonbaneActionRules.overrides.yzeActionTracking ? 'DISABLED' : 'enabled'}`);
                        console.log(`  All Validations: ${DragonbaneActionRules.overrides.allValidations ? 'DISABLED' : 'enabled'}`);
                    }
                },
                // Refresh patterns manually
                refreshPatterns: () => {
                    if (DragonbaneActionRules.patternManager) {
                        DragonbaneActionRules.patternManager.refreshPatterns();
                        console.log("Patterns refreshed for current language");
                    } else {
                        console.log("Pattern manager not available");
                    }
                },
                debug: () => {
                    console.log(game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.header"));
                    console.log(`${game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.moduleEnabled")}: ${DragonbaneActionRules.hooks.isEnabled()}`);
                    console.log(`${game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.controlledTokens")}: ${canvas.tokens.controlled.length}`);
                    console.log(`${game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.targetedTokens")}: ${game.user.targets.size}`);
                    console.log(`YZE Integration: ${DragonbaneActionRules.yzeIntegration?.isEnabled() ? 'Enabled' : 'Disabled'}`);
                    console.log(`Patterns Initialized: ${DragonbaneActionRules.patternManager?.areInitialized() ? 'Yes' : 'No'}`);
                    console.log(`Target Override: ${DragonbaneActionRules.overrides.targetSelection}`);
                    console.log(`Range Override: ${DragonbaneActionRules.overrides.rangeChecking}`);
                    console.log(`YZE Override: ${DragonbaneActionRules.overrides.yzeActionTracking}`);
                    console.log(`All Overrides: ${DragonbaneActionRules.overrides.allValidations}`);
                    console.log(game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.rangeRules"));
                    console.log(game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.footer"));
                }
            });
        });
    }
}

// Initialize when Foundry is ready
Hooks.once('init', DragonbaneActionRules.initialize);

// Make the class globally available
window.DragonbaneActionRules = DragonbaneActionRules;

// Export for use by other modules
export { DragonbaneActionRules };
