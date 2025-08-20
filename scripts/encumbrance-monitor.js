/**
 * Dragonbane Combat Assistant - Encumbrance Monitoring
 * Event-driven encumbrance monitoring with configurable status effects
 */

import { DragonbaneUtils } from './utils.js';

export class DragonbaneEncumbranceMonitor {
    constructor(moduleId) {
        this.moduleId = moduleId;
        this.previousStates = new Map();
    }

    /**
     * Initialize encumbrance monitoring if enabled
     */
    initialize() {
        if (this.getSetting('enableEncumbranceMonitoring', true)) {
            this.ensureStatusEffectExists();
            this.initializePreviousStates();
            this.debugLog("Encumbrance monitoring initialized");
        }
    }

    /**
     * Handle actor updates - main entry point for encumbrance changes
     */
    async onActorUpdate(actor, updateData, options, userId) {
        try {
            // Only process if encumbrance monitoring is enabled
            if (!this.getSetting('enableEncumbranceMonitoring', true)) return;

            // Only monitor characters in the configured folder
            if (!this.shouldMonitorActor(actor)) return;

            // Check if encumbrance-related data changed
            if (!this.isEncumbranceRelevant(updateData)) return;

            // Check encumbrance immediately
            this.checkActorEncumbrance(actor);

        } catch (error) {
            console.error(`${this.moduleId} | Error in actor update:`, error);
        }
    }

    /**
     * Handle item updates that affect encumbrance
     */
    async onItemUpdate(item, updateData, options, userId) {
        try {
            if (!this.getSetting('enableEncumbranceMonitoring', true)) return;

            const actor = item.parent;
            if (!actor || !this.shouldMonitorActor(actor)) return;

            // Check if the update affects encumbrance (quantity, equipped status, etc.)
            if (this.isItemEncumbranceRelevant(updateData)) {
                this.checkActorEncumbrance(actor);
            }

        } catch (error) {
            console.error(`${this.moduleId} | Error in item update:`, error);
        }
    }

    /**
     * Handle item creation/deletion
     */
    async onItemChange(item, options, userId) {
        try {
            if (!this.getSetting('enableEncumbranceMonitoring', true)) return;

            const actor = item.parent;
            if (!actor || !this.shouldMonitorActor(actor)) return;

            this.checkActorEncumbrance(actor);

        } catch (error) {
            console.error(`${this.moduleId} | Error in item change:`, error);
        }
    }

    /**
     * Handle actor deletion to prevent memory leaks
     */
    onActorDelete(actor, options, userId) {
        // Clean up the cached state for deleted actor
        if (this.previousStates.has(actor.id)) {
            this.previousStates.delete(actor.id);
            this.debugLog(`Cleaned up cached state for deleted actor: ${actor.name}`);
        }
    }

    /**
     * Check if actor should be monitored based on settings
     */
    shouldMonitorActor(actor) {
        if (!actor || actor.type !== 'character') return false;

        const monitoredFolder = this.getSetting('encumbranceMonitorFolder', 'Party');

        // If no folder specified, monitor all characters
        if (!monitoredFolder) return true;

        return actor.folder?.name === monitoredFolder;
    }

    /**
     * Check if update data is relevant to encumbrance
     */
    isEncumbranceRelevant(updateData) {
        return updateData.system?.encumbrance !== undefined ||
            updateData.system?.maxEncumbrance !== undefined ||
            updateData.system?.abilities?.str !== undefined; // STR changes affect max encumbrance
    }

    /**
     * Check if item update affects encumbrance
     */
    isItemEncumbranceRelevant(updateData) {
        return updateData.system?.quantity !== undefined ||
            updateData.system?.worn !== undefined ||
            updateData.system?.equipped !== undefined ||
            updateData.system?.weight !== undefined;
    }

    /**
     * Check encumbrance for a specific actor
     */
    async checkActorEncumbrance(actor) {
        try {
            const currentEnc = actor.system?.encumbrance?.value || 0;
            const maxEnc = actor.system?.maxEncumbrance?.value || 0;
            const isOverEncumbered = currentEnc > maxEnc;

            // Get previous state
            const wasOverEncumbered = this.previousStates.get(actor.id) || false;

            // Update cache
            this.previousStates.set(actor.id, isOverEncumbered);

            // Only act if state changed
            if (isOverEncumbered !== wasOverEncumbered) {
                await this.handleEncumbranceStateChange(actor, isOverEncumbered, currentEnc, maxEnc);
            }

        } catch (error) {
            console.error(`${this.moduleId} | Error checking encumbrance for ${actor.name}:`, error);
        }
    }

    /**
     * Ensure the configured status effect exists in the game (using centralized utility)
     */
    ensureStatusEffectExists() {
        const statusEffectName = this.getSetting('encumbranceStatusEffect', 'Encumbered');

        if (DragonbaneUtils.ensureStatusEffectExists(statusEffectName, "icons/svg/anchor.svg")) {
            this.debugLog(`Status effect "${statusEffectName}" ensured`);
        } else {
            console.warn(`${this.moduleId} | Failed to ensure status effect: ${statusEffectName}`);
        }
    }

