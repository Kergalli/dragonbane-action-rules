/**
 * Dragonbane Combat Assistant - Main Module
 */

import { DragonbaneEncumbranceMonitor } from "./encumbrance-monitor.js";
import { DragonbaneGrudgeTracker } from "./grudge-tracker.js";
import {
  cleanupCharacterSheets,
  disableTokenActionHUD,
  registerHooks,
  setupTokenActionHUD,
} from "./hooks.js";
import { DragonbanePatternManager } from "./pattern-manager.js";
import { DragonbaneRulesDisplay } from "./rules-display.js";
import { registerSettings, SETTINGS } from "./settings.js";
import { SpellLibrary } from "./spell-library.js";
import { DragonbaneUtils } from "./utils.js";
import { DragonbaneValidator } from "./validation.js";
import { DragonbaneYZEIntegration } from "./yze-integration.js";

class DragonbaneActionRules {
  static ID = "dragonbane-action-rules";
  static VERSION = "2.0.2";

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
        DragonbaneUtils.debugLog(
          DragonbaneActionRules.ID,
          "Main",
          `${game.i18n.localize("DRAGONBANE_ACTION_RULES.console.wrongSystem")}`
        );
        return;
      }

      registerSettings(DragonbaneActionRules.ID);

      DragonbaneActionRules.patternManager = new DragonbanePatternManager(
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

      // Direct hook and keybind registration
      DragonbaneActionRules.registerHooksAndKeybinds();

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
      Hooks.once("ready", () => {
        if (game.settings.get(DragonbaneActionRules.ID, SETTINGS.ENABLED)) {
          DragonbaneActionRules.enableModule();
        }

        DragonbaneActionRules.encumbranceMonitor?.initialize();
        DragonbaneActionRules.yzeIntegration?.initialize();

        try {
          if (game.modules.get("socketlib")?.active) {
            DragonbaneActionRules.socket = socketlib.registerModule(
              "dragonbane-action-rules"
            );
            DragonbaneActionRules.socket.register(
              "applyStatusEffect",
              async (data) => {
                try {
                  const target = await fromUuid(data.targetUuid);
                  const caster = data.casterUuid
                    ? await fromUuid(data.casterUuid)
                    : null;

                  if (target) {
                    // Rebuild effectData on GM side to ensure proper description
                    const effect = DragonbaneUtils.findStatusEffect(
                      data.config.effectId
                    );
                    if (!effect) return;

                    // Get localized name
                    let effectName;
                    if (data.config.effectNameKey) {
                      effectName = game.i18n.localize(
                        data.config.effectNameKey
                      );
                    } else if (effect.name) {
                      effectName = game.i18n.localize(effect.name);
                    } else {
                      effectName = data.config.effectId
                        .replace("dse-", "")
                        .replace(/-/g, " ");
                      effectName =
                        effectName.charAt(0).toUpperCase() +
                        effectName.slice(1);
                    }

                    const effectData = {
                      name: effectName,
                      img: effect.img || effect.icon || "icons/svg/aura.svg",
                      statuses: [effect.id],
                      origin: caster ? caster.uuid : target.uuid,
                    };

                    // Add description if it exists (GM has full access to descriptions)
                    if (
                      effect.description &&
                      effect.description !==
                        `${data.config.effectId} status effect`
                    ) {
                      effectData.description = effect.description;
                    }

                    // Add duration if specified
                    if (data.config.duration) {
                      effectData.duration = {
                        seconds: data.config.duration,
                        startTime: game.time.worldTime,
                      };
                    }

                    await target.createEmbeddedDocuments("ActiveEffect", [
                      effectData,
                    ]);
                  }
                } catch (error) {
                  if (
                    typeof DoD_Utility !== "undefined" &&
                    DoD_Utility.WARNING
                  ) {
                    DoD_Utility.WARNING(
                      `applyStatusEffect error: ${error.message}`
                    );
                  }
                }
              }
            );

            // Register the applyEncumbranceEffect function for GM execution
            DragonbaneActionRules.socket.register(
              "applyEncumbranceEffect",
              async (data) => {
                try {
                  const target = await fromUuid(data.targetUuid);
                  if (target) {
                    // Rebuild effect data on GM side to ensure proper description
                    const effect = DragonbaneUtils.findStatusEffect(
                      data.statusEffectName
                    );
                    if (!effect) return;

                    const effectData = {
                      name: data.statusEffectName,
                      img: effect.img || effect.icon || "icons/svg/anchor.svg",
                      statuses: [effect.id],
                      origin: target.uuid,
                    };

                    // Add description if it exists (GM has full access to descriptions)
                    if (
                      effect.description &&
                      effect.description !== `${effect.id} status effect`
                    ) {
                      effectData.description = effect.description;
                    }

                    await target.createEmbeddedDocuments("ActiveEffect", [
                      effectData,
                    ]);
                  }
                } catch (error) {
                  if (
                    typeof DoD_Utility !== "undefined" &&
                    DoD_Utility.WARNING
                  ) {
                    DoD_Utility.WARNING(
                      `applyEncumbranceEffect error: ${error.message}`
                    );
                  }
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
          if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
            DoD_Utility.WARNING(`Socket setup error: ${error.message}`);
          }
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
      // Re-establish Token Action HUD integration
      setupTokenActionHUD(DragonbaneActionRules.ID);

      // Reinitialize components that need setup when re-enabled
      DragonbaneActionRules.encumbranceMonitor?.initialize();
      DragonbaneActionRules.yzeIntegration?.initialize();

      DragonbaneUtils.debugLog(
        DragonbaneActionRules.ID,
        "Main",
        `${game.i18n.localize("DRAGONBANE_ACTION_RULES.console.moduleEnabled")}`
      );
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

      if (DragonbaneUtils.isDebugMode(DragonbaneActionRules.ID)) {
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
