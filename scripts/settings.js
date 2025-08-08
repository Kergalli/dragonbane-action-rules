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
        ENABLE_DODGE_MOVEMENT_REMINDERS: 'enableDodgeMovementReminders'
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
                import('./main.js').then(({ DragonbaneActionRules }) => {
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
                import('./main.js').then(({ DragonbaneActionRules }) => {
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
                import('./main.js').then(({ DragonbaneActionRules }) => {
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
                import('./main.js').then(({ DragonbaneActionRules }) => {
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
     * Convenience methods for common settings
     */
    isEnabled() {
        return this.get(DragonbaneSettings.SETTINGS.ENABLED, true);
    }

    isDebugMode() {
        return this.get(DragonbaneSettings.SETTINGS.DEBUG_MODE, false);
    }

    getDisplayDelay() {
        return this.get(DragonbaneSettings.SETTINGS.DELAY, 3000);
    }

    shouldShowParryDurability() {
        return this.get(DragonbaneSettings.SETTINGS.SHOW_PARRY_DURABILITY, true);
    }

    shouldShowParryMovementReminders() {
        return this.get(DragonbaneSettings.SETTINGS.ENABLE_PARRY_MOVEMENT_REMINDERS, true);
    }

    shouldEnforceTargetSelection() {
        return this.get(DragonbaneSettings.SETTINGS.ENFORCE_TARGET_SELECTION, true);
    }

    shouldEnforceRangeChecking() {
        return this.get(DragonbaneSettings.SETTINGS.ENFORCE_RANGE_CHECKING, true);
    }

    // Shove convenience methods
    shouldShowShoveReminders() {
        return this.get(DragonbaneSettings.SETTINGS.ENABLE_SHOVE_REMINDERS, true);
    }

    // Dodge movement convenience methods
    shouldShowDodgeMovementReminders() {
        return this.get(DragonbaneSettings.SETTINGS.ENABLE_DODGE_MOVEMENT_REMINDERS, true);
    }

    // Encumbrance convenience methods
    isEncumbranceMonitoringEnabled() {
        return this.get(DragonbaneSettings.SETTINGS.ENABLE_ENCUMBRANCE_MONITORING, true);
    }

    getEncumbranceMonitorFolder() {
        return this.get(DragonbaneSettings.SETTINGS.ENCUMBRANCE_MONITOR_FOLDER, 'Party');
    }

    getEncumbranceStatusEffect() {
        return this.get(DragonbaneSettings.SETTINGS.ENCUMBRANCE_STATUS_EFFECT, 'Encumbered');
    }

    shouldShowEncumbranceChatNotifications() {
        return this.get(DragonbaneSettings.SETTINGS.ENCUMBRANCE_CHAT_NOTIFICATIONS, false);
    }
}
