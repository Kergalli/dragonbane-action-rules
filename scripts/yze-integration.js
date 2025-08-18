/**
 * Dragonbane Combat Assistant - Year Zero Engine Integration
 * Handles integration with YZE Combat module for single action tracking
 */

import { DragonbaneUtils } from './utils.js';

export class DragonbaneYZEIntegration {
    constructor(moduleId, patternManager) {
        this.moduleId = moduleId;
        this.patternManager = patternManager;
        this.yzeModuleId = 'yze-combat';
        this.isYZEInstalled = false;
        this.isYZESingleActionEnabled = false;
    }

    /**
     * Initialize YZE integration if available
     */
    initialize() {
        // Check if YZE Combat module is installed and active
        this.isYZEInstalled = game.modules.get(this.yzeModuleId)?.active || false;
        
        if (!this.isYZEInstalled) {
            DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', "YZE Combat module not found or not active");
            return false;
        }

        // Check if single action mode is enabled in YZE
        this.isYZESingleActionEnabled = this.getYZESetting('singleAction', false);
        
        if (!this.isYZESingleActionEnabled) {
            DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', "YZE single action mode not enabled");
            return false;
        }

        DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', "YZE integration initialized successfully");
        return true;
    }

    /**
     * Check if YZE integration is available and enabled
     */
    isEnabled() {
        // Check our module's setting first
        const moduleSettingEnabled = DragonbaneUtils.getSetting(this.moduleId, 'enableYZEIntegration', true);
        return moduleSettingEnabled && this.isYZEInstalled && this.isYZESingleActionEnabled;
    }

    /**
     * Handle chat message for post-roll action detection
     */
    async onChatMessageAction(message) {
        if (!this.isEnabled()) return;
        if (!DragonbaneUtils.isCombatActive()) return;

        try {
            const actor = DragonbaneUtils.getActorFromMessage(message);
            if (!actor) return;

            // Extract token information from message speaker for token-specific tracking
            const tokenInfo = this.extractTokenInfo(message);

            const actionType = this.determineActionType(message);
            if (!actionType) return;

            DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', `Detected ${actionType} action from chat for ${actor.name}${tokenInfo.tokenId ? ` (Token: ${tokenInfo.tokenId})` : ''}`);
            await this.onActionTaken(actor, actionType, tokenInfo);

        } catch (error) {
            console.error(`${this.moduleId} | Error processing chat message for YZE:`, error);
        }
    }

    /**
     * Extract token information from chat message speaker
     */
    extractTokenInfo(message) {
        const speaker = message?.speaker;
        return {
            tokenId: speaker?.token || null,
            sceneId: speaker?.scene || null,
            actorId: speaker?.actor || null
        };
    }

    /**
     * Check if this is a damage or healing roll
     */
    _isDamageRoll(message) {
        if (!message?.content) return false;
        const content = message.content.toLowerCase();
        
        // Check for damage/healing roll CSS classes (most reliable)
        return content.includes('class="damage-roll"') || 
               content.includes('class="healing-roll"') ||
               // Backup: check for data attributes
               content.includes('data-damage=') || 
               content.includes('data-healing=');
    }

    /**
     * Simplified action type determination using pattern manager with HTML monster attack detection
     */
    determineActionType(message) {
        if (!message?.content) return null;
        
        const content = message.content.toLowerCase();
        
        // Check for damage rolls first (before any other detection)
        if (this._isDamageRoll(message)) return null;
        
        // Quick exclusion check
        if (this.patternManager.isExcludedRoll(content)) return null;
        
        // Check reaction spells
        if (this._isReactionSpell(message)) return null;
        
        // Check for HTML monster attack structure (table draws)
        if (content.includes('table-draw') && content.includes('monster-attack.webp')) {
            return 'monsterAttack';
        }
        
        // Direct pattern detection - simplified
        if (this.patternManager.isMonsterAttack(content)) return 'monsterAttack';
        if (this.patternManager.isWeaponAttack(content)) return 'weaponAttack';
        if (this.patternManager.isSpellCast(content)) return 'spellCast';
        if (this.patternManager.isSkillTest(content)) return 'skillTest';
        if (this.patternManager.isValidGeneralAction(content)) return 'generalAction';
        
        return null;
    }

    /**
     * Check if this is a reaction spell
     */
    _isReactionSpell(message) {
        try {
            const spell = DragonbaneUtils.extractSpellFromMessage(message);
            return spell && DragonbaneUtils.isSpellReactionCastingTime(spell);
        } catch (error) {
            DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', `Error checking reaction spell: ${error.message}`);
            return false;
        }
    }

    /**
     * Check if an actor/token is actually in the current combat
     */
    isActorInCurrentCombat(actor, tokenId) {
        if (!DragonbaneUtils.hasCombat()) return false;

        // If we have a token ID, check for that specific token
        if (tokenId) {
            return game.combat.turns.some(turn => turn.tokenId === tokenId);
        }

        // Fallback to checking by actor ID
        if (actor) {
            return game.combat.turns.some(turn => turn.actor?.id === actor.id);
        }

        return false;
    }

