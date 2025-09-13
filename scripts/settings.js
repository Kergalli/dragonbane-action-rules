/**
 * Dragonbane Combat Assistant - Settings Management
 */

// Settings constants for consistent access across the module
export const SETTINGS = {
  ENABLED: "enabled",
  DELAY: "delay",
  SHOW_PARRY_DURABILITY: "showParryDurability",
  ENFORCE_TARGET_SELECTION: "enforceTargetSelection",
  ENFORCE_RANGE_CHECKING: "enforceRangeChecking",
  ENFORCE_MONSTER_ACTION_PREVENTION: "enforceMonsterActionPrevention",
  // Parry movement settings
  ENABLE_PARRY_MOVEMENT_REMINDERS: "enableParryMovementReminders",
  DEBUG_MODE: "debugMode",
  // Encumbrance settings
  ENABLE_ENCUMBRANCE_MONITORING: "enableEncumbranceMonitoring",
  ENCUMBRANCE_MONITOR_FOLDER: "encumbranceMonitorFolder",
  ENCUMBRANCE_STATUS_EFFECT: "encumbranceStatusEffect",
  ENCUMBRANCE_CHAT_NOTIFICATIONS: "encumbranceChatNotifications",
  // Shove settings
  ENABLE_SHOVE_REMINDERS: "enableShoveReminders",
  // Dodge movement settings
  ENABLE_DODGE_MOVEMENT_REMINDERS: "enableDodgeMovementReminders",
  // YZE integration settings
  ENABLE_YZE_INTEGRATION: "enableYZEIntegration",
  YZE_CUSTOM_EXCLUSIONS: "yzeCustomExclusions",
  // Grudge tracking settings
  ENABLE_GRUDGE_TRACKING: "enableGrudgeTracking",
  ENABLE_SPELL_VALIDATION: "enableSpellValidation",
  EXCLUDED_SPELLS: "excludedSpells",
  ENABLE_SPELL_STATUS_EFFECTS: "enableSpellStatusEffects",
};

/**
 * Register all module settings
 */
