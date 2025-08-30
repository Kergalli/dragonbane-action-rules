/**
 * Dragonbane Combat Assistant - Main Module
 * Core initialization and module management
 */

import { DragonbaneEncumbranceMonitor } from "./encumbrance-monitor.js";
import { DragonbaneGrudgeTracker } from "./grudge-tracker.js";
import { DragonbaneHooks } from "./hooks.js";
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
  static hooks = null;
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
      DragonbaneActionRules.hooks = new DragonbaneHooks(
        DragonbaneActionRules.ID
      );
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

      // Register hooks and keybinds
      DragonbaneActionRules.registerMainHooks();
      DragonbaneActionRules.registerKeybinds();

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
   * Register main hooks that should always be active
   */
  static registerMainHooks() {
    try {
      // Main initialization hook
      Hooks.once("ready", () => {
        // Enable module if it's set to enabled in settings
        if (game.settings.get(DragonbaneActionRules.ID, SETTINGS.ENABLED)) {
          DragonbaneActionRules.enableModule();
        }

        // Additional ready-state initialization
        DragonbaneActionRules.encumbranceMonitor?.initialize();
        DragonbaneActionRules.yzeIntegration?.initialize();
      });
    } catch (error) {
      console.error(
        `${DragonbaneActionRules.ID} | Failed to register main hooks:`,
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
        hint: "Temporarily disable/enable automatic YZE action tracking",
        editable: [{ key: "KeyY", modifiers: ["Alt"] }],
        onDown: () => DragonbaneActionRules.toggleYZEOverride(),
      });

      // Show Override Status
      game.keybindings.register(
        DragonbaneActionRules.ID,
        "showOverrideStatus",
        {
          name: "Show Override Status",
          hint: "Display current override status",
          editable: [{ key: "KeyS", modifiers: ["Alt"] }],
          onDown: () => DragonbaneActionRules.showOverrideStatus(),
        }
      );

      // Override All Validations
      game.keybindings.register(DragonbaneActionRules.ID, "overrideAll", {
        name: "Override All",
        hint: "Temporarily disable/enable all validation rules and action tracking",
        editable: [{ key: "KeyA", modifiers: ["Alt"] }],
        onDown: () => DragonbaneActionRules.toggleAllOverrides(),
      });

      // Reset All Overrides
      game.keybindings.register(DragonbaneActionRules.ID, "resetAllOverrides", {
        name: "Reset All Overrides",
        hint: "Clear all temporary overrides",
        editable: [{ key: "KeyX", modifiers: ["Alt"] }],
        onDown: () => DragonbaneActionRules.resetOverrides(),
      });
    } catch (error) {
      console.error(
        `${DragonbaneActionRules.ID} | Failed to register keybinds:`,
        error
      );
    }
  }

  /**
   * Enable the module functionality
   */
  static enableModule() {
    try {
      if (!DragonbaneActionRules.hooks) {
        console.error(
          `${DragonbaneActionRules.ID} | Cannot enable module - hooks not initialized`
        );
        return;
      }

      if (DragonbaneActionRules.hooks.isEnabled()) return;

      // Enable all hook systems with callbacks and pass component instances
      DragonbaneActionRules.hooks.enableAll(
        {
          onChatMessage:
            DragonbaneActionRules.rulesDisplay?.onChatMessage?.bind(
              DragonbaneActionRules.rulesDisplay
            ),
          performWeaponAttack:
            DragonbaneActionRules.validator?.performWeaponAttack?.bind(
              DragonbaneActionRules.validator
            ),
          // Encumbrance callbacks
          onActorUpdate:
            DragonbaneActionRules.encumbranceMonitor?.onActorUpdate?.bind(
              DragonbaneActionRules.encumbranceMonitor
            ),
          onItemUpdate:
            DragonbaneActionRules.encumbranceMonitor?.onItemUpdate?.bind(
              DragonbaneActionRules.encumbranceMonitor
            ),
          onItemChange:
            DragonbaneActionRules.encumbranceMonitor?.onItemChange?.bind(
              DragonbaneActionRules.encumbranceMonitor
            ),
          onActorDelete:
            DragonbaneActionRules.encumbranceMonitor?.onActorDelete?.bind(
              DragonbaneActionRules.encumbranceMonitor
            ),
          // YZE integration callbacks
          onCombatTurn:
            DragonbaneActionRules.yzeIntegration?.onCombatTurn?.bind(
              DragonbaneActionRules.yzeIntegration
            ),
          onCombatRound:
            DragonbaneActionRules.yzeIntegration?.onCombatRound?.bind(
              DragonbaneActionRules.yzeIntegration
            ),
          // Grudge tracking callbacks
          onCombatCreate:
            DragonbaneActionRules.grudgeTracker?.onCombatCreate?.bind(
              DragonbaneActionRules.grudgeTracker
            ),
          onCombatDelete:
            DragonbaneActionRules.grudgeTracker?.onCombatDelete?.bind(
              DragonbaneActionRules.grudgeTracker
            ),
        },
        {
          validator: DragonbaneActionRules.validator,
          rulesDisplay: DragonbaneActionRules.rulesDisplay,
          encumbranceMonitor: DragonbaneActionRules.encumbranceMonitor,
          yzeIntegration: DragonbaneActionRules.yzeIntegration,
          grudgeTracker: DragonbaneActionRules.grudgeTracker,
        }
      );

      ui.notifications.info(
        game.i18n.localize("DRAGONBANE_ACTION_RULES.console.moduleEnabled"),
        { permanent: false }
      );

      console.log(
        `${DragonbaneActionRules.ID} | ${game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.console.moduleEnabled"
        )}`
      );
    } catch (error) {
      console.error(
        `${DragonbaneActionRules.ID} | Failed to enable module:`,
        error
      );
    }
  }

  /**
   * Disable the module functionality
   */
  static disableModule() {
    try {
      if (!DragonbaneActionRules.hooks) {
        console.warn(
          `${DragonbaneActionRules.ID} | Cannot disable module - hooks not initialized`
        );
        return;
      }

      if (!DragonbaneActionRules.hooks.isEnabled()) return;

      DragonbaneActionRules.hooks.disableAll();

      ui.notifications.info(
        game.i18n.localize("DRAGONBANE_ACTION_RULES.console.moduleDisabled"),
        { permanent: false }
      );

      console.log(
        `${DragonbaneActionRules.ID} | ${game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.console.moduleDisabled"
        )}`
      );
    } catch (error) {
      console.error(
        `${DragonbaneActionRules.ID} | Failed to disable module:`,
        error
      );
    }
  }

  // Override toggle methods (keyboard shortcuts)

  /**
   * Toggle target selection override
   */
  static toggleTargetOverride() {
    try {
      DragonbaneActionRules.overrides.targetSelection =
        !DragonbaneActionRules.overrides.targetSelection;
      const status = DragonbaneActionRules.overrides.targetSelection
        ? game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.overrides.targetEnforcementDisabled"
          )
        : game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.overrides.targetEnforcementEnabled"
          );
      ui.notifications.info(status, { permanent: false });
      DragonbaneUtils.debugLog(
        DragonbaneActionRules.ID,
        "Main",
        `Target selection override: ${DragonbaneActionRules.overrides.targetSelection}`
      );
    } catch (error) {
      console.error(
        `${DragonbaneActionRules.ID} | Error toggling target override:`,
        error
      );
    }
  }

  /**
   * Toggle range checking override
   */
  static toggleRangeOverride() {
    try {
      DragonbaneActionRules.overrides.rangeChecking =
        !DragonbaneActionRules.overrides.rangeChecking;
      const status = DragonbaneActionRules.overrides.rangeChecking
        ? game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.overrides.rangeCheckingDisabled"
          )
        : game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.overrides.rangeCheckingEnabled"
          );
      ui.notifications.info(status, { permanent: false });
      DragonbaneUtils.debugLog(
        DragonbaneActionRules.ID,
        "Main",
        `Range checking override: ${DragonbaneActionRules.overrides.rangeChecking}`
      );
    } catch (error) {
      console.error(
        `${DragonbaneActionRules.ID} | Error toggling range override:`,
        error
      );
    }
  }

  /**
   * Toggle YZE integration override
   */
  static toggleYZEOverride() {
    try {
      DragonbaneActionRules.overrides.yzeActionTracking =
        !DragonbaneActionRules.overrides.yzeActionTracking;
      const status = DragonbaneActionRules.overrides.yzeActionTracking
        ? game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.overrides.yzeActionTrackingDisabled"
          )
        : game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.overrides.yzeActionTrackingEnabled"
          );
      ui.notifications.info(status, { permanent: false });
      DragonbaneUtils.debugLog(
        DragonbaneActionRules.ID,
        "Main",
        `YZE action tracking override: ${DragonbaneActionRules.overrides.yzeActionTracking}`
      );
    } catch (error) {
      console.error(
        `${DragonbaneActionRules.ID} | Error toggling YZE override:`,
        error
      );
    }
  }

  /**
   * Toggle all validation overrides
   */
  static toggleAllOverrides() {
    try {
      DragonbaneActionRules.overrides.allValidations =
        !DragonbaneActionRules.overrides.allValidations;

      const status = DragonbaneActionRules.overrides.allValidations
        ? game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.overrides.allValidationDisabled"
          )
        : game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.overrides.allValidationEnabled"
          );
      ui.notifications.info(status, { permanent: false });
      DragonbaneUtils.debugLog(
        DragonbaneActionRules.ID,
        "Main",
        `All validations override: ${DragonbaneActionRules.overrides.allValidations}`
      );
    } catch (error) {
      console.error(
        `${DragonbaneActionRules.ID} | Error toggling all overrides:`,
        error
      );
    }
  }

  /**
   * Show current override status
   */
  static showOverrideStatus() {
    try {
      const activeOverrides = [];

      if (DragonbaneActionRules.overrides.targetSelection) {
        activeOverrides.push(
          game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.overrides.status.targetSelection"
          )
        );
      }

      if (DragonbaneActionRules.overrides.rangeChecking) {
        activeOverrides.push(
          game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.overrides.status.rangeChecking"
          )
        );
      }

      if (DragonbaneActionRules.overrides.yzeActionTracking) {
        activeOverrides.push(
          game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.overrides.status.yzeActionTracking"
          )
        );
      }

      if (DragonbaneActionRules.overrides.allValidations) {
        activeOverrides.push(
          game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.overrides.status.allValidations"
          )
        );
      }

      let message;
      if (activeOverrides.length === 0) {
        message = game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.overrides.status.allActive"
        );
      } else {
        const overrideList = activeOverrides.join(", ");
        message = game.i18n.format(
          "DRAGONBANE_ACTION_RULES.overrides.status.activeOverrides",
          { overrides: overrideList }
        );
      }

      ui.notifications.info(message, { permanent: false });
      DragonbaneUtils.debugLog(
        DragonbaneActionRules.ID,
        "Main",
        `Override status requested: ${message}`
      );
    } catch (error) {
      console.error(
        `${DragonbaneActionRules.ID} | Error showing override status:`,
        error
      );
    }
  }

  /**
   * Reset all overrides to default state
   */
  static resetOverrides() {
    try {
      const hadOverrides =
        DragonbaneActionRules.overrides.targetSelection ||
        DragonbaneActionRules.overrides.rangeChecking ||
        DragonbaneActionRules.overrides.yzeActionTracking ||
        DragonbaneActionRules.overrides.allValidations;

      DragonbaneActionRules.overrides.targetSelection = false;
      DragonbaneActionRules.overrides.rangeChecking = false;
      DragonbaneActionRules.overrides.yzeActionTracking = false;
      DragonbaneActionRules.overrides.allValidations = false;

      if (hadOverrides) {
        ui.notifications.info(
          game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.overrides.allOverridesCleared"
          ),
          { permanent: false }
        );
        DragonbaneUtils.debugLog(
          DragonbaneActionRules.ID,
          "Main",
          "All overrides reset"
        );
      }
    } catch (error) {
      console.error(
        `${DragonbaneActionRules.ID} | Error resetting overrides:`,
        error
      );
    }
  }
}

// Initialize when Foundry is ready
Hooks.once("init", DragonbaneActionRules.initialize);

// Make the class globally available
window.DragonbaneActionRules = DragonbaneActionRules;

// Export for use by other modules
export { DragonbaneActionRules };
