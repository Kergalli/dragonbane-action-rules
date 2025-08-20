/**
 * Dragonbane Combat Assistant - Hook Management
 */

import { DragonbaneUtils } from './utils.js';

export class DragonbaneHooks {
    constructor(moduleId) {
        this.moduleId = moduleId;
        this.activeHooks = new Map();
        this.originalMethods = new Map();
        this.callbacks = {};
    }

    /**
     * Enable all hook systems
     */
    enableAll(callbacks, rulesDisplay) {
        this.callbacks = callbacks;

        this.enableChatHook();
        this.enableChatButtonHook(rulesDisplay);
        this.enableMonsterActionPrevention();
        this.enableTokenActionHUD();
        this.enableCharacterSheets();
        this.enableEncumbranceHooks();

        this.debugLog("All hooks enabled");
    }

    /**
     * Disable all hook systems
     */
    disableAll() {
        this.disableChatHook();
        this.disableChatButtonHook();
        this.disableMonsterActionPrevention();
        this.disableTokenActionHUD();
        this.disableCharacterSheets();
        this.disableEncumbranceHooks();

        this.debugLog("All hooks disabled");
    }

    /**
     * Check if hooks are enabled
     */
    isEnabled() {
        return this.activeHooks.size > 0;
    }

    /**
     * Enhanced chat message hook for rules display and YZE integration
     */
    enableChatHook() {
        if (this.activeHooks.has('chat')) return;

        const hookId = Hooks.on('createChatMessage', async (message) => {
            // Call the original rules display callback
            if (this.callbacks.onChatMessage) {
                this.callbacks.onChatMessage(message);
            }

            // Call YZE integration for post-roll action detection
            if (this.callbacks.onChatMessageAction) {
                await this.callbacks.onChatMessageAction(message);
            }
        });

        this.activeHooks.set('chat', hookId);
        this.debugLog("Enhanced chat hook enabled");
    }

    /**
     * Disable chat message hook
     */
    disableChatHook() {
        this.removeHook('chat', 'createChatMessage');
    }

    /**
     * Enable chat button interaction hook
     */
    enableChatButtonHook(rulesDisplay) {
        if (this.activeHooks.has('chatButton')) return;

        const hookId = Hooks.on('renderChatMessage', (message, html, data) => {
            // Only handle our own rules messages
            if (!message.getFlag(this.moduleId, 'dragonbaneRulesMessage')) return;

            // Add click handler for weapon broken buttons
            html.find('.mark-weapon-broken').off('click').on('click', async (event) => {
                event.preventDefault();
                event.stopPropagation();

                const button = event.currentTarget;
                const weaponId = button.dataset.weaponId;
                const actorId = button.dataset.actorId;
                const sceneId = button.dataset.sceneId;
                const tokenId = button.dataset.tokenId;

                if (weaponId && actorId && rulesDisplay) {
                    // Use the passed rulesDisplay instance directly
                    rulesDisplay.markWeaponBroken(weaponId, actorId, sceneId, tokenId);

                    // Disable the button to prevent multiple clicks
                    button.disabled = true;
                    button.style.opacity = '0.5';
                    button.textContent = game.i18n.localize("DRAGONBANE_ACTION_RULES.weaponBroken.buttonTextCompleted");
                } else {
                    console.error(`${this.moduleId} | Missing data for weapon broken button:`, {
                        weaponId, actorId, sceneId, tokenId, rulesDisplay: !!rulesDisplay
                    });
                }
            });
        });

        this.activeHooks.set('chatButton', hookId);
        this.debugLog("Chat button hook enabled");
    }

    /**
     * Disable chat button hook
     */
    disableChatButtonHook() {
        this.removeHook('chatButton', 'renderChatMessage');
    }

    /**
     * Enable Token Action HUD attack interception
     */
    enableTokenActionHUD() {
        if (!game.dragonbane?.rollItem || this.originalMethods.has('rollItem')) return;

        this.originalMethods.set('rollItem', game.dragonbane.rollItem);

        game.dragonbane.rollItem = async (itemName, ...args) => {
            this.debugLog(`Token Action HUD rollItem called: ${itemName}`);

            const selectedToken = canvas.tokens.controlled[0];
            if (selectedToken?.actor) {
                const item = selectedToken.actor.items.find(i => i.name === itemName && i.type === 'weapon');
                if (item) {
                    this.debugLog(`Token Action HUD weapon found: ${item.name}`);

                    const validation = await this.callbacks.performWeaponAttack(itemName, selectedToken.actor);
                    if (!validation.success) {
                        ui.notifications.warn(validation.message);
                        this.debugLog(`Token Action HUD blocked: ${validation.message}`);
                        return null;
                    }

                    this.debugLog(`Token Action HUD validation passed for ${itemName}`);
                }
            }
            return this.originalMethods.get('rollItem').call(this, itemName, ...args);
        };

        this.debugLog("Token Action HUD hook enabled");
    }

