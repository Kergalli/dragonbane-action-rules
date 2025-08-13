/**
 * Dragonbane Combat Assistant - Settings Management
 * Handles all module settings registration and access
 */

export class DragonbaneSettings {
    static SETTINGS = {
        ENABLED: 'enabled',
        DELAY: 'delay',
        SHOW_PARRY_DURABILITY: 'showParryDurability',
        ENFORCE_TARGET_SELECTION: 'enforceTargetSelection',
        ENFORCE_RANGE_CHECKING: 'enforceRangeChecking',
        // Parry movement settings
        ENABLE_PARRY_MOVEMENT_REMINDERS: 'enableParryMovementReminders',
        DEBUG_MODE: 'debugMode',
        // Encumbrance settings
        ENABLE_ENCUMBRANCE_MONITORING: 'enableEncumbranceMonitoring',
        ENCUMBRANCE_MONITOR_FOLDER: 'encumbranceMonitorFolder',
        ENCUMBRANCE_STATUS_EFFECT: 'encumbranceStatusEffect',
        ENCUMBRANCE_CHAT_NOTIFICATIONS: 'encumbranceChatNotifications',
        // Shove settings
        ENABLE_SHOVE_REMINDERS: 'enableShoveReminders',
        // Dodge movement settings
        ENABLE_DODGE_MOVEMENT_REMINDERS: 'enableDodgeMovementReminders',
        // YZE integration settings
        ENABLE_YZE_INTEGRATION: 'enableYZEIntegration',
        YZE_CUSTOM_EXCLUSIONS: 'yzeCustomExclusions'
    };

    constructor(moduleId) {
        this.moduleId = moduleId;
    }

    /**
     * Register all module settings
     */
    register() {
        this.registerMainSettings();
        this.registerValidationSettings();
        this.registerDisplaySettings();
        this.registerOptionalRulesSettings();
        this.registerEncumbranceSettings();
        this.registerYZEIntegrationSettings();
        this.registerDebugSettings();
    }

