/**
 * Dragonbane Combat Assistant - Grudge Tracker
 * Handles tracking of damage dealt to characters with Unforgiving kin ability
 */

import { DragonbaneUtils } from "./utils.js";

export class DragonbaneGrudgeTracker {
  constructor(moduleId) {
    this.moduleId = moduleId;
    this.recentDamageRolls = new Map(); // Cache recent damage rolls for correlation
    this.damageRollTimeout = 10000; // 10 seconds to correlate damage messages
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
   * Store damage roll info for correlation with damage application
   */
  _storeDamageRoll(message) {
    try {
      // Extract attacker and target from damage roll
      const damageRollData = this._extractDamageRollData(message);
      if (!damageRollData) return;

      // Store with timeout cleanup
      this.recentDamageRolls.set(damageRollData.targetId, {
        attackerName: damageRollData.attackerName,
        timestamp: Date.now(),
        messageId: message.id,
      });

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
        message.speaker
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
    speaker
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
      sceneName
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
  _buildAddToGrudgeListButton(targetActor, attackerName, damage, sceneName) {
    const buttonText = game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.grudgeTracker.addToGrudgeList"
    );

    return `
            <div class="weapon-actions" style="margin-top: 8px; text-align: center;">
                <button class="chat-button add-to-grudge-list" 
                        data-actor-id="${targetActor.uuid}" 
                        data-attacker-name="${attackerName}"
                        data-damage="${damage}"
                        data-location="${sceneName}">
                    ${buttonText}
                </button>
            </div>`;
  }

  /**
   * Add entry to grudge list journal
   */
  async addToGrudgeList(actorId, attackerName, damage, location) {
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
      await this._addGrudgeEntry(journal, attackerName, damage, location);

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
        `Added ${attackerName} to grudge list for ${actor.name}`
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
              show: true, // Show the page title
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
   * Create initial grudge table HTML with Dragonbane styling
   */
  _createInitialGrudgeTableHTML() {
    return `<div class="display-generic-table">
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
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        </div>`;
  }

  /**
   * Add new grudge entry to journal table
   */
  async _addGrudgeEntry(journal, attackerName, damage, location) {
    const page = journal.pages.contents[0];
    if (!page) return;

    // Parse current content
    const currentContent = page.text.content;
    const date = new Date().toLocaleDateString();

    // Create new row HTML with centered damage column
    const newRow = `
                    <tr>
                        <td>${date}</td>
                        <td><strong>${attackerName}</strong></td>
                        <td style="text-align: center;">${damage}</td>
                        <td>${location}</td>
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
   * Debug logging
   */
  debugLog(message) {
    DragonbaneUtils.debugLog(this.moduleId, "GrudgeTracker", message);
  }
}