    /**
     * Handle encumbrance state change
     */
    async handleEncumbranceStateChange(actor, isOverEncumbered, currentEnc, maxEnc) {
        // Apply/remove status effect
        await this.toggleEncumbranceStatusEffect(actor, isOverEncumbered);

        // Show notification
        this.showEncumbranceNotification(actor, isOverEncumbered, currentEnc, maxEnc);

        // Optional: Create chat message for more visibility
        if (this.getSetting('encumbranceChatNotifications', false)) {
            await this.createEncumbranceChatMessage(actor, isOverEncumbered, currentEnc, maxEnc);
        }
    }

    /**
     * Toggle encumbrance status effect (using centralized utilities)
     */
    async toggleEncumbranceStatusEffect(actor, isOverEncumbered) {
        const statusEffectName = this.getSetting('encumbranceStatusEffect', 'Encumbered');

        // Check current state using centralized utility
        const hasEffect = DragonbaneUtils.hasStatusEffect(actor, statusEffectName);

        // Toggle if needed using centralized utility
        if (isOverEncumbered && !hasEffect) {
            const success = await DragonbaneUtils.toggleStatusEffect(actor, statusEffectName, true);
            if (success) {
                this.debugLog(`Applied ${statusEffectName} to ${actor.name}`);
            }
        } else if (!isOverEncumbered && hasEffect) {
            const success = await DragonbaneUtils.toggleStatusEffect(actor, statusEffectName, false);
            if (success) {
                this.debugLog(`Removed ${statusEffectName} from ${actor.name}`);
            }
        }
    }

    /**
     * Initialize previous states for all monitored actors
     */
    initializePreviousStates() {
        this.previousStates.clear();

        const monitoredFolder = this.getSetting('encumbranceMonitorFolder', 'Party');
        const actors = game.actors.filter(actor => this.shouldMonitorActor(actor));

        this.debugLog(`Monitoring ${actors.length} characters in folder: ${monitoredFolder || 'All'}`);

        // Initialize cache with current over-encumbered status
        actors.forEach(actor => {
            const currentEnc = actor.system?.encumbrance?.value || 0;
            const maxEnc = actor.system?.maxEncumbrance?.value || 0;
            const isOverEncumbered = currentEnc > maxEnc;

            this.previousStates.set(actor.id, isOverEncumbered);
        });
    }

    /**
     * Show encumbrance notification
     */
    showEncumbranceNotification(actor, isOverEncumbered, currentEnc, maxEnc) {
        const messageKey = isOverEncumbered ?
            'DRAGONBANE_ACTION_RULES.encumbrance.nowOverEncumbered' :
            'DRAGONBANE_ACTION_RULES.encumbrance.noLongerOverEncumbered';

        const message = game.i18n.format(messageKey, {
            actorName: actor.name,
            currentEnc: currentEnc,
            maxEnc: maxEnc
        });

        // Use different notification types for visibility
        if (isOverEncumbered) {
            ui.notifications.warn(message, { permanent: false });
        } else {
            ui.notifications.info(message, { permanent: false });
        }
    }

    /**
     * Create chat message for encumbrance change (optional feature)
     */
    async createEncumbranceChatMessage(actor, isOverEncumbered, currentEnc, maxEnc) {
        try {
            const messageKey = isOverEncumbered ?
                'DRAGONBANE_ACTION_RULES.encumbrance.chatOverEncumbered' :
                'DRAGONBANE_ACTION_RULES.encumbrance.chatNoLongerOverEncumbered';

            let content = `<div class="dragonbane-encumbrance-notice">
                <strong>${game.i18n.format(messageKey, { actorName: actor.name })}</strong>
                <div class="encumbrance-details">
                    ${game.i18n.format('DRAGONBANE_ACTION_RULES.encumbrance.carryingItems', {
                currentEnc: currentEnc,
                maxEnc: maxEnc
            })}
                </div>`;

            // Add rule reminder for over-encumbered
            if (isOverEncumbered) {
                content += `<div class="encumbrance-rule">
                    <em>${game.i18n.localize('DRAGONBANE_ACTION_RULES.encumbrance.strRollReminder')}</em>
                </div>`;
            }

            content += `</div>`;

            await ChatMessage.create({
                content: content,
                speaker: { alias: game.i18n.localize('DRAGONBANE_ACTION_RULES.encumbrance.systemMessage') },
                flags: {
                    [this.moduleId]: {
                        encumbranceNotice: true
                    }
                }
            });

        } catch (error) {
            console.error(`${this.moduleId} | Error creating chat message:`, error);
        }
    }

    /**
     * Get setting value with fallback
     */
    getSetting(settingName, fallback) {
        return DragonbaneUtils.getSetting(this.moduleId, settingName, fallback);
    }

    /**
     * Debug logging
     */
    debugLog(message) {
        DragonbaneUtils.debugLog(this.moduleId, 'EncumbranceMonitor', message);
    }
}
