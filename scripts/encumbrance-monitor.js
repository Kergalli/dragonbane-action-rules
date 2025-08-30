/**
 * Dragonbane Combat Assistant - Encumbrance Monitoring
 * Event-driven encumbrance monitoring with configurable status effects
 */

import { SETTINGS, getSetting } from "./settings.js";
import { DragonbaneUtils } from "./utils.js";

export class DragonbaneEncumbranceMonitor {
  constructor(moduleId) {
    this.moduleId = moduleId;
    this.previousStates = new Map();
  }

  /**
   * Initialize encumbrance monitoring if enabled
   */
  initialize() {
    if (
      getSetting(this.moduleId, SETTINGS.ENABLE_ENCUMBRANCE_MONITORING, true)
    ) {
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
      if (
        !getSetting(this.moduleId, SETTINGS.ENABLE_ENCUMBRANCE_MONITORING, true)
      )
        return;

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
      if (
        !getSetting(this.moduleId, SETTINGS.ENABLE_ENCUMBRANCE_MONITORING, true)
      )
        return;

      const actor = item.parent;
      if (!actor || !this.shouldMonitorActor(actor)) return;

      // Check if the update affects encumbrance (quantity, equipped status, etc.)
      if (this.isItemUpdateRelevant(updateData)) {
        this.checkActorEncumbrance(actor);
      }
    } catch (error) {
      console.error(`${this.moduleId} | Error in item update:`, error);
    }
  }

  /**
   * Handle item create/delete
   */
  async onItemChange(actor, item, options, userId) {
    try {
      if (
        !getSetting(this.moduleId, SETTINGS.ENABLE_ENCUMBRANCE_MONITORING, true)
      )
        return;

      if (!this.shouldMonitorActor(actor)) return;

      this.checkActorEncumbrance(actor);
    } catch (error) {
      console.error(`${this.moduleId} | Error in item change:`, error);
    }
  }

  /**
   * Handle actor deletion
   */
  async onActorDelete(actor, options, userId) {
    try {
      this.previousStates.delete(actor.id);
      this.debugLog(`Removed tracking for deleted actor: ${actor.name}`);
    } catch (error) {
      console.error(`${this.moduleId} | Error in actor deletion:`, error);
    }
  }

  /**
   * Check if an actor should be monitored based on folder configuration
   */
  shouldMonitorActor(actor) {
    if (!actor || actor.type !== "character") return false;

    const targetFolder = getSetting(
      this.moduleId,
      SETTINGS.ENCUMBRANCE_MONITOR_FOLDER,
      "Party"
    );

    // Check if actor is in the target folder
    const actorFolder = game.folders.get(actor.folder);
    if (!actorFolder) {
      // No folder - only monitor if target is empty string
      return targetFolder === "";
    }

    return actorFolder.name === targetFolder;
  }

  /**
   * Check if update data is relevant to encumbrance
   */
  isEncumbranceRelevant(updateData) {
    return (
      updateData.system?.attributes?.str ||
      updateData.system?.encumbrance ||
      updateData.items
    );
  }

  /**
   * Check if item update affects encumbrance
   */
  isItemUpdateRelevant(updateData) {
    return (
      updateData.system?.quantity !== undefined ||
      updateData.system?.equipped !== undefined ||
      updateData.system?.encumbrance !== undefined
    );
  }

  /**
   * Check actor encumbrance and apply/remove status effect
   */
  async checkActorEncumbrance(actor) {
    try {
      const currentEnc = actor.system?.encumbrance?.current || 0;
      const maxEnc = actor.system?.encumbrance?.max || 0;
      const isOverEncumbered = currentEnc > maxEnc;

      const previousState = this.previousStates.get(actor.id);
      const statusEffectName = this.getEncumbranceStatusEffectName();

      // Check if state changed
      if (previousState !== isOverEncumbered) {
        // Update status effect
        const hasEffect = DragonbaneUtils.hasStatusEffect(
          actor,
          statusEffectName
        );

        if (isOverEncumbered && !hasEffect) {
          await this.addEncumbranceStatusEffect(actor, statusEffectName);
          this.debugLog(`Applied encumbrance effect to ${actor.name}`);
        } else if (!isOverEncumbered && hasEffect) {
          await DragonbaneUtils.toggleStatusEffect(
            actor,
            statusEffectName,
            false
          );
          this.debugLog(`Removed encumbrance effect from ${actor.name}`);
        }

        // Send chat notification if enabled
        if (
          getSetting(
            this.moduleId,
            SETTINGS.ENCUMBRANCE_CHAT_NOTIFICATIONS,
            false
          )
        ) {
          await this.sendEncumbranceNotification(
            actor,
            isOverEncumbered,
            currentEnc,
            maxEnc
          );
        }

        // Update previous state
        this.previousStates.set(actor.id, isOverEncumbered);
      }
    } catch (error) {
      console.error(
        `${this.moduleId} | Error checking encumbrance for ${actor.name}:`,
        error
      );
    }
  }