    /**
     * Register main module settings
     */
    registerMainSettings() {
        game.settings.register(this.moduleId, DragonbaneSettings.SETTINGS.ENABLED, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enabled.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enabled.hint"),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true,
            onChange: (value) => {
                // Import main class dynamically to avoid circular imports
                import('/modules/dragonbane-action-rules/scripts/main.js').then(({ DragonbaneActionRules }) => {
                    value ? DragonbaneActionRules.enableModule() : DragonbaneActionRules.disableModule();
                });
            }
        });
    }

    /**
     * Register validation-related settings
     */
    registerValidationSettings() {
        game.settings.register(this.moduleId, DragonbaneSettings.SETTINGS.ENFORCE_TARGET_SELECTION, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enforceTargetSelection.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enforceTargetSelection.hint"),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.register(this.moduleId, DragonbaneSettings.SETTINGS.ENFORCE_RANGE_CHECKING, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enforceRangeChecking.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enforceRangeChecking.hint"),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });
    }

    /**
     * Register display-related settings
     */
    registerDisplaySettings() {
        game.settings.register(this.moduleId, DragonbaneSettings.SETTINGS.DELAY, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.delay.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.delay.hint"),
            scope: 'world',
            config: true,
            type: Number,
            default: 3000,
            range: { min: 0, max: 10000, step: 500 }
        });

        game.settings.register(this.moduleId, DragonbaneSettings.SETTINGS.SHOW_PARRY_DURABILITY, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.showParryDurability.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.showParryDurability.hint"),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });
    }

    /**
     * Register optional rules settings
     */
    registerOptionalRulesSettings() {
        game.settings.register(this.moduleId, DragonbaneSettings.SETTINGS.ENABLE_SHOVE_REMINDERS, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enableShoveReminders.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enableShoveReminders.hint"),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.register(this.moduleId, DragonbaneSettings.SETTINGS.ENABLE_PARRY_MOVEMENT_REMINDERS, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enableParryMovementReminders.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enableParryMovementReminders.hint"),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.register(this.moduleId, DragonbaneSettings.SETTINGS.ENABLE_DODGE_MOVEMENT_REMINDERS, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enableDodgeMovementReminders.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enableDodgeMovementReminders.hint"),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });
    }

    /**
     * Register encumbrance monitoring settings
     */
    registerEncumbranceSettings() {
        game.settings.register(this.moduleId, DragonbaneSettings.SETTINGS.ENABLE_ENCUMBRANCE_MONITORING, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enableEncumbranceMonitoring.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enableEncumbranceMonitoring.hint"),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true,
            onChange: (value) => {
                // Import main class dynamically to avoid circular imports
                import('/modules/dragonbane-action-rules/scripts/main.js').then(({ DragonbaneActionRules }) => {
                    if (value) {
                        DragonbaneActionRules.encumbranceMonitor?.initialize();
                    }
                });
            }
        });

        game.settings.register(this.moduleId, DragonbaneSettings.SETTINGS.ENCUMBRANCE_MONITOR_FOLDER, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.encumbranceMonitorFolder.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.encumbranceMonitorFolder.hint"),
            scope: 'world',
            config: true,
            type: String,
            default: 'Party',
            onChange: () => {
                // Refresh monitored actors when folder changes
                import('/modules/dragonbane-action-rules/scripts/main.js').then(({ DragonbaneActionRules }) => {
                    DragonbaneActionRules.encumbranceMonitor?.initializePreviousStates();
                });
            }
        });

        game.settings.register(this.moduleId, DragonbaneSettings.SETTINGS.ENCUMBRANCE_STATUS_EFFECT, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.encumbranceStatusEffect.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.encumbranceStatusEffect.hint"),
            scope: 'world',
            config: true,
            type: String,
            default: 'Encumbered',
            onChange: () => {
                // Ensure the new status effect exists when setting changes
                import('/modules/dragonbane-action-rules/scripts/main.js').then(({ DragonbaneActionRules }) => {
                    DragonbaneActionRules.encumbranceMonitor?.ensureStatusEffectExists();
                });
            }
        });

        game.settings.register(this.moduleId, DragonbaneSettings.SETTINGS.ENCUMBRANCE_CHAT_NOTIFICATIONS, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.encumbranceChatNotifications.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.encumbranceChatNotifications.hint"),
            scope: 'world',
            config: true,
            type: Boolean,
            default: false
        });
    }

    /**
     * Register YZE integration settings
     */
    registerYZEIntegrationSettings() {
        game.settings.register(this.moduleId, DragonbaneSettings.SETTINGS.ENABLE_YZE_INTEGRATION, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enableYZEIntegration.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.enableYZEIntegration.hint"),
            scope: 'world',
            config: true,
            type: Boolean,
            default: true,
            onChange: (value) => {
                // Import main class dynamically to avoid circular imports
                import('/modules/dragonbane-action-rules/scripts/main.js').then(({ DragonbaneActionRules }) => {
                    if (value) {
                        DragonbaneActionRules.yzeIntegration?.initialize();
                    }
                });
            }
        });

        game.settings.register(this.moduleId, DragonbaneSettings.SETTINGS.YZE_CUSTOM_EXCLUSIONS, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.yzeCustomExclusions.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.yzeCustomExclusions.hint"),
            scope: 'world',
            config: true,
            type: String,
            default: "",
            onChange: () => {
                // Refresh patterns when exclusions change
                import('/modules/dragonbane-action-rules/scripts/main.js').then(({ DragonbaneActionRules }) => {
                    DragonbaneActionRules.patternManager?.refreshPatterns();
                });
            }
        });
    }

    /**
     * Register debug settings
     */
    registerDebugSettings() {
        game.settings.register(this.moduleId, DragonbaneSettings.SETTINGS.DEBUG_MODE, {
            name: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.debugMode.name"),
            hint: game.i18n.localize("DRAGONBANE_ACTION_RULES.settings.debugMode.hint"),
            scope: 'world',
            config: true,
            type: Boolean,
            default: false
        });
    }

    /**
     * Get setting value with fallback
     */
    get(setting, fallback = null) {
        try {
            return game.settings.get(this.moduleId, setting);
        } catch (error) {
            console.warn(`${this.moduleId} | Failed to get setting ${setting}:`, error);
            return fallback;
        }
    }

    /**
     * Convenience methods for common settings (only the ones actually used)
     */
    isEnabled() {
        return this.get(DragonbaneSettings.SETTINGS.ENABLED, true);
    }

    isDebugMode() {
        return this.get(DragonbaneSettings.SETTINGS.DEBUG_MODE, false);
    }

    isEncumbranceMonitoringEnabled() {
        return this.get(DragonbaneSettings.SETTINGS.ENABLE_ENCUMBRANCE_MONITORING, true);
    }

    isYZEIntegrationEnabled() {
        return this.get(DragonbaneSettings.SETTINGS.ENABLE_YZE_INTEGRATION, true);
    }
}