    /**
     * Disable Token Action HUD hook
     */
    disableTokenActionHUD() {
        if (this.originalMethods.has('rollItem') && game.dragonbane) {
            game.dragonbane.rollItem = this.originalMethods.get('rollItem');
            this.originalMethods.delete('rollItem');
            this.debugLog("Token Action HUD hook disabled");
        }
    }

    /**
     * Enable character sheet attack interception
     */
    enableCharacterSheets() {
        if (this.activeHooks.has('characterSheet')) return;

        const hookId = Hooks.on('renderActorSheet', (sheet, html, data) => {
            if (sheet.constructor.name === 'DoDCharacterSheet' && !sheet._dragonbaneHooked) {
                this.hookCharacterSheet(sheet, html);
            }
        });

        this.activeHooks.set('characterSheet', hookId);
        this.debugLog("Character sheet hook enabled");
    }

    /**
     * Disable character sheet hooks
     */
    disableCharacterSheets() {
        this.removeHook('characterSheet', 'renderActorSheet');

        // Clean up existing hooked sheets
        Object.values(ui.windows)
            .filter(app => app.constructor.name === 'DoDCharacterSheet' && app._dragonbaneHooked)
            .forEach(app => delete app._dragonbaneHooked);

        this.debugLog("Character sheet hooks disabled");
    }

    /**
     * Hook individual character sheet
     */
    hookCharacterSheet(sheet, html) {
        this.debugLog(`Hooking character sheet for ${sheet.actor.name}`);

        sheet._dragonbaneHooked = true;

        // Store original method
        const originalOnSkillRoll = sheet._onSkillRoll;

        // Capture callbacks in closure to maintain proper this context
        const callbacks = this.callbacks;

        // Override the _onSkillRoll method with validation
        sheet._onSkillRoll = async function (event) {
            const itemId = event.currentTarget.closest(".sheet-table-data").dataset.itemId;
            const item = this.actor.items.get(itemId);

            if (item?.type === 'weapon') {
                DragonbaneUtils.debugLog('dragonbane-action-rules', 'CharacterSheet', `Weapon attack detected: ${item.name}`);

                const validation = await callbacks.performWeaponAttack(item.name, this.actor);
                if (!validation.success) {
                    ui.notifications.warn(validation.message);
                    DragonbaneUtils.debugLog('dragonbane-action-rules', 'CharacterSheet', `Attack blocked: ${validation.message}`);
                    return;
                }

                DragonbaneUtils.debugLog('dragonbane-action-rules', 'CharacterSheet', `Validation passed for ${item.name}`);
            }

            // Proceed with original method
            return originalOnSkillRoll.call(this, event);
        };
    }

    /**
     * Enable encumbrance monitoring hooks
     */
    enableEncumbranceHooks() {
        if (this.activeHooks.has('encumbranceUpdate')) return;

        // Hook for actor updates (needed for stat changes that affect carry capacity)
        const actorUpdateHookId = Hooks.on('updateActor', this.callbacks.onActorUpdate);
        this.activeHooks.set('encumbranceUpdate', actorUpdateHookId);

        // Hook for item updates (needed for item weight changes, worn status, inventory changes)
        const itemUpdateHookId = Hooks.on('updateItem', this.callbacks.onItemUpdate);
        this.activeHooks.set('encumbranceItemUpdate', itemUpdateHookId);

        // Hook for item creation/deletion (needed for when items are added/removed)
        const itemCreateHookId = Hooks.on('createItem', this.callbacks.onItemChange);
        this.activeHooks.set('encumbranceItemCreate', itemCreateHookId);

        const itemDeleteHookId = Hooks.on('deleteItem', this.callbacks.onItemChange);
        this.activeHooks.set('encumbranceItemDelete', itemDeleteHookId);

        const actorDeleteHookId = Hooks.on('deleteActor', this.callbacks.onActorDelete);
        this.activeHooks.set('encumbranceActorDelete', actorDeleteHookId);

        this.debugLog("Encumbrance hooks enabled");
    }

