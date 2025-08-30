/**
 * Dragonbane Combat Assistant - Settings Management
 * Simplified settings registration aligned with core Dragonbane system patterns
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
};

/**
 * Register all module settings using core Dragonbane system pattern
 * @param {string} moduleId - The module ID for settings registration
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
      // Import main class dynamically to avoid circular imports
      import("/modules/dragonbane-action-rules/scripts/main.js").then(
        ({ DragonbaneActionRules }) => {
          value
            ? DragonbaneActionRules.enableModule()
            : DragonbaneActionRules.disableModule();
        }
      );
    },
  });

  // Validation settings
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
    name: "Enforce Monster Action Prevention",
    hint: "Show confirmation dialogs when attempting Parry or Disarm actions against monsters",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  // Display settings
  game.settings.register(moduleId, SETTINGS.DELAY, {
    name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.delay.name"),
    hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.delay.hint"),
    scope: "world",
    config: true,
    type: Number,
    default: 3000,
    range: { min: 0, max: 10000, step: 500 },
  });

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
      // Import main class dynamically to avoid circular imports
      import("/modules/dragonbane-action-rules/scripts/main.js").then(
        ({ DragonbaneActionRules }) => {
          if (value) {
            DragonbaneActionRules.encumbranceMonitor?.initialize();
          }
        }
      );
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
      // Refresh monitored actors when folder changes
      import("/modules/dragonbane-action-rules/scripts/main.js").then(
        ({ DragonbaneActionRules }) => {
          DragonbaneActionRules.encumbranceMonitor?.initializePreviousStates();
        }
      );
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
      // Ensure the new status effect exists when setting changes
      import("/modules/dragonbane-action-rules/scripts/main.js").then(
        ({ DragonbaneActionRules }) => {
          DragonbaneActionRules.encumbranceMonitor?.ensureStatusEffectExists();
        }
      );
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
      // Import main class dynamically to avoid circular imports
      import("/modules/dragonbane-action-rules/scripts/main.js").then(
        ({ DragonbaneActionRules }) => {
          if (value) {
            DragonbaneActionRules.yzeIntegration?.initialize();
          }
        }
      );
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
      // Refresh patterns when exclusions change
      import("/modules/dragonbane-action-rules/scripts/main.js").then(
        ({ DragonbaneActionRules }) => {
          DragonbaneActionRules.patternManager?.refreshPatterns();
        }
      );
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

  // Debug settings
  game.settings.register(moduleId, SETTINGS.DEBUG_MODE, {
    name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.debugMode.name"),
    hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.debugMode.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });
}

/**
 * Utility function to get setting value with fallback
 * @param {string} moduleId - The module ID
 * @param {string} setting - The setting key
 * @param {*} fallback - Fallback value if setting fails to load
 * @returns {*} The setting value or fallback
 */
export function getSetting(moduleId, setting, fallback = null) {
  try {
    return game.settings.get(moduleId, setting);
  } catch (error) {
    // CHANGED: Use DoD_Utility.WARNING instead of console.warn
    if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
      DoD_Utility.WARNING(`Failed to get setting ${setting}: ${error.message}`);
    } else {
      console.warn(`${moduleId} | Failed to get setting ${setting}:`, error);
    }
    return fallback;
  }
}

/**
 * Convenience functions for common settings checks
 * These maintain the same API as the old class methods for easier migration
 * @param {string} moduleId - The module ID
 */
export function isModuleEnabled(moduleId) {
  return getSetting(moduleId, SETTINGS.ENABLED, true);
}

export function isDebugMode(moduleId) {
  return getSetting(moduleId, SETTINGS.DEBUG_MODE, false);
}

export function isEncumbranceMonitoringEnabled(moduleId) {
  return getSetting(moduleId, SETTINGS.ENABLE_ENCUMBRANCE_MONITORING, true);
}

export function isYZEIntegrationEnabled(moduleId) {
  return getSetting(moduleId, SETTINGS.ENABLE_YZE_INTEGRATION, true);
}