export function registerSettings(moduleId) {
  console.log(`${moduleId} | Registering settings`);

  // Main module enable/disable setting with onChange handler
  game.settings.register(moduleId, SETTINGS.ENABLED, {
    name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enabled.name"),
    hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enabled.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: (value) => {
      // Use global reference instead of dynamic import to avoid import issues
      setTimeout(() => {
        try {
          const DragonbaneActionRules = window.DragonbaneActionRules;
          if (DragonbaneActionRules) {
            if (value) {
              DragonbaneActionRules.enableModule();
            } else {
              DragonbaneActionRules.disableModule();
            }
          } else {
            console.warn(
              `${moduleId} | DragonbaneActionRules not available for settings onChange`
            );
          }
        } catch (error) {
          if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
            DoD_Utility.WARNING(
              `Error in enabled setting onChange: ${error.message}`
            );
          }
        }
      }, 100);
    },
  });

  // Debug settings
  game.settings.register(moduleId, SETTINGS.DEBUG_MODE, {
    name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.debugMode.name"),
    hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.debugMode.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  // Delay setting
  game.settings.register(moduleId, SETTINGS.DELAY, {
    name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.delay.name"),
    hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.delay.hint"),
    scope: "world",
    config: true,
    type: Number,
    default: 800,
    range: {
      min: 0,
      max: 5000,
      step: 100,
    },
  });

  // Validation settings
  game.settings.register(moduleId, SETTINGS.SHOW_PARRY_DURABILITY, {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.showParryDurability.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.showParryDurability.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(moduleId, SETTINGS.ENFORCE_TARGET_SELECTION, {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enforceTargetSelection.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enforceTargetSelection.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(moduleId, SETTINGS.ENFORCE_RANGE_CHECKING, {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enforceRangeChecking.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enforceRangeChecking.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(moduleId, SETTINGS.ENFORCE_MONSTER_ACTION_PREVENTION, {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enforceMonsterActionPrevention.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enforceMonsterActionPrevention.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  // Optional rules settings
  game.settings.register(moduleId, SETTINGS.ENABLE_SHOVE_REMINDERS, {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableShoveReminders.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableShoveReminders.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(moduleId, SETTINGS.ENABLE_PARRY_MOVEMENT_REMINDERS, {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableParryMovementReminders.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableParryMovementReminders.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(moduleId, SETTINGS.ENABLE_DODGE_MOVEMENT_REMINDERS, {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableDodgeMovementReminders.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableDodgeMovementReminders.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  // Encumbrance monitoring settings with onChange handlers
  game.settings.register(moduleId, SETTINGS.ENABLE_ENCUMBRANCE_MONITORING, {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableEncumbranceMonitoring.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableEncumbranceMonitoring.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: (value) => {
      setTimeout(() => {
        try {
          const DragonbaneActionRules = window.DragonbaneActionRules;
          if (DragonbaneActionRules?.encumbranceMonitor) {
            // Call appropriate method based on setting
            DragonbaneActionRules.encumbranceMonitor.initialize(); // or other method
          }
        } catch (error) {
          if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
            DoD_Utility.WARNING(
              `Error in encumbrance onChange: ${error.message}`
            );
          }
        }
      }, 100);
    },
  });

  game.settings.register(moduleId, SETTINGS.ENCUMBRANCE_MONITOR_FOLDER, {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.encumbranceMonitorFolder.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.encumbranceMonitorFolder.hint"
    ),
    scope: "world",
    config: true,
    type: String,
    default: "Party",
    onChange: () => {
      setTimeout(() => {
        try {
          const DragonbaneActionRules = window.DragonbaneActionRules;
          if (DragonbaneActionRules?.encumbranceMonitor) {
            // Call appropriate method based on setting
            DragonbaneActionRules.encumbranceMonitor.initializePreviousStates();
          }
        } catch (error) {
          if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
            DoD_Utility.WARNING(
              `Error in encumbrance folder onChange: ${error.message}`
            );
          }
        }
      }, 100);
    },
  });

  game.settings.register(moduleId, SETTINGS.ENCUMBRANCE_STATUS_EFFECT, {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.encumbranceStatusEffect.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.encumbranceStatusEffect.hint"
    ),
    scope: "world",
    config: true,
    type: String,
    default: "", // Will be set to localized default when first accessed
    onChange: () => {
      setTimeout(() => {
        try {
          const DragonbaneActionRules = window.DragonbaneActionRules;
          if (DragonbaneActionRules?.encumbranceMonitor) {
            // Call appropriate method based on setting
            DragonbaneActionRules.encumbranceMonitor.ensureStatusEffectExists();
          }
        } catch (error) {
          if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
            DoD_Utility.WARNING(
              `Error in encumbrance status onChange: ${error.message}`
            );
          }
        }
      }, 100);
    },
  });

  game.settings.register(moduleId, SETTINGS.ENCUMBRANCE_CHAT_NOTIFICATIONS, {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.encumbranceChatNotifications.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.encumbranceChatNotifications.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  // YZE integration settings with onChange handlers
  game.settings.register(moduleId, SETTINGS.ENABLE_YZE_INTEGRATION, {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableYZEIntegration.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableYZEIntegration.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: (value) => {
      // Use global reference instead of dynamic import to avoid import issues
      setTimeout(() => {
        try {
          const DragonbaneActionRules = window.DragonbaneActionRules;
          if (DragonbaneActionRules && value) {
            DragonbaneActionRules.yzeIntegration?.initialize();
          }
        } catch (error) {
          if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
            DoD_Utility.WARNING(
              `Error in YZE integration onChange: ${error.message}`
            );
          }
        }
      }, 100);
    },
  });

  game.settings.register(moduleId, SETTINGS.YZE_CUSTOM_EXCLUSIONS, {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.yzeCustomExclusions.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.yzeCustomExclusions.hint"
    ),
    scope: "world",
    config: true,
    type: String,
    default: "",
    onChange: () => {
      setTimeout(() => {
        try {
          const DragonbaneActionRules = window.DragonbaneActionRules;
          if (DragonbaneActionRules?.patternManager?.refreshPatterns) {
            DragonbaneActionRules.patternManager.refreshPatterns();
          }
        } catch (error) {
          if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
            DoD_Utility.WARNING(`Error refreshing patterns: ${error.message}`);
          }
        }
      }, 100);
    },
  });

  // Grudge tracking settings
  game.settings.register(moduleId, SETTINGS.ENABLE_GRUDGE_TRACKING, {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableGrudgeTracking.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableGrudgeTracking.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  // Grudge Setup Button
  game.settings.registerMenu(moduleId, "setupGrudgeFolders", {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.setupGrudgeFolders.name"
    ),
    label: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.setupGrudgeFolders.label"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.setupGrudgeFolders.hint"
    ),
    icon: "fas fa-folder-plus",
    type: SetupGrudgeFoldersDialog,
    restricted: true,
  });

  // Spell settings
  game.settings.register(moduleId, SETTINGS.ENABLE_SPELL_VALIDATION, {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableSpellValidation.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableSpellValidation.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(moduleId, "excludedSpells", {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.excludedSpells.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.excludedSpells.hint"
    ),
    scope: "world",
    config: true,
    type: String,
    default: "",
  });

  game.settings.register(moduleId, SETTINGS.ENABLE_SPELL_STATUS_EFFECTS, {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableSpellStatusEffects.name"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableSpellStatusEffects.hint"
    ),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  // AA Support buttons
  game.settings.registerMenu(moduleId, "enableAASupport", {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableAASupport.name"
    ),
    label: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableAASupport.label"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.enableAASupport.hint"
    ),
    icon: "fas fa-magic",
    type: EnableAADialog,
    restricted: true,
  });

  game.settings.registerMenu(moduleId, "disableAASupport", {
    name: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.disableAASupport.name"
    ),
    label: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.disableAASupport.label"
    ),
    hint: game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.settings.disableAASupport.hint"
    ),
    icon: "fas fa-undo",
    type: DisableAADialog,
    restricted: true,
  });

  console.log(`${moduleId} | Settings registered`);
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(moduleId) {
  return game.settings.get(moduleId, SETTINGS.DEBUG_MODE);
}

/**
 * Helper function to get setting value (for backward compatibility)
 */
export function getSetting(moduleId, settingName) {
  try {
    return game.settings.get(moduleId, settingName);
  } catch (error) {
    console.warn(`Setting ${settingName} not found, using default`);
    return undefined;
  }
}

// Dialog class for setup grudge folders
class SetupGrudgeFoldersDialog extends FormApplication {
  render(force, options) {
    this.showDialog();
    return this;
  }

  async showDialog() {
    return new Dialog({
      title: game.i18n.localize(
        "DRAGONBANE_ACTION_RULES.dialogs.setupGrudgeFolders.title"
      ),
      content: `
        <div style="margin-bottom: 1rem;">
          <p>${game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.dialogs.setupGrudgeFolders.content"
          )}</p>
          <p style="margin-top: 10px; font-style: italic;">
            ${game.i18n.localize(
              "DRAGONBANE_ACTION_RULES.dialogs.setupGrudgeFolders.info"
            )}
          </p>
        </div>
      `,
      buttons: {
        setup: {
          label: game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.dialogs.setupGrudgeFolders.setupButton"
          ),
          callback: async () => {
            if (window.DragonbaneActionRules?.grudgeTracker) {
              const count =
                await window.DragonbaneActionRules.grudgeTracker.setupAllGrudgeFolders();
              ui.notifications.info(
                game.i18n.format(
                  "DRAGONBANE_ACTION_RULES.grudgeTracker.setupComplete",
                  { count: count }
                )
              );
            } else {
              ui.notifications.error("Grudge tracker not initialized");
            }
          },
        },
        cancel: {
          label: game.i18n.localize("Cancel"),
        },
      },
      default: "setup",
    }).render(true);
  }
}

// Dialog classes for AA Support
class EnableAADialog extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      title: "Enable Automated Animations Support",
      id: "enable-aa-support",
      width: 400,
      closeOnSubmit: true,
    });
  }

  render(force, options) {
    this.showDialog();
    return this;
  }

  async showDialog() {
    return new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.dialogs.enableAA.title"
        ),
        content: `
          <div style="margin-bottom: 1rem;">
            <p>${game.i18n.localize(
              "DRAGONBANE_ACTION_RULES.dialogs.enableAA.content"
            )}</p>
            <div style="background: #ffe6e6; border: 1px solid #ff9999; padding: 10px; margin: 10px 0; border-radius: 4px;">
              <i class="fas fa-exclamation-triangle" style="color: #cc0000; margin-right: 8px;"></i>
              <strong>${game.i18n.localize(
                "DRAGONBANE_ACTION_RULES.dialogs.enableAA.warningLabel"
              )}</strong> ${game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.dialogs.enableAA.warning"
        )}
            </div>
          </div>
        `,
        buttons: {
          enable: {
            label: game.i18n.localize(
              "DRAGONBANE_ACTION_RULES.dialogs.enableAA.enableButton"
            ),
            callback: async () => {
              if (globalThis.enhanceAllNonDamageSpells) {
                await globalThis.enhanceAllNonDamageSpells();
                ui.notifications.info(
                  "Automated Animations support enabled for all spells!"
                );
              } else {
                ui.notifications.error(
                  "Enhancement function not available. Please refresh and try again."
                );
              }
            },
          },
          cancel: {
            label: game.i18n.localize("Cancel"),
          },
        },
        default: "cancel",
      }).render(true);
      resolve();
    });
  }
}