    /**
     * Disable encumbrance monitoring hooks
     */
    disableEncumbranceHooks() {
        this.removeHook('encumbranceUpdate', 'updateActor');
        this.removeHook('encumbranceItemUpdate', 'updateItem');
        this.removeHook('encumbranceItemCreate', 'createItem');
        this.removeHook('encumbranceItemDelete', 'deleteItem');
        this.removeHook('encumbranceActorDelete', 'deleteActor');

        this.debugLog("Encumbrance hooks disabled");
    }

    /**
     * Enable monster action prevention hooks
     */
    enableMonsterActionPrevention() {
        if (this.activeHooks.has('monsterActionPrevention')) return;

        try {
            // Main prevention hook
            const hookId = Hooks.on('preCreateChatMessage', (document, data, options, userId) => {
                // Only process for current user to avoid duplicate dialogs
                if (userId !== game.user.id) return;

                // Check for active bypass
                if (this._bypassActive) {
                    this.debugLog("Bypassing prevention due to active bypass");
                    return; // Allow this message to proceed
                }

                try {
                    // Check if this message contains a Disarm or Parry action
                    const actionMatch = this._getActionMatch(document.content);
                    if (!actionMatch) return;

                    const action = actionMatch[1].toLowerCase();
                    const normalizedAction = this._normalizeAction(action);

                    if (!['disarm', 'parry'].includes(normalizedAction)) return;

                    // Check if targeting a monster - with Forge compatibility
                    if (!window.DragonbaneActionRules?.utils) {
                        console.warn(`${this.moduleId} | DragonbaneActionRules.utils not ready, skipping monster check`);
                        return;
                    }

                    const target = window.DragonbaneActionRules.utils.getCurrentTarget();
                    if (!target || !window.DragonbaneActionRules.utils.isMonsterActor(target)) return;

                    // Prevent the message and show dialog
                    this._handleMonsterActionPrevention(document, normalizedAction, target.name);
                    return false; // Always prevent initial message

                } catch (error) {
                    console.error(`${this.moduleId} | Error in monster action prevention:`, error);
                    // Allow message to proceed on error to avoid breaking gameplay
                    return;
                }
            });

            // Watch for rules messages to clear bypass
            const rulesWatcherId = Hooks.on('createChatMessage', (message) => {
                try {
                    // Only check if bypass is active
                    if (!this._bypassActive || !this._bypassAction) return;

                    // Check if this is a rules message for the action we're bypassing
                    const content = message.content;
                    if (!content) return;

                    // Get localized "Parry Rules" or "Disarm Rules" text
                    const actionKey = this._bypassAction === 'parry' ?
                        'DRAGONBANE_ACTION_RULES.actions.parry' :
                        'DRAGONBANE_ACTION_RULES.actions.disarm';

                    const actionName = game.i18n.localize(actionKey);
                    const rulesText = game.i18n.format('DRAGONBANE_ACTION_RULES.speakers.generic', { action: actionName });

                    // Check if message contains the rules text (in speaker alias or content)
                    const speaker = message.speaker?.alias || '';
                    if (speaker.includes(rulesText) || content.includes(rulesText)) {
                        this.debugLog(`Detected ${this._bypassAction} rules message, clearing bypass`);
                        this._clearBypass();
                    }
                } catch (error) {
                    console.error(`${this.moduleId} | Error in rules watcher:`, error);
                }
            });

            this.activeHooks.set('monsterActionPrevention', hookId);
            this.activeHooks.set('monsterActionRulesWatcher', rulesWatcherId);
            this.debugLog("Monster action prevention hooks enabled");

        } catch (error) {
            console.error(`${this.moduleId} | Failed to enable monster action prevention:`, error);
            ui.notifications.warn("Monster action prevention disabled due to initialization error");
        }
    }

