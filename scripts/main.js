/**
 * Dragonbane Combat Assistant - Main Module
 * Core initialization and module management
 */

import { DragonbaneSettings } from './settings.js';
import { DragonbaneHooks } from './hooks.js';
import { DragonbaneValidator } from './validation.js';
import { DragonbaneRulesDisplay } from './rules-display.js';
import { DragonbaneEncumbranceMonitor } from './encumbrance-monitor.js';

class DragonbaneActionRules {
    static ID = 'dragonbane-action-rules';
    static VERSION = '1.2.0';
    
    static FLAGS = {
        RULES_MESSAGE: 'dragonbaneRulesMessage'
    };

    // Module components
    static settings = null;
    static hooks = null;
    static validator = null;
    static rulesDisplay = null;
    static encumbranceMonitor = null;

    /**
     * Initialize the module
     */
    static initialize() {
        console.log(`${DragonbaneActionRules.ID} | ${game.i18n.localize("DRAGONBANE_ACTION_RULES.console.initializing")} v${DragonbaneActionRules.VERSION}`);
        
        if (game.system.id !== 'dragonbane') {
            console.warn(`${DragonbaneActionRules.ID} | ${game.i18n.localize("DRAGONBANE_ACTION_RULES.console.wrongSystem")}`);
            return;
        }

        // Initialize components
        DragonbaneActionRules.settings = new DragonbaneSettings(DragonbaneActionRules.ID);
        DragonbaneActionRules.hooks = new DragonbaneHooks(DragonbaneActionRules.ID);
        DragonbaneActionRules.validator = new DragonbaneValidator(DragonbaneActionRules.ID);
        DragonbaneActionRules.rulesDisplay = new DragonbaneRulesDisplay(DragonbaneActionRules.ID);
        DragonbaneActionRules.encumbranceMonitor = new DragonbaneEncumbranceMonitor(DragonbaneActionRules.ID);

        // Register settings and hooks
        DragonbaneActionRules.settings.register();
        DragonbaneActionRules.registerMainHooks();

        // Add console commands
        DragonbaneActionRules.setupConsoleCommands();
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
            onItemChange: DragonbaneActionRules.encumbranceMonitor.onItemChange.bind(DragonbaneActionRules.encumbranceMonitor)
        });
        
        DragonbaneActionRules.debugLog(game.i18n.localize("DRAGONBANE_ACTION_RULES.console.moduleEnabled"));
    }

    /**
     * Disable the module functionality
     */
    static disableModule() {
        DragonbaneActionRules.hooks.disableAll();
        DragonbaneActionRules.debugLog(game.i18n.localize("DRAGONBANE_ACTION_RULES.console.moduleDisabled"));
    }

    /**
     * Setup console commands for debugging
     */
    static setupConsoleCommands() {
        Hooks.once('ready', () => {
            window.DragonbaneActionRules = {
                enable: () => DragonbaneActionRules.enableModule(),
                disable: () => DragonbaneActionRules.disableModule(),
                version: DragonbaneActionRules.VERSION,
                debug: () => {
                    console.log(game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.header"));
                    console.log(`${game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.moduleEnabled")}: ${DragonbaneActionRules.hooks.isEnabled()}`);
                    console.log(`${game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.controlledTokens")}: ${canvas.tokens.controlled.length}`);
                    console.log(`${game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.targetedTokens")}: ${game.user.targets.size}`);
                    console.log(game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.rangeRules"));
                    console.log(game.i18n.localize("DRAGONBANE_ACTION_RULES.debug.footer"));
                }
            };
        });
    }

    /**
     * Debug logging
     */
    static debugLog(message) {
        if (DragonbaneActionRules.settings.isDebugMode()) {
            console.log(`${DragonbaneActionRules.ID} | ${message}`);
        }
    }
}

// Initialize when Foundry is ready
Hooks.once('init', DragonbaneActionRules.initialize);

// Export for use by other modules
export { DragonbaneActionRules };