class DisableAADialog extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      title: "Disable Automated Animations Support",
      id: "disable-aa-support",
      width: 400,
      closeOnSubmit: true,
    });
  }

  render(force, options) {
    this.showDialog();
    return this;
  }

  async showDialog() {
    return new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.dialogs.disableAA.title"
        ),
        content: `
          <div style="margin-bottom: 1rem;">
            <p>${game.i18n.localize(
              "DRAGONBANE_ACTION_RULES.dialogs.disableAA.content"
            )}</p>
            <div style="background: #fff3cd; border: 1px solid #ffeeba; padding: 10px; margin: 10px 0; border-radius: 4px;">
              <i class="fas fa-info-circle" style="color: #856404; margin-right: 8px;"></i>
              ${game.i18n.localize(
                "DRAGONBANE_ACTION_RULES.dialogs.disableAA.info"
              )}
            </div>
          </div>
        `,
        buttons: {
          disable: {
            label: game.i18n.localize(
              "DRAGONBANE_ACTION_RULES.dialogs.disableAA.disableButton"
            ),
            callback: async () => {
              if (globalThis.disableAllSpellEnhancements) {
                await globalThis.disableAllSpellEnhancements();
                ui.notifications.info(
                  "Automated Animations support disabled for all spells."
                );
              } else {
                ui.notifications.error(
                  "Disable function not available. Please refresh and try again."
                );
              }
            },
          },
          cancel: {
            label: game.i18n.localize("Cancel"),
          },
        },
        default: "cancel",
      }).render(true);
      resolve();
    });
  }
}