    /**
     * Handle monster action prevention with dialog
     */
    _handleMonsterActionPrevention(document, action, targetName) {
        this._showMonsterActionConfirmation(action, targetName).then(proceed => {
            if (proceed) {
                this.debugLog(`User confirmed ${action} action against monster ${targetName}, proceeding with roll`);

                // Set bypass with the specific action we're waiting for
                this._bypassAction = action; // Store which action we're bypassing for
                this._bypassActive = true;
                this.debugLog(`Monster action bypass activated for ${action}`);

                // Set a fallback timeout (in case rules never appear)
                this._bypassTimeout = setTimeout(() => {
                    if (this._bypassActive) {
                        this._bypassActive = false;
                        this._bypassAction = null;
                        this.debugLog("Monster action bypass cleared by timeout (fallback)");
                    }
                }, 5000); // 5 second fallback just in case

                // Recreate the chat message
                ChatMessage.create(document.toObject()).catch(error => {
                    console.error(`${this.moduleId} | Error recreating chat message:`, error);
                    this._clearBypass();
                });
            } else {
                this.debugLog(`Prevented ${action} action against monster ${targetName}`);
            }
        }).catch(error => {
            console.error(`${this.moduleId} | Error in monster action confirmation:`, error);
        });
    }

    /**
     * Clear the bypass state
     */
    _clearBypass() {
        this._bypassActive = false;
        this._bypassAction = null;
        if (this._bypassTimeout) {
            clearTimeout(this._bypassTimeout);
            this._bypassTimeout = null;
        }
        this.debugLog("Monster action bypass cleared");
    }

    /**
     * Disable monster action prevention hooks
     */
    disableMonsterActionPrevention() {
        this.removeHook('monsterActionPrevention', 'preCreateChatMessage');
        this.removeHook('monsterActionRulesWatcher', 'createChatMessage');
        this._clearBypass(); // Clean up any active bypass
    }

    /**
     * Get action match from message content
     */
    _getActionMatch(content) {
        // Import pattern manager dynamically to avoid circular dependencies
        return window.DragonbaneActionRules?.patternManager?.getActionMatch(content) || null;
    }

    /**
     * Normalize action name for consistent processing
     */
    _normalizeAction(action) {
        const actionLower = action.toLowerCase();

        // Get current localized terms for reverse mapping
        const localizedTerms = {
            parry: (game.i18n.localize("DoD.attackTypes.parry") || "parry").toLowerCase(),
            disarm: (game.i18n.localize("DoD.attackTypes.disarm") || "disarm").toLowerCase()
        };

        // Reverse map localized terms to English keys
        for (const [englishKey, localizedTerm] of Object.entries(localizedTerms)) {
            if (actionLower === localizedTerm) {
                return englishKey;
            }
        }

        return actionLower;
    }

    /**
     * Show confirmation dialog for monster actions
     */
    async _showMonsterActionConfirmation(action, targetName) {
        return new Promise(resolve => {
            let title, content;

            if (action === 'disarm') {
                title = game.i18n.localize("DRAGONBANE_ACTION_RULES.monsterPrevention.disarm.title");
                content = game.i18n.format("DRAGONBANE_ACTION_RULES.monsterPrevention.disarm.content", { targetName });
            } else if (action === 'parry') {
                title = game.i18n.localize("DRAGONBANE_ACTION_RULES.monsterPrevention.parry.title");
                content = game.i18n.format("DRAGONBANE_ACTION_RULES.monsterPrevention.parry.content", { targetName });
            }

            new Dialog({
                title: title,
                content: `<p>${content}</p>`,
                buttons: {
                    proceed: {
                        label: game.i18n.localize("DRAGONBANE_ACTION_RULES.monsterPrevention.proceed"),
                        callback: () => resolve(true)
                    },
                    cancel: {
                        label: game.i18n.localize("DRAGONBANE_ACTION_RULES.monsterPrevention.cancel"),
                        callback: () => resolve(false)
                    }
                },
                default: "cancel",
                close: () => resolve(false)
            }).render(true);
        });
    }

    /**
     * Helper method to remove a hook
     */
    removeHook(name, hookType) {
        if (this.activeHooks.has(name)) {
            Hooks.off(hookType, this.activeHooks.get(name));
            this.activeHooks.delete(name);
            this.debugLog(`${name} hook disabled`);
        }
    }

    debugLog(message) {
        try {
            const debugEnabled = game.settings.get(this.moduleId, 'debugMode') || false;
            if (debugEnabled) {
                console.log(`${this.moduleId} | Hooks: ${message}`);
            }
        } catch (error) {
            // Fallback if settings not ready
            console.log(`${this.moduleId} | Hooks: ${message}`);
        }
    }
}