    /**
     * Handle action taken by a combatant (token-specific with notifications)
     */
    async onActionTaken(actor, actionType = 'unknown', tokenInfo = {}) {
        if (!this.isEnabled()) return;
        if (!DragonbaneUtils.isCombatActive()) return;

        // Check if YZE action tracking is overridden
        if (window.DragonbaneActionRules?.overrides?.yzeActionTracking || 
            window.DragonbaneActionRules?.overrides?.allValidations) {
            DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', `YZE action tracking skipped due to override for ${actor.name} (${actionType})`);
            return;
        }

        try {
            // Check if this actor/token is actually in the current combat
            if (!this.isActorInCurrentCombat(actor, tokenInfo.tokenId)) {
                DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', `Action by ${actor.name} ignored - not a combatant in current combat`);
                return; // Silently ignore actions from non-combatants
            }

            // Check if this specific token has any available actions left
            const nextCombatant = this.getNextAvailableCombatantForToken(actor, tokenInfo.tokenId);
            if (!nextCombatant) {
                // Only show notification if they're actually in combat but used all actions
                const message = game.i18n.format("DRAGONBANE_ACTION_RULES.yze.actionAlreadyPerformed", { 
                    actorName: actor.name 
                });
                ui.notifications.info(message, { permanent: false });
                DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', `Action attempted by ${actor.name} (Token: ${tokenInfo.tokenId}) but all action slots used`);
                return; // Don't block the action, just notify and return
            }

            const actionNumber = this.getActionNumberForCombatant(nextCombatant);
            if (actionNumber < 1 || actionNumber > 9) {
                DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', `Invalid action number ${actionNumber} for combatant ${nextCombatant.name}`);
                return;
            }

            await this.applySingleActionStatusEffect(nextCombatant, actionNumber, actionType);

        } catch (error) {
            console.error(`${this.moduleId} | Error in YZE action tracking:`, error);
        }
    }

    /**
     * Get the next available combatant for a specific token (token-specific tracking)
     */
    getNextAvailableCombatantForToken(actor, tokenId) {
        if (!DragonbaneUtils.hasCombat()) return null;

        // If we have a specific token ID, find combatants for that exact token
        if (tokenId) {
            const tokenCombatants = game.combat.turns.filter(turn => turn.tokenId === tokenId);
            
            // Find the first combatant for this token that hasn't used their action yet
            for (const combatant of tokenCombatants) {
                const actionNumber = this.getActionNumberForCombatant(combatant);
                const statusEffectId = `action${actionNumber}`;
                
                // Check if this combatant already has the action status effect
                const hasActionEffect = DragonbaneUtils.hasStatusEffect(combatant.token?.actor, statusEffectId);

                if (!hasActionEffect) {
                    DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', `Found available combatant for token ${tokenId}: action ${actionNumber}`);
                    return combatant;
                }
            }
            
            DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', `No available combatants found for token ${tokenId}`);
            return null;
        }

        // Fallback to actor-based lookup if no token ID (shouldn't happen in normal cases)
        DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', `No token ID provided, falling back to actor-based lookup for ${actor.name}`);
        const actorCombatants = game.combat.turns.filter(turn => turn.actor?.id === actor.id);
        
        if (actorCombatants.length === 0) return null;

        // Find the first combatant that hasn't used their action yet
        for (const combatant of actorCombatants) {
            const actionNumber = this.getActionNumberForCombatant(combatant);
            const statusEffectId = `action${actionNumber}`;
            
            const hasActionEffect = DragonbaneUtils.hasStatusEffect(combatant.token?.actor, statusEffectId);

            if (!hasActionEffect) {
                DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', `Found available combatant for ${actor.name}: action ${actionNumber}`);
                return combatant;
            }
        }

        return null;
    }

    /**
     * Get the action number for a specific combatant instance
     */
    getActionNumberForCombatant(combatant) {
        const combat = combatant.combat;
        const tokenId = combatant.tokenId;
        let actionNumber = 0;

        for (const turn of combat.turns) {
            if (turn.tokenId === tokenId) {
                actionNumber++;
            }
            if (turn.id === combatant.id) {
                break;
            }
        }

        return actionNumber;
    }

    /**
     * Apply the single action status effect
     */
    async applySingleActionStatusEffect(combatant, actionNumber, actionType) {
        const statusEffectId = `action${actionNumber}`;
        
        const statusEffect = CONFIG.statusEffects?.find(e => e.id === statusEffectId);
        if (!statusEffect) {
            DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', `Status effect ${statusEffectId} not found in CONFIG.statusEffects`);
            return;
        }

        const hasEffect = DragonbaneUtils.hasStatusEffect(combatant.token?.actor, statusEffectId);

        if (hasEffect) {
            DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', `${combatant.name} already has ${statusEffectId} status effect`);
            return;
        }

        const success = await DragonbaneUtils.toggleStatusEffect(combatant.token.actor, statusEffectId, true);
        if (success) {
            DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', `Applied ${statusEffectId} to ${combatant.name} for ${actionType} action`);
        }
    }

    /**
     * Get YZE module setting
     */
    getYZESetting(settingName, fallback) {
        try {
            return game.settings.get(this.yzeModuleId, settingName);
        } catch (error) {
            DragonbaneUtils.debugLog(this.moduleId, 'YZEIntegration', `Failed to get YZE setting ${settingName}: ${error.message}`);
            return fallback;
        }
    }
}
