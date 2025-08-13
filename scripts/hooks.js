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
    enableAll(callbacks) {
        this.callbacks = callbacks;

        this.enableChatHook();
        this.enableChatButtonHook();
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
    enableChatButtonHook() {
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

                if (weaponId && actorId) {
                    // Get the rules display instance and call markWeaponBroken with all the data
                    import('/modules/dragonbane-action-rules/scripts/main.js').then(({ DragonbaneActionRules }) => {
                        DragonbaneActionRules.rulesDisplay.markWeaponBroken(weaponId, actorId, sceneId, tokenId);
                    });

                    // Disable the button to prevent multiple clicks
                    button.disabled = true;
                    button.style.opacity = '0.5';
                    button.textContent = game.i18n.localize("DRAGONBANE_ACTION_RULES.weaponBroken.buttonTextCompleted");
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

        // Override the _onSkillRoll method
        sheet._onSkillRoll = async function (event) {
            event.preventDefault();

            const itemId = event.currentTarget.closest(".sheet-table-data").dataset.itemId;
            const item = this.actor.items.get(itemId);

            // Only validate weapon left-clicks (attacks)
            if (item?.type === "weapon" && event.type === "click") {

                const validation = await callbacks.performWeaponAttack(item.name, this.actor);
                if (!validation.success) {
                    ui.notifications.warn(validation.message);
                    return; // Stop execution
                }
            }

            // Call the original method (YZE tracking happens via chat detection post-roll)
            return originalOnSkillRoll.call(this, event);
        };

        // Re-bind the event handlers to use our new method
        if (sheet.object.isOwner) {
            html.find(".rollable-skill").off("click contextmenu").on("click contextmenu", sheet._onSkillRoll.bind(sheet));
        } else if (sheet.object.isObserver) {
            html.find(".rollable-skill").off("contextmenu").on("contextmenu", sheet._onSkillRoll.bind(sheet));
        }

        this.debugLog(`Successfully hooked character sheet for ${sheet.actor.name}`);
    }

    /**
     * Enable encumbrance monitoring hooks
     */
    enableEncumbranceHooks() {
        if (this.activeHooks.has('encumbranceUpdate') || !this.callbacks.onActorUpdate) return;

        // Hook for actor updates (main encumbrance changes)
        const actorUpdateHookId = Hooks.on('updateActor', this.callbacks.onActorUpdate);
        this.activeHooks.set('encumbranceUpdate', actorUpdateHookId);

        // Hook for item updates (inventory changes)
        const itemUpdateHookId = Hooks.on('updateItem', this.callbacks.onItemUpdate);
        this.activeHooks.set('encumbranceItemUpdate', itemUpdateHookId);

        // Hook for item creation/deletion (needed for when items are added/removed)
        const itemCreateHookId = Hooks.on('createItem', this.callbacks.onItemChange);
        this.activeHooks.set('encumbranceItemCreate', itemCreateHookId);

        const itemDeleteHookId = Hooks.on('deleteItem', this.callbacks.onItemChange);
        this.activeHooks.set('encumbranceItemDelete', itemDeleteHookId);

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

        this.debugLog("Encumbrance hooks disabled");
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

    /**
     * Debug logging
     */
    debugLog(message) {
        // Import settings dynamically to avoid circular imports
        import('/modules/dragonbane-action-rules/scripts/main.js').then(({ DragonbaneActionRules }) => {
            if (DragonbaneActionRules.settings?.isDebugMode()) {
                console.log(`${this.moduleId} | Hooks: ${message}`);
            }
        });
    }
}
