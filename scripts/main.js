/**
 * Dragonbane Combat Assistant - Main Module (Phase 3.3 - Simplified Hooks)
 * Core initialization and module management
 */

import { DragonbaneEncumbranceMonitor } from "./encumbrance-monitor.js";
import { DragonbaneGrudgeTracker } from "./grudge-tracker.js";
import {
  cleanupCharacterSheets,
  disableTokenActionHUD,
  registerHooks,
} from "./hooks.js";
import { DragonbanePatternManager } from "./pattern-manager.js";
import { DragonbaneRulesDisplay } from "./rules-display.js";
import { isDebugMode, registerSettings, SETTINGS } from "./settings.js";
import { DragonbaneUtils } from "./utils.js";
import { DragonbaneValidator } from "./validation.js";
import { DragonbaneYZEIntegration } from "./yze-integration.js";

class DragonbaneActionRules {
  static ID = "dragonbane-action-rules";
  static VERSION = "1.4.0";

  static FLAGS = {
    RULES_MESSAGE: "dragonbaneRulesMessage",
  };

  // Module components
  static validator = null;
  static rulesDisplay = null;
  static encumbranceMonitor = null;
  static yzeIntegration = null;
  static patternManager = null;
  static grudgeTracker = null;
  static utils = DragonbaneUtils; // Make utils available

  // Override state for keyboard shortcuts
  static overrides = {
    validationBypass: false,
  };

  /**
   * Initialize the module
   */
  static initialize() {
    try {
      if (game.system.id !== "dragonbane") {
        console.warn(
          `${DragonbaneActionRules.ID} | ${game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.console.wrongSystem"
          )}`
        );
        return;
      }

      // Register settings using the new simplified function
      registerSettings(DragonbaneActionRules.ID);

      // Initialize core components first
      DragonbaneActionRules.patternManager = new DragonbanePatternManager(
        DragonbaneActionRules.ID
      );

      // Initialize other components with pattern manager dependency
      DragonbaneActionRules.validator = new DragonbaneValidator(
        DragonbaneActionRules.ID
      );
      DragonbaneActionRules.rulesDisplay = new DragonbaneRulesDisplay(
        DragonbaneActionRules.ID,
        DragonbaneActionRules.patternManager
      );
      DragonbaneActionRules.encumbranceMonitor =
        new DragonbaneEncumbranceMonitor(DragonbaneActionRules.ID);
      DragonbaneActionRules.yzeIntegration = new DragonbaneYZEIntegration(
        DragonbaneActionRules.ID,
        DragonbaneActionRules.patternManager
      );
      DragonbaneActionRules.grudgeTracker = new DragonbaneGrudgeTracker(
        DragonbaneActionRules.ID
      );

      // SIMPLIFIED: Direct hook and keybind registration
      DragonbaneActionRules.registerHooksAndKeybinds();

      // Conditional initialization logging using the new convenience function
      setTimeout(() => {
        if (isDebugMode(DragonbaneActionRules.ID)) {
          console.log(
            `${DragonbaneActionRules.ID} | ${game.i18n.localize(
              "DRAGONBANE_ACTION_RULES.console.initializing"
            )} v${DragonbaneActionRules.VERSION}`
          );
        }
      }, 100); // Small delay to ensure settings are registered
    } catch (error) {
      console.error(
        `${DragonbaneActionRules.ID} | Critical initialization error:`,
        error
      );
      ui.notifications.error(
        "Dragonbane Combat Assistant failed to initialize. Check console for details."
      );
    }
  }

  /**
   * SIMPLIFIED: Register hooks and keybinds - no complex state management
   */
  static registerHooksAndKeybinds() {
    try {
      // Main ready hook for module activation
      Hooks.once("ready", () => {
        // Enable module if it's set to enabled in settings
        if (game.settings.get(DragonbaneActionRules.ID, SETTINGS.ENABLED)) {
          DragonbaneActionRules.enableModule();
        }

        // Initialize components that need ready state
        DragonbaneActionRules.encumbranceMonitor?.initialize();
        DragonbaneActionRules.yzeIntegration?.initialize();
      });

      // SIMPLIFIED: Direct hook registration using new system
      registerHooks(DragonbaneActionRules.ID);

      // Register keyboard shortcuts
      DragonbaneActionRules.registerKeybinds();
    } catch (error) {
      // CHANGED: Use DoD_Utility.WARNING instead of console.error
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Failed to register hooks and keybinds: ${error.message}`
        );
      } else {
        console.error(
          `${DragonbaneActionRules.ID} | Failed to register hooks and keybinds:`,
          error
        );
      }
    }
  }

  /**
   * Register keyboard shortcuts
   */
  static registerKeybinds() {
    try {
      // Toggle Combat Validation Bypass
      game.keybindings.register(
        DragonbaneActionRules.ID,
        "toggleValidationBypass",
        {
          name: "Toggle Combat Validation Bypass",
          hint: "Temporarily disable/enable all combat validations and YZE tracking",
          editable: [{ key: "KeyV", modifiers: ["Alt"] }],
          onDown: () => DragonbaneActionRules.toggleValidationBypass(),
        }
      );
    } catch (error) {
      // CHANGED: Use DoD_Utility.WARNING instead of console.error
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Failed to register keybinds: ${error.message}`);
      } else {
        console.error(
          `${DragonbaneActionRules.ID} | Failed to register keybinds:`,
          error
        );
      }
    }
  }

  /**
   * SIMPLIFIED: Enable the module - no complex hook management needed
   */
  static enableModule() {
    try {
      // All hooks are now always registered - settings control behavior inside hooks
      // No need for complex enabling/disabling logic

      if (isDebugMode(DragonbaneActionRules.ID)) {
        console.log(
          `${DragonbaneActionRules.ID} | ${game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.console.moduleEnabled"
          )}`
        );
      }
    } catch (error) {
      // CHANGED: Use DoD_Utility.WARNING instead of console.error
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Failed to enable module: ${error.message}`);
      } else {
        console.error(
          `${DragonbaneActionRules.ID} | Failed to enable module:`,
          error
        );
      }
    }
  }

  /**
   * SIMPLIFIED: Disable the module - just cleanup external integrations
   */
  static disableModule() {
    try {
      // Clean up external integrations
      disableTokenActionHUD();
      cleanupCharacterSheets();

      if (isDebugMode(DragonbaneActionRules.ID)) {
        console.log(
          `${DragonbaneActionRules.ID} | ${game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.console.moduleDisabled"
          )}`
        );
      }
    } catch (error) {
      // CHANGED: Use DoD_Utility.WARNING instead of console.error
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Failed to disable module: ${error.message}`);
      } else {
        console.error(
          `${DragonbaneActionRules.ID} | Failed to disable module:`,
          error
        );
      }
    }
  }

  // Keyboard shortcut toggle method
  static toggleValidationBypass() {
    DragonbaneActionRules.overrides.validationBypass =
      !DragonbaneActionRules.overrides.validationBypass;
    const status = DragonbaneActionRules.overrides.validationBypass
      ? "bypassed"
      : "active";
    ui.notifications.info(`Combat validations ${status}`);
  }
}

// Initialize when DOM is ready
Hooks.once("init", () => {
  DragonbaneActionRules.initialize();
});

// Export for global access
window.DragonbaneActionRules = DragonbaneActionRules;
