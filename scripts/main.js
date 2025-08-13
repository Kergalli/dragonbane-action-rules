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
    static VERSION = '1.3.0';
    
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
     * Enable the module functionality
     */
    static enableModule() {
        if (DragonbaneActionRules.hooks.isEnabled()) return;

        // Enable all hook systems with callbacks
        DragonbaneActionRules.hooks.enableAll({
            onChatMessage: DragonbaneActionRules.rulesDisplay.onChatMessage.bind(DragonbaneActionRules.rulesDisplay),
            performWeaponAttack: DragonbaneActionRules.validator.performWeaponAttack.bind(DragonbaneActionRules.validator),
            // Encumbrance callbacks
            onActorUpdate: DragonbaneActionRules.encumbranceMonitor.onActorUpdate.bind(DragonbaneActionRules.encumbranceMonitor),
            onItemUpdate: DragonbaneActionRules.encumbranceMonitor.onItemUpdate.bind(DragonbaneActionRules.encumbranceMonitor),
            onItemChange: DragonbaneActionRules.encumbranceMonitor.onItemChange.bind(DragonbaneActionRules.encumbranceMonitor),
            // YZE integration callback (post-roll via chat detection)
            onChatMessageAction: DragonbaneActionRules.yzeIntegration.onChatMessageAction.bind(DragonbaneActionRules.yzeIntegration)
        });
        
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
