/**
 * Dragonbane Combat Assistant - Grudge Tracker
 * Handles tracking of damage dealt to characters with Unforgiving kin ability
 */

import { DragonbaneUtils } from "./utils.js";

export class DragonbaneGrudgeTracker {
  constructor(moduleId) {
    this.moduleId = moduleId;
    this.recentDamageRolls = new Map(); // Cache recent damage rolls for correlation
    this.recentAttackRolls = new Map(); // Cache recent attack rolls for dragon detection
    this.damageRollTimeout = 10000; // 10 seconds to correlate damage messages
    this.attackRollTimeout = 15000; // 15 seconds to correlate attack rolls
  }

  /**
   * Handle chat message for grudge tracking - main entry point
   */
  onChatMessage(message) {
    try {
      // Skip if grudge tracking is disabled
      if (
        !DragonbaneUtils.getSetting(this.moduleId, "enableGrudgeTracking", true)
      )
        return;

      // Skip if already processed
      if (message.getFlag(this.moduleId, "grudgeTracked")) return;

      const content = message.content;
      if (!content) return;

      // Handle attack roll (for dragon detection)
      if (this._isAttackRoll(message)) {
        this._storeAttackRoll(message);
        return;
      }

      // Handle damage roll (first message - stores attacker info)
      if (this._isDamageRoll(message)) {
        this._storeDamageRoll(message);
        return;
      }

      // Handle damage application (second message - shows final damage)
      if (this._isDamageMessage(message)) {
        this._processDamageApplication(message);
        return;
      }
    } catch (error) {
      console.error(
        `${this.moduleId} | Error processing grudge tracking:`,
        error
      );
    }
  }

  /**
   * Check if message is an attack roll (for dragon detection)
   */
  _isAttackRoll(message) {
    // Look for attack roll indicators and dice rolls
    return (
      message.content.includes("dice-roll") &&
      !message.content.includes("damage-roll") &&
      !message.content.includes("damage-message")
    );
  }

  /**
   * Check if message is a damage roll (first message)
   */
  _isDamageRoll(message) {
    return message.content.includes("damage-roll");
  }

  /**
   * Check if message is a damage application message (second message)
   */
  _isDamageMessage(message) {
    return message.content.includes("damage-message");
  }

  /**
   * Store attack roll info for dragon detection
   */
  _storeAttackRoll(message) {
    try {
      // Check if this has dragon
      const isDragon = DragonbaneUtils.detectDragonRoll(message);

      if (isDragon) {
        // Get attacker info
        const attackerId = message.speaker?.actor || message.speaker?.token;

        // Get target info from current targets (best we can do)
        const targets = Array.from(game.user.targets);
        const targetId = targets.length === 1 ? targets[0].actor?.uuid : null;

        if (attackerId && targetId) {
          // Create a key combining attacker and target
          const attackKey = `${attackerId}-${targetId}`;

          this.recentAttackRolls.set(attackKey, {
            isDragon: true,
            timestamp: Date.now(),
            messageId: message.id,
          });

          // Clean up old entries
          this._cleanupOldAttackRolls();
        }
      }
    } catch (error) {
      console.error(`${this.moduleId} | Error storing attack roll:`, error);
    }
  }

  /**
   * Store damage roll info for correlation with damage application
   */
  _storeDamageRoll(message) {
    try {
      // Extract attacker and target from damage roll
      const damageRollData = this._extractDamageRollData(message);
      if (!damageRollData) return;

      // Look up dragon status from recent attack rolls
      const attackerId = message.speaker?.actor || message.speaker?.token;
      const attackKey = `${attackerId}-${damageRollData.targetId}`;

      const attackRoll = this.recentAttackRolls.get(attackKey);
      const isCritical = attackRoll ? attackRoll.isDragon : false;

      // Store with timeout cleanup
      this.recentDamageRolls.set(damageRollData.targetId, {
        attackerName: damageRollData.attackerName,
        isCritical: isCritical,
        timestamp: Date.now(),
        messageId: message.id,
      });

      // Clean up the used attack roll
      if (attackRoll) {
        this.recentAttackRolls.delete(attackKey);
      }

      // Clean up old entries
      this._cleanupOldDamageRolls();
    } catch (error) {
      console.error(`${this.moduleId} | Error storing damage roll:`, error);
    }
  }

