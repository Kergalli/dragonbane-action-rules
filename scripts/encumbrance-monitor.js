/**
 * Dragonbane Combat Assistant - Encumbrance Monitoring
 */

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
    if (this.getSetting("enableEncumbranceMonitoring", true)) {
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
      if (!this.getSetting("enableEncumbranceMonitoring", true)) return;

      // Only monitor characters in the configured folder
      if (!this.shouldMonitorActor(actor)) return;

      // Check if encumbrance-related data changed
      if (!this.isEncumbranceRelevant(updateData)) return;

      // Check encumbrance immediately
      this.checkActorEncumbrance(actor);
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Error in actor update: ${error.message}`);
      }
    }
  }

  /**
   * Handle item updates that affect encumbrance
   */
  async onItemUpdate(item, updateData, options, userId) {
    try {
      if (!this.getSetting("enableEncumbranceMonitoring", true)) return;

      const actor = item.parent;
      if (!actor || !this.shouldMonitorActor(actor)) return;

      // Check if the update affects encumbrance (quantity, equipped status, etc.)
      if (this.isItemUpdateRelevant(updateData)) {
        this.checkActorEncumbrance(actor);
      }
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Error in item update: ${error.message}`);
      }
    }
  }

  /**
   * Handle item create/delete
   */
  async onItemChange(item, options, userId) {
    try {
      if (!this.getSetting("enableEncumbranceMonitoring", true)) return;

      const actor = item.parent;
      if (!actor || !this.shouldMonitorActor(actor)) return;

      this.checkActorEncumbrance(actor);
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Error in item change: ${error.message}`);
      }
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
      // CHANGED: Use DoD_Utility.WARNING instead of console.error
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Error in actor deletion: ${error.message}`);
      }
    }
  }

  /**
   * Check if an actor should be monitored based on folder configuration
   */
  shouldMonitorActor(actor) {
    if (!actor || actor.documentName !== "Actor") {
      return false;
    }

    if (actor.type !== "character") {
      return false;
    }

    const targetFolder = this.getSetting("encumbranceMonitorFolder", "Party");

    // Handle both folder object and folder ID cases
    let actorFolder = null;
    if (actor.folder) {
      if (typeof actor.folder === "string") {
        // It's an ID, look it up
        actorFolder = game.folders.get(actor.folder);
      } else if (
        actor.folder &&
        typeof actor.folder === "object" &&
        actor.folder.name
      ) {
        // It's already a folder object
        actorFolder = actor.folder;
      }
    }

    if (targetFolder === "") {
      // Empty target folder means monitor all characters
      return true;
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
      const currentEnc = actor.system?.encumbrance?.value || 0;
      const maxEnc = actor.system?.maxEncumbrance?.value || 0;
      const isOverEncumbered = currentEnc > maxEnc;

      const previousState = this.previousStates.get(actor.id);
      const statusEffectName = this.getEncumbranceStatusEffectName();

      // Check if state changed
      if (previousState !== isOverEncumbered) {
        // Handle status effects based on state transition
        if (isOverEncumbered) {
          // Character became over-encumbered - add status effect if not present
          const hasEffect = DragonbaneUtils.hasStatusEffect(
            actor,
            statusEffectName
          );

          if (!hasEffect) {
            await this.addEncumbranceStatusEffect(actor, statusEffectName);
          }
        } else {
          // Character is no longer over-encumbered - force remove status effect
          try {
            // Use direct Foundry API call to ensure removal regardless of detection issues
            const effect = DragonbaneUtils.findStatusEffect(statusEffectName);
            const effectId =
              effect?.id || statusEffectName.toLowerCase().replace(/\s+/g, "-");
            await actor.toggleStatusEffect(effectId, { active: false });
          } catch (toggleError) {
            if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
              DoD_Utility.WARNING(
                `Error removing status effect: ${toggleError.message}`
              );
            }
          }

          // Always show UI notification when becoming un-encumbered
          ui.notifications.info(
            game.i18n.format(
              "DRAGONBANE_ACTION_RULES.encumbrance.noLongerOverEncumbered",
              { actorName: actor.name, currentEnc: currentEnc, maxEnc: maxEnc }
            )
          );
        }

        // Send chat notification if enabled
        const chatEnabled = this.getSetting(
          "encumbranceChatNotifications",
          false
        );

        if (chatEnabled) {
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
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error checking encumbrance for ${actor.name}: ${error.message}`
        );
      }
    }
  }

  /**
   * Initialize previous states for all monitored actors
   */
  initializePreviousStates() {
    this.previousStates.clear();

    const targetFolder = this.getSetting("encumbranceMonitorFolder", "Party");
    let monitoredCount = 0;

    for (const actor of game.actors) {
      if (!this.shouldMonitorActor(actor)) {
        continue;
      }

      monitoredCount++;

      const currentEnc = actor.system?.encumbrance?.value || 0;
      const maxEnc = actor.system?.maxEncumbrance?.value || 0;
      const isOverEncumbered = currentEnc > maxEnc;

      this.previousStates.set(actor.id, isOverEncumbered);
    }

    this.debugLog(
      `Initialized encumbrance states for ${monitoredCount} actors in folder: ${targetFolder}`
    );
  }

  /**
   * Ensure the encumbrance status effect exists
   */
  ensureStatusEffectExists() {
    const statusEffectName = this.getEncumbranceStatusEffectName();

    if (
      DragonbaneUtils.ensureStatusEffectExists(
        statusEffectName,
        "icons/svg/anchor.svg"
      )
    ) {
      this.debugLog(`Status effect "${statusEffectName}" ensured`);
    } else {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Failed to ensure status effect: ${statusEffectName}`
        );
      }
    }
  }

  /**
   * Add encumbrance status effect to actor
   */
  async addEncumbranceStatusEffect(actor, statusEffectName) {
    try {
      const success = await DragonbaneUtils.toggleStatusEffect(
        actor,
        statusEffectName,
        true
      );

      if (success) {
        // Send UI notification with proper values
        const currentEnc = actor.system?.encumbrance?.value || 0;
        const maxEnc = actor.system?.maxEncumbrance?.value || 0;

        ui.notifications.warn(
          game.i18n.format(
            "DRAGONBANE_ACTION_RULES.encumbrance.nowOverEncumbered",
            { actorName: actor.name, currentEnc: currentEnc, maxEnc: maxEnc }
          )
        );
      }
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error adding encumbrance status effect: ${error.message}`
        );
      }
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
                ${game.i18n.format(messageKey, {
                  actorName: actor.name,
                })}
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
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error sending encumbrance notification: ${error.message}`
        );
      }
    }
  }

  /**
   * Get the localized encumbrance status effect name
   */
  getEncumbranceStatusEffectName() {
    const settingValue = this.getSetting("encumbranceStatusEffect", "");

    // If setting is empty or not set, use localized default
    if (!settingValue) {
      return game.i18n.localize(
        "DRAGONBANE_ACTION_RULES.encumbrance.statusEffectName"
      );
    }

    return settingValue;
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
    DragonbaneUtils.debugLog(this.moduleId, "EncumbranceMonitor", message);
  }
}
