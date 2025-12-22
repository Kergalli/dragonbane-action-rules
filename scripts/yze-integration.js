/**
 * Dragonbane Combat Assistant - Year Zero Engine Integration
 * Handles integration with YZE Combat module for single action tracking
 */

import { DragonbaneUtils } from "./utils.js";

export class DragonbaneYZEIntegration {
  constructor(moduleId, patternManager) {
    this.moduleId = moduleId;
    this.patternManager = patternManager;
    this.yzeModuleId = "yze-combat";
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
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        "YZE Combat module not found or not active"
      );
      return false;
    }

    // Check if single action mode is enabled in YZE
    this.isYZESingleActionEnabled = this.getYZESetting("singleAction", false);

    if (!this.isYZESingleActionEnabled) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        "YZE single action mode not enabled"
      );
      return false;
    }

    DragonbaneUtils.debugLog(
      this.moduleId,
      "YZEIntegration",
      "YZE integration initialized successfully"
    );
    return true;
  }

  /**
   * Check if YZE integration is available and enabled
   */
  isEnabled() {
    // Check our module's setting first
    const moduleSettingEnabled = DragonbaneUtils.getSetting(
      this.moduleId,
      "enableYZEIntegration",
      true
    );
    return (
      moduleSettingEnabled &&
      this.isYZEInstalled &&
      this.isYZESingleActionEnabled
    );
  }

  /**
   * Handle chat message for post-roll action detection
   */
  async onChatMessageAction(message) {
    if (!this.isEnabled()) return;
    if (!DragonbaneUtils.isCombatActive()) return;

    if (message.user.id !== game.user.id) {
      return;
    }

    try {
      const actor = DragonbaneUtils.getActorFromMessage(message);
      if (!actor) return;

      // Extract token information from message speaker for token-specific tracking
      const tokenInfo = this.extractTokenInfo(message);

      const actionType = this.determineActionType(message);
      if (!actionType) return;

      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        `Detected ${actionType} action from chat for ${actor.name}${
          tokenInfo.tokenId ? ` (Token: ${tokenInfo.tokenId})` : ""
        }`
      );

      await this.onActionTaken(actor, actionType, tokenInfo);
    } catch (error) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        `Error in YZE chat message processing: ${error.message}`
      );
    }
  }

  /**
   * Extract token information from message speaker
   */
  extractTokenInfo(message) {
    const speaker = message.speaker;
    return {
      tokenId: speaker?.token || null,
      sceneId: speaker?.scene || null,
    };
  }

  /**
   * Get YZE Combat setting
   */
  getYZESetting(setting, defaultValue) {
    try {
      return game.settings.get(this.yzeModuleId, setting);
    } catch (error) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        `Could not read YZE setting '${setting}': ${error.message}`
      );
      return defaultValue;
    }
  }

  /**
   * Determine if message represents an action (simplified)
   */
  determineActionType(message) {
    // Skip whispered messages - usually informational, not actions
    if (message.whisper && message.whisper.length > 0) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        "Skipping whispered message (likely informational)"
      );
      return null;
    }

    // Skip damage/healing rolls - these are follow-ups, not actions
    if (this._isDamageRoll(message)) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        "Skipping damage/healing roll"
      );
      return null;
    }

    // Skip reaction spells
    if (this._isReactionSpell(message)) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        "Skipping reaction spell"
      );
      return null;
    }

    // Skip attribute tests (not actions in combat)
    if (this._isAttributeTest(message)) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        "Skipping attribute test (not an action)"
      );
      return null;
    }

    // Skip messages that match custom exclusions
    if (this._matchesCustomExclusions(message)) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        "Skipping due to custom exclusions"
      );
      return null;
    }

    // Check for ability inclusions (before general pattern matching)
    if (this._matchesAbilityInclusions(message)) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        "Detected ability action from inclusions list"
      );
      return "ability";
    }

    // Simplified: Any dice roll that passes the filters is an action
    const content = message.content;
    if (this.patternManager.isAction(content)) {
      return "action"; // Single action type instead of multiple specific types
    }

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
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        `Error checking reaction spell: ${error.message}`
      );
      return false;
    }
  }

  /**
   * Check if this is an attribute test (not an action)
   */
  _isAttributeTest(message) {
    if (!message?.flavor) return false;

    try {
      const flavor = message.flavor.toLowerCase();

      // Get the localized attribute roll text
      // English: "Attribute roll for"
      // Swedish: "Grundegenskapsslag för"
      const attributeRollText = game.i18n.localize("DoD.roll.attributeRoll");

      if (attributeRollText) {
        // Extract the first part before the {attribute} placeholder
        const firstPart = attributeRollText
          .split("<b>")[0]
          .trim()
          .toLowerCase();

        if (firstPart && flavor.includes(firstPart)) {
          return true;
        }
      }

      // Fallback patterns
      if (
        flavor.includes("attribute roll") ||
        flavor.includes("grundegenskapsslag")
      ) {
        return true;
      }

      return false;
    } catch (error) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        `Error checking attribute test: ${error.message}`
      );
      return false;
    }
  }

  /**
   * Check if message matches custom exclusions
   */
  _matchesCustomExclusions(message) {
    const exclusions = DragonbaneUtils.getSetting(
      this.moduleId,
      "yzeCustomExclusions",
      ""
    );
    if (!exclusions.trim()) return false;

    const exclusionPatterns = exclusions
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e);
    const content = message.content.toLowerCase();

    return exclusionPatterns.some((pattern) => content.includes(pattern));
  }

  /**
   * Check if message contains an ability that should count as an action
   */
  _matchesAbilityInclusions(message) {
    const inclusions = DragonbaneUtils.getSetting(
      this.moduleId,
      "yzeAbilityInclusions",
      ""
    );
    if (!inclusions.trim()) return false;

    const inclusionList = inclusions
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e);

    const content = message.content;

    // Check if this is an ability usage message
    if (!content.includes('class="ability-use"')) {
      return false;
    }

    try {
      // Find UUID using string methods
      const uuidStart = content.indexOf("@UUID[");
      if (uuidStart === -1) return false;

      const uuidEnd = content.indexOf("]", uuidStart);
      if (uuidEnd === -1) return false;

      const uuid = content.substring(uuidStart + 6, uuidEnd);

      // Get the actual item from the UUID
      const item = fromUuidSync(uuid);
      if (!item || item.type !== "ability") {
        return false;
      }

      const abilityName = item.name.toLowerCase();

      // Check if this ability is in our inclusions list
      return inclusionList.some((ability) =>
        abilityName.includes(ability.toLowerCase())
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if this is a damage or healing roll
   */
  _isDamageRoll(message) {
    if (!message?.content) return false;
    const content = message.content.toLowerCase();

    // Check for damage/healing roll CSS classes (most reliable)
    return (
      content.includes('class="damage-roll"') ||
      content.includes('class="healing-roll"') ||
      // Backup: check for data attributes
      content.includes("data-damage=") ||
      content.includes("data-healing=")
    );
  }

  /**
   * Check if an actor/token is actually in the current combat
   */
  isActorInCurrentCombat(actor, tokenId) {
    if (!DragonbaneUtils.hasCombat()) return false;

    // If we have a token ID, check for that specific token
    if (tokenId) {
      return game.combat.turns.some((turn) => turn.tokenId === tokenId);
    }

    // Fallback to checking by actor ID
    if (actor) {
      return game.combat.turns.some((turn) => turn.actor?.id === actor.id);
    }

    return false;
  }

  /**
   * Handle action taken by a combatant (token-specific with notifications)
   */
  async onActionTaken(actor, actionType = "unknown", tokenInfo = {}) {
    if (!this.isEnabled()) return;
    if (!DragonbaneUtils.isCombatActive()) return;

    // Check if validation bypass is active
    if (window.DragonbaneActionRules?.overrides?.validationBypass) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        `YZE action tracking skipped due to validation bypass for ${actor.name} (${actionType})`
      );
      return;
    }

    try {
      // Check if this actor/token is actually in the current combat
      if (!this.isActorInCurrentCombat(actor, tokenInfo.tokenId)) {
        DragonbaneUtils.debugLog(
          this.moduleId,
          "YZEIntegration",
          `Action by ${actor.name} ignored - not a combatant in current combat`
        );
        return; // Silently ignore actions from non-combatants
      }

      // Check if this specific token has any available actions left
      const nextCombatant = this.getNextAvailableCombatantForToken(
        actor,
        tokenInfo.tokenId
      );
      if (!nextCombatant) {
        // Only show notification if they're actually in combat but used all actions
        // Use contextual message based on actor type
        let messageKey;
        if (actor.type === "character") {
          messageKey =
            "DRAGONBANE_ACTION_RULES.yze.actionAlreadyPerformedOrPushing";
        } else {
          messageKey = "DRAGONBANE_ACTION_RULES.yze.actionAlreadyPerformedNPC";
        }

        const message = game.i18n.format(messageKey, { actorName: actor.name });
        ui.notifications.info(message, { permanent: false });
        DragonbaneUtils.debugLog(
          this.moduleId,
          "YZEIntegration",
          `Action attempted by ${actor.name} (Token: ${tokenInfo.tokenId}) but all action slots used`
        );
        return; // Don't block the action, just notify and return
      }

      const actionNumber = this.getActionNumberForCombatant(nextCombatant);
      if (actionNumber < 1 || actionNumber > 9) {
        DragonbaneUtils.debugLog(
          this.moduleId,
          "YZEIntegration",
          `Invalid action number ${actionNumber} for combatant ${nextCombatant.name}`
        );
        return;
      }

      await this.applySingleActionStatusEffect(
        nextCombatant,
        actionNumber,
        actionType
      );
    } catch (error) {
      console.error(`${this.moduleId} | Error in YZE action tracking:`, error);
    }
  }

  /**
   * Get the next available combatant for a specific token (token-specific tracking)
   */
  getNextAvailableCombatantForToken(actor, tokenId) {
    if (!DragonbaneUtils.hasCombat()) return null;

    // Get combatants (prefer token-specific, fallback to actor)
    const combatants = tokenId
      ? game.combat.turns.filter((turn) => turn.tokenId === tokenId)
      : game.combat.turns.filter((turn) => turn.actor?.id === actor.id);

    // Single logic path for finding available combatant (no duplication!)
    for (const combatant of combatants) {
      const actionNumber = this.getActionNumberForCombatant(combatant);
      const statusEffectId = `action${actionNumber}`;

      if (
        !DragonbaneUtils.hasStatusEffect(combatant.token?.actor, statusEffectId)
      ) {
        DragonbaneUtils.debugLog(
          this.moduleId,
          "YZEIntegration",
          `Found available combatant: action ${actionNumber}`
        );
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

    const statusEffect = CONFIG.statusEffects?.find(
      (e) => e.id === statusEffectId
    );
    if (!statusEffect) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        `Status effect ${statusEffectId} not found in CONFIG.statusEffects`
      );
      return;
    }

    const hasEffect = DragonbaneUtils.hasStatusEffect(
      combatant.token?.actor,
      statusEffectId
    );

    if (hasEffect) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        `${combatant.name} already has ${statusEffectId} status effect`
      );
      return;
    }

    const success = await DragonbaneUtils.toggleStatusEffect(
      combatant.token.actor,
      statusEffectId,
      true
    );
    if (success) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        `Applied ${statusEffectId} to ${combatant.name} for ${actionType} action`
      );
    }
  }

  /**
   * Get YZE module setting
   */
  getYZESetting(settingName, fallback) {
    try {
      return game.settings.get(this.yzeModuleId, settingName);
    } catch (error) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "YZEIntegration",
        `Failed to get YZE setting ${settingName}: ${error.message}`
      );
      return fallback;
    }
  }
}
