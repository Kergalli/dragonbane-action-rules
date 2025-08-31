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
  static VERSION = "1.3.9";

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
    targetSelection: false,
    rangeChecking: false,
    yzeActionTracking: false,
    allValidations: false,
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
      console.error(
        `${DragonbaneActionRules.ID} | Failed to register hooks and keybinds:`,
        error
      );
    }
  }

  /**
   * Register keyboard shortcuts
   */
  static registerKeybinds() {
    try {
      // Toggle Target Selection Override
      game.keybindings.register(
        DragonbaneActionRules.ID,
        "toggleTargetOverride",
        {
          name: "Toggle Target Override",
          hint: "Temporarily disable/enable target selection enforcement",
          editable: [{ key: "KeyT", modifiers: ["Alt"] }],
          onDown: () => DragonbaneActionRules.toggleTargetOverride(),
        }
      );

      // Toggle Range Checking Override
      game.keybindings.register(
        DragonbaneActionRules.ID,
        "toggleRangeOverride",
        {
          name: "Toggle Range Override",
          hint: "Temporarily disable/enable weapon range validation",
          editable: [{ key: "KeyR", modifiers: ["Alt"] }],
          onDown: () => DragonbaneActionRules.toggleRangeOverride(),
        }
      );

      // Toggle YZE Integration Override
      game.keybindings.register(DragonbaneActionRules.ID, "toggleYZEOverride", {
        name: "Toggle YZE Override",
        hint: "Temporarily disable/enable YZE action tracking",
        editable: [{ key: "KeyY", modifiers: ["Alt"] }],
        onDown: () => DragonbaneActionRules.toggleYZEOverride(),
      });

      // Toggle All Validations Override
      game.keybindings.register(
        DragonbaneActionRules.ID,
        "toggleAllOverrides",
        {
          name: "Toggle All Overrides",
          hint: "Temporarily disable/enable all module validations and tracking",
          editable: [{ key: "KeyA", modifiers: ["Alt"] }],
          onDown: () => DragonbaneActionRules.toggleAllOverrides(),
        }
      );

      // Clear All Overrides
      game.keybindings.register(DragonbaneActionRules.ID, "clearOverrides", {
        name: "Clear All Overrides",
        hint: "Clear all temporary validation overrides",
        editable: [{ key: "KeyX", modifiers: ["Alt"] }],
        onDown: () => DragonbaneActionRules.clearAllOverrides(),
      });
    } catch (error) {
      console.error(
        `${DragonbaneActionRules.ID} | Failed to register keybinds:`,
        error
      );
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
      console.error(
        `${DragonbaneActionRules.ID} | Failed to enable module:`,
        error
      );
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
      console.error(
        `${DragonbaneActionRules.ID} | Failed to disable module:`,
        error
      );
    }
  }

  // Keyboard shortcut toggle methods (unchanged)
  static toggleTargetOverride() {
    DragonbaneActionRules.overrides.targetSelection =
      !DragonbaneActionRules.overrides.targetSelection;
    const status = DragonbaneActionRules.overrides.targetSelection
      ? "disabled"
      : "enabled";
    ui.notifications.info(`Target selection validation ${status}`);
  }

  static toggleRangeOverride() {
    DragonbaneActionRules.overrides.rangeChecking =
      !DragonbaneActionRules.overrides.rangeChecking;
    const status = DragonbaneActionRules.overrides.rangeChecking
      ? "disabled"
      : "enabled";
    ui.notifications.info(`Range checking validation ${status}`);
  }

  static toggleYZEOverride() {
    DragonbaneActionRules.overrides.yzeActionTracking =
      !DragonbaneActionRules.overrides.yzeActionTracking;
    const status = DragonbaneActionRules.overrides.yzeActionTracking
      ? "disabled"
      : "enabled";
    ui.notifications.info(`YZE action tracking ${status}`);
  }

  static toggleAllOverrides() {
    DragonbaneActionRules.overrides.allValidations =
      !DragonbaneActionRules.overrides.allValidations;
    const status = DragonbaneActionRules.overrides.allValidations
      ? "disabled"
      : "enabled";
    ui.notifications.info(`All module validations ${status}`);
  }

  static clearAllOverrides() {
    DragonbaneActionRules.overrides = {
      targetSelection: false,
      rangeChecking: false,
      yzeActionTracking: false,
      allValidations: false,
    };
    ui.notifications.info("All validation overrides cleared");
  }
}

// Initialize when DOM is ready
Hooks.once("init", () => {
  DragonbaneActionRules.initialize();
});

// Export for global access
window.DragonbaneActionRules = DragonbaneActionRules;