  /**
   * Process damage application message and check for Unforgiving targets
   */
  async _processDamageApplication(message) {
    try {
      // Extract damage application data
      const damageData = this._extractDamageApplicationData(message);
      if (!damageData) return;

      // Find corresponding damage roll
      const damageRollInfo = this.recentDamageRolls.get(damageData.targetId);
      if (!damageRollInfo) return;

      // Get target actor
      const targetActor = await fromUuid(damageData.targetId);
      if (!targetActor) return;

      // Check if target has Unforgiving kin ability
      if (!this._hasUnforgivingAbility(targetActor)) return;

      // Skip if no actual damage dealt
      if (damageData.finalDamage <= 0) return;

      // Get scene name for location
      const sceneName = this._getSceneName();

      // Show grudge tracking option
      await this._displayGrudgeTrackingOption(
        targetActor,
        damageRollInfo.attackerName,
        damageData.finalDamage,
        sceneName,
        message.speaker,
        damageRollInfo.isCritical
      );

      // Mark as processed
      await message.setFlag(this.moduleId, "grudgeTracked", true);

      // Clean up the stored damage roll
      this.recentDamageRolls.delete(damageData.targetId);
    } catch (error) {
      console.error(
        `${this.moduleId} | Error processing damage application:`,
        error
      );
    }
  }

