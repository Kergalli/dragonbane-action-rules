/**
 * Dragonbane Combat Assistant - Main Module
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
import { SpellLibrary } from "./spell-library.js";
import { DragonbaneUtils } from "./utils.js";
import { DragonbaneValidator } from "./validation.js";
import { DragonbaneYZEIntegration } from "./yze-integration.js";

class DragonbaneActionRules {
  static ID = "dragonbane-action-rules";
  static VERSION = "2.0.0";

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
  static spellLibrary = SpellLibrary;
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

      // Direct hook and keybind registration
      DragonbaneActionRules.registerHooksAndKeybinds();

      // Debug initialization message
      DragonbaneUtils.debugLog(
        DragonbaneActionRules.ID,
        "Main",
        `${game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.console.initializing"
        )} v${DragonbaneActionRules.VERSION}`
      );
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Critical initialization error: ${error.message}`);
      }
      ui.notifications.error(
        "Dragonbane Combat Assistant failed to initialize. Check console for details."
      );
    }
  }

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

        // Socket setup using socketlib - with proper error handling
        // Socket setup using socketlib - CORRECTED VERSION
        try {
          if (game.modules.get("socketlib")?.active) {
            // DIRECT registration - no waiting for socketlib.ready hook
            DragonbaneActionRules.socket = socketlib.registerModule(
              "dragonbane-action-rules"
            );

            // Register the applyStatusEffect function for GM execution
            DragonbaneActionRules.socket.register(
              "applyStatusEffect",
              async (data) => {
                try {
                  const target = await fromUuid(data.targetUuid);
                  if (target) {
                    await target.createEmbeddedDocuments("ActiveEffect", [
                      data.effectData,
                    ]);
                  }
                } catch (error) {
                  console.error(
                    "Combat Assistant - applyStatusEffect error:",
                    error
                  );
                }
              }
            );

            DragonbaneUtils.debugLog(
              DragonbaneActionRules.ID,
              "Socket",
              "Socket handlers registered successfully"
            );
          }
        } catch (error) {
          console.error("Combat Assistant - Socket setup error:", error);
        }
      });

      // Direct hook registration using new system
      registerHooks(DragonbaneActionRules.ID);

      // Register keyboard shortcuts
      DragonbaneActionRules.registerKeybinds();
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Failed to register hooks and keybinds: ${error.message}`
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
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Failed to register keybinds: ${error.message}`);
      }
    }
  }

  /**
   * Enable the module - no complex hook management needed
   */
  static enableModule() {
    try {
      if (isDebugMode(DragonbaneActionRules.ID)) {
        console.log(
          `${DragonbaneActionRules.ID} | ${game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.console.moduleEnabled"
          )}`
        );
      }
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Failed to enable module: ${error.message}`);
      }
    }
  }

  /**
   * Disable the module - just cleanup external integrations
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
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Failed to disable module: ${error.message}`);
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