  /**
   * Initialize previous states for all monitored actors
   */
  initializePreviousStates() {
    this.previousStates.clear();

    const targetFolder = getSetting(
      this.moduleId,
      SETTINGS.ENCUMBRANCE_MONITOR_FOLDER,
      "Party"
    );

    for (const actor of game.actors) {
      if (!this.shouldMonitorActor(actor)) continue;

      const currentEnc = actor.system?.encumbrance?.current || 0;
      const maxEnc = actor.system?.encumbrance?.max || 0;
      const isOverEncumbered = currentEnc > maxEnc;

      this.previousStates.set(actor.id, isOverEncumbered);
    }

    this.debugLog(
      `Initialized encumbrance states for ${this.previousStates.size} actors in folder: ${targetFolder}`
    );
  }

  /**
   * Ensure the encumbrance status effect exists
   */
  async ensureStatusEffectExists() {
    const statusEffectName = this.getEncumbranceStatusEffectName();

    const existingEffect = CONFIG.statusEffects?.find(
      (e) => e.label === statusEffectName
    );
    if (existingEffect) {
      this.debugLog(`Status effect '${statusEffectName}' already exists`);
      return;
    }

    // Create the status effect
    const statusEffectId = `encumbered-${this.moduleId}`;
    const newEffect = {
      id: statusEffectId,
      label: statusEffectName,
      icon: "modules/dragonbane-action-rules/assets/icons/encumbrance.svg",
      description: game.i18n.localize(
        "DRAGONBANE_ACTION_RULES.encumbrance.statusEffectDescription"
      ),
      flags: {
        [this.moduleId]: {
          encumbranceEffect: true,
        },
      },
    };

    // Add to CONFIG.statusEffects if it doesn't exist
    if (!CONFIG.statusEffects) CONFIG.statusEffects = [];
    CONFIG.statusEffects.push(newEffect);

    this.debugLog(`Created encumbrance status effect: '${statusEffectName}'`);
  }

  /**
   * Add encumbrance status effect to actor
   */
  async addEncumbranceStatusEffect(actor, statusEffectName) {
    try {
      const statusEffectId = `encumbered-${this.moduleId}`;
      await DragonbaneUtils.toggleStatusEffect(actor, statusEffectName, true);
    } catch (error) {
      console.error(
        `${this.moduleId} | Error adding encumbrance status effect:`,
        error
      );
    }
  }

  /**
   * Send chat notification about encumbrance change
   */
  async sendEncumbranceNotification(
    actor,
    isOverEncumbered,
    currentEnc,
    maxEnc
  ) {
    try {
      const messageKey = isOverEncumbered
        ? "DRAGONBANE_ACTION_RULES.encumbrance.chatOverEncumbered"
        : "DRAGONBANE_ACTION_RULES.encumbrance.chatNoLongerOverEncumbered";

      let content = `<div class="dragonbane-encumbrance-notice">
                <strong>${game.i18n.format(messageKey, {
                  actorName: actor.name,
                })}</strong>
                <div class="encumbrance-details">
                    ${game.i18n.format(
                      "DRAGONBANE_ACTION_RULES.encumbrance.carryingItems",
                      {
                        currentEnc: currentEnc,
                        maxEnc: maxEnc,
                      }
                    )}
                </div>`;

      // Add rule reminder for over-encumbered
      if (isOverEncumbered) {
        content += `<div class="encumbrance-rule">
                    <em>${game.i18n.localize(
                      "DRAGONBANE_ACTION_RULES.encumbrance.strRollReminder"
                    )}</em>
                </div>`;
      }

      content += `</div>`;

      await ChatMessage.create({
        content: content,
        speaker: {
          alias: game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.encumbrance.systemMessage"
          ),
        },
        flags: {
          [this.moduleId]: {
            encumbranceNotice: true,
          },
        },
      });
    } catch (error) {
      console.error(`${this.moduleId} | Error creating chat message:`, error);
    }
  }

  /**
   * Get the localized encumbrance status effect name
   */
  getEncumbranceStatusEffectName() {
    const settingValue = getSetting(
      this.moduleId,
      SETTINGS.ENCUMBRANCE_STATUS_EFFECT,
      ""
    );

    // If setting is empty or not set, use localized default
    if (!settingValue) {
      return game.i18n.localize(
        "DRAGONBANE_ACTION_RULES.encumbrance.statusEffectName"
      );
    }

    return settingValue;
  }

  /**
   * Debug logging
   */
  debugLog(message) {
    DragonbaneUtils.debugLog(this.moduleId, "EncumbranceMonitor", message);
  }
}