  /**
   * Extract data from damage roll message (first message)
   */
  _extractDamageRollData(message) {
    try {
      const content = message.content;

      // Extract target ID from data-target-id
      const targetMatch = content.match(/data-target-id="([^"]+)"/);
      if (!targetMatch) return null;

      // Get attacker name from message speaker
      const attackerName =
        message.speaker?.alias || message.speaker?.name || "Unknown Attacker";

      return {
        targetId: targetMatch[1],
        attackerName: attackerName.trim(),
      };
    } catch (error) {
      console.error(
        `${this.moduleId} | Error extracting damage roll data:`,
        error
      );
      return null;
    }
  }

  /**
   * Extract data from damage application message (second message)
   */
  _extractDamageApplicationData(message) {
    try {
      const content = message.content;

      // Extract actor ID
      const actorMatch = content.match(/data-actor-id="([^"]+)"/);
      if (!actorMatch) return null;

      // Extract final damage amount
      const damageMatch = content.match(/data-damage="(\d+)"/);
      if (!damageMatch) return null;

      return {
        targetId: actorMatch[1],
        finalDamage: parseInt(damageMatch[1], 10),
      };
    } catch (error) {
      console.error(
        `${this.moduleId} | Error extracting damage application data:`,
        error
      );
      return null;
    }
  }

  /**
   * Check if actor has Unforgiving kin ability
   */
  _hasUnforgivingAbility(actor) {
    if (!actor) return false;

    // Find the kin item
    const kinItem = actor.items.find((i) => i.type === "kin");
    if (!kinItem) return false;

    // Check if the abilities include 'Unforgiving'
    const abilities = kinItem.system?.abilities;
    if (!abilities) return false;

    // Check if abilities contains 'Unforgiving' (case insensitive)
    return abilities.toLowerCase().includes("unforgiving");
  }

  /**
   * Get current scene name for location column
   */
  _getSceneName() {
    const scene = game.scenes.active || game.scenes.current;
    if (!scene)
      return game.i18n.localize(
        "DRAGONBANE_ACTION_RULES.grudgeTracker.unknownLocation"
      );

    // Use navigation name if available, otherwise scene name
    return scene.navigation?.name || scene.name;
  }

  /**
   * Display grudge tracking option with button
   */
  async _displayGrudgeTrackingOption(
    targetActor,
    attackerName,
    damage,
    sceneName,
    speaker,
    isCritical = false
  ) {
    // Build the text with selective bolding
    const damageText = game.i18n.format(
      "DRAGONBANE_ACTION_RULES.grudgeTracker.damageReceived",
      {
        actorName: `<strong>${targetActor.name}</strong>`,
        attackerName: `<strong>${attackerName}</strong>`,
        damage: `<strong>${damage}</strong>`,
      }
    );

    const content = `<div style="text-align: left; margin-bottom: 8px;">${damageText}</div>`;

    const buttonHtml = this._buildAddToGrudgeListButton(
      targetActor,
      attackerName,
      damage,
      sceneName,
      isCritical
    );

    const chatContent = `<div class="dragonbane-action-rules">
            ${content}
            ${buttonHtml}
        </div>`;

    await ChatMessage.create({
      content: chatContent,
      speaker: {
        alias: game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.grudgeTracker.speakerName"
        ),
      },
      flags: {
        [this.moduleId]: {
          dragonbaneRulesMessage: true,
          grudgeTrackingMessage: true,
        },
      },
    });
  }

  /**
   * Build the "Add to Grudge List" button
   */
  _buildAddToGrudgeListButton(
    targetActor,
    attackerName,
    damage,
    sceneName,
    isCritical = false
  ) {
    const buttonText = game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.grudgeTracker.addToGrudgeList"
    );

    return `
            <div class="weapon-actions" style="margin-top: 8px; text-align: center;">
                <button class="chat-button add-to-grudge-list" 
                        data-actor-id="${targetActor.uuid}" 
                        data-attacker-name="${attackerName}"
                        data-damage="${damage}"
                        data-location="${sceneName}"
                        data-critical="${isCritical}">
                    ${buttonText}
                </button>
            </div>`;
  }

  /**
   * Add entry to grudge list journal
   */
  async addToGrudgeList(
    actorId,
    attackerName,
    damage,
    location,
    isCritical = false
  ) {
    try {
      const actor = await fromUuid(actorId);
      if (!actor) {
        ui.notifications.error(
          game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.grudgeTracker.errors.actorNotFound"
          )
        );
        return;
      }

      // Check permissions
      if (!actor.isOwner && !game.user.isGM) {
        ui.notifications.warn(
          game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.grudgeTracker.errors.noPermission"
          )
        );
        return;
      }

      // Get or create grudge list journal
      const journal = await this._getOrCreateGrudgeJournal(actor);
      if (!journal) return;

      // Add entry to journal
      await this._addGrudgeEntry(
        journal,
        attackerName,
        damage,
        location,
        isCritical
      );

      // Success notification
      ui.notifications.info(
        game.i18n.format(
          "DRAGONBANE_ACTION_RULES.grudgeTracker.addedToGrudgeList",
          {
            attackerName: attackerName,
            actorName: actor.name,
          }
        )
      );

      DragonbaneUtils.debugLog(
        this.moduleId,
        "GrudgeTracker",
        `Added ${attackerName} to grudge list for ${actor.name}${
          isCritical ? " (CRITICAL)" : ""
        }`
      );
    } catch (error) {
      console.error(`${this.moduleId} | Error adding to grudge list:`, error);
      ui.notifications.error(
        game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.grudgeTracker.errors.addFailed"
        )
      );
    }
  }

  /**
   * Delete a grudge entry from the journal
   */
  async deleteGrudgeEntry(journalId, rowId) {
    try {
      const journal = game.journal.get(journalId);
      if (!journal) {
        ui.notifications.error(
          game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.grudgeTracker.errors.journalNotFound"
          )
        );
        return;
      }

      // Check permissions
      if (!journal.isOwner && !game.user.isGM) {
        ui.notifications.warn(
          game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.grudgeTracker.errors.noPermission"
          )
        );
        return;
      }

      const page = journal.pages.contents[0];
      if (!page) return;

      // Get current content and remove the row
      const currentContent = page.text.content;

      // Create regex to match the entire row including any whitespace
      const rowRegex = new RegExp(
        `\\s*<tr id="${rowId}"[\\s\\S]*?<\\/tr>`,
        "g"
      );
      const updatedContent = currentContent.replace(rowRegex, "");

      // Update journal page
      await page.update({
        "text.content": updatedContent,
      });

      ui.notifications.info(
        game.i18n.localize("DRAGONBANE_ACTION_RULES.grudgeTracker.entryDeleted")
      );

      DragonbaneUtils.debugLog(
        this.moduleId,
        "GrudgeTracker",
        `Deleted grudge entry ${rowId} from ${journal.name}`
      );
    } catch (error) {
      console.error(`${this.moduleId} | Error deleting grudge entry:`, error);
      ui.notifications.error(
        game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.grudgeTracker.errors.deleteFailed"
        )
      );
    }
  }

  /**
   * Get existing or create new grudge list journal
   */
  async _getOrCreateGrudgeJournal(actor) {
    const journalName = game.i18n.format(
      "DRAGONBANE_ACTION_RULES.grudgeTracker.journalName",
      {
        actorName: actor.name,
      }
    );

    // Look for existing journal
    let journal = game.journal.getName(journalName);

    if (!journal) {
      // Get or create the localized folder name
      const folderName = game.i18n.localize(
        "DRAGONBANE_ACTION_RULES.grudgeTracker.folderName"
      );
      let folder = game.folders.find(
        (f) => f.name === folderName && f.type === "JournalEntry"
      );

      if (!folder) {
        folder = await Folder.create({
          name: folderName,
          type: "JournalEntry",
          color: "#00604d", // Use the module's green color
        });
      }

      // Create new journal in the folder
      const journalData = {
        name: journalName,
        folder: folder.id,
        ownership: this._getJournalOwnership(actor),
        pages: [
          {
            name: game.i18n.localize(
              "DRAGONBANE_ACTION_RULES.grudgeTracker.pageTitle"
            ),
            type: "text",
            title: {
              show: false, // Hide the page title
            },
            text: {
              content: this._createInitialGrudgeTableHTML(),
              format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,
            },
          },
        ],
      };

      try {
        journal = await JournalEntry.create(journalData);
        DragonbaneUtils.debugLog(
          this.moduleId,
          "GrudgeTracker",
          `Created grudge journal: ${journalName} in folder: ${folderName}`
        );
      } catch (error) {
        console.error(
          `${this.moduleId} | Error creating grudge journal:`,
          error
        );
        ui.notifications.error(
          game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.grudgeTracker.errors.journalCreateFailed"
          )
        );
        return null;
      }
    }

    return journal;
  }

  /**
   * Get proper journal ownership (player + GM)
   */
  _getJournalOwnership(actor) {
    const ownership = { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE };

    // GM always has owner access
    game.users
      .filter((u) => u.isGM)
      .forEach((gm) => {
        ownership[gm.id] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
      });

    // Actor owners get access
    Object.entries(actor.ownership || {}).forEach(([userId, level]) => {
      if (level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {
        ownership[userId] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
      }
    });

    return ownership;
  }

  /**
   * Create initial grudge table HTML with original styling and delete column
   */
  _createInitialGrudgeTableHTML() {
    return `<div class="display-generic-table" style="padding-top: 20px;">
            <table>
                <thead>
                    <tr style="color: white; background-color: rgba(74, 36, 7, 0.8);">
                        <th style="color: white;">${game.i18n.localize(
                          "DRAGONBANE_ACTION_RULES.grudgeTracker.dateColumn"
                        )}</th>
                        <th style="color: white;">${game.i18n.localize(
                          "DRAGONBANE_ACTION_RULES.grudgeTracker.enemyColumn"
                        )}</th>
                        <th style="color: white; text-align: center;">${game.i18n.localize(
                          "DRAGONBANE_ACTION_RULES.grudgeTracker.damageColumn"
                        )}</th>
                        <th style="color: white;">${game.i18n.localize(
                          "DRAGONBANE_ACTION_RULES.grudgeTracker.locationColumn"
                        )}</th>
                        <th style="color: white; text-align: center; width: 40px;"></th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        </div>`;
  }

  /**
   * Add new grudge entry to journal table with delete button and critical indicator
   */
  async _addGrudgeEntry(
    journal,
    attackerName,
    damage,
    location,
    isCritical = false
  ) {
    const page = journal.pages.contents[0];
    if (!page) return;

    // Parse current content
    const currentContent = page.text.content;
    const date = new Date().toLocaleDateString();

    // Generate unique ID for this row
    const rowId = `grudge-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Format damage with critical indicator
    const damageDisplay = isCritical ? `${damage} 💥` : damage;

    // Create new row HTML with delete button (original simple styling)
    const newRow = `
                    <tr id="${rowId}">
                        <td>${date}</td>
                        <td><strong>${attackerName}</strong></td>
                        <td style="text-align: center;">${damageDisplay}</td>
                        <td>${location}</td>
                        <td style="text-align: center;">
                            <button class="grudge-delete-btn" 
                                    data-row-id="${rowId}" 
                                    data-journal-id="${journal.id}"
                                    style="background: #8b2635; color: white; border: 1px solid #5d1a23; border-radius: 3px; width: 20px; height: 20px; font-size: 12px; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; line-height: 1;"
                                    title="${game.i18n.localize(
                                      "DRAGONBANE_ACTION_RULES.grudgeTracker.deleteEntry"
                                    )}">×</button>
                        </td>
                    </tr>`;

    // Insert new row into tbody
    const updatedContent = currentContent.replace(
      /<\/tbody>/,
      `${newRow}
                </tbody>`
    );

    // Update journal page
    await page.update({
      "text.content": updatedContent,
    });
  }

  /**
   * Clean up old damage roll entries
   */
  _cleanupOldDamageRolls() {
    const now = Date.now();
    for (const [key, value] of this.recentDamageRolls.entries()) {
      if (now - value.timestamp > this.damageRollTimeout) {
        this.recentDamageRolls.delete(key);
      }
    }
  }

  /**
   * Clean up old attack roll entries
   */
  _cleanupOldAttackRolls() {
    const now = Date.now();
    for (const [key, value] of this.recentAttackRolls.entries()) {
      if (now - value.timestamp > this.attackRollTimeout) {
        this.recentAttackRolls.delete(key);
      }
    }
  }

  /**
   * Debug logging
   */
  debugLog(message) {
    DragonbaneUtils.debugLog(this.moduleId, "GrudgeTracker", message);
  }
}
