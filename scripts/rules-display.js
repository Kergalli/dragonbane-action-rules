/**
 * Dragonbane Combat Assistant - Rules Display
 */

import { SETTINGS, getSetting } from "./settings.js";
import { DragonbaneUtils } from "./utils.js";

export class DragonbaneRulesDisplay {
  constructor(moduleId, patternManager) {
    this.moduleId = moduleId;
    this.patternManager = patternManager;
  }

  /**
   * Handle chat message for rule display - main entry point
   */
  onChatMessage(message) {
    try {
      // Skip if patterns aren't initialized yet
      if (!this.patternManager.areInitialized()) return;

      // Skip if already a rules message
      if (message.getFlag(this.moduleId, "dragonbaneRulesMessage")) return;

      const content = message.content;
      if (!content) return;

      // Handle different message types
      this._handleEvadeSkillRoll(message);
      this._handleActionMessage(message, content);
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Error processing chat message: ${error.message}`);
      }
    }
  }

  /**
   * Handle action-related messages
   */
  _handleActionMessage(message, content) {
    // Check for special action pattern
    const actionMatch = this.patternManager.getActionMatch(content);
    if (actionMatch) {
      if (!this.patternManager.isSuccessfulAction(content)) return;
      if (!this._shouldCreateRules(message)) return;

      this._processSpecialAction(message, actionMatch);
      return;
    }

    // Check for regular melee attacks
    if (this.patternManager.isSuccessfulAction(content)) {
      if (!this._shouldCreateRules(message)) return;
      this._processRegularMeleeAttack(message);
    }
  }

  /**
   * Process special action and display rules
   */
  async _processSpecialAction(message, actionMatch) {
    const action = actionMatch[1].toLowerCase();
    const normalizedAction = this._normalizeAction(action);

    const ruleData = await this._generateRuleData(normalizedAction, message);
    if (ruleData.content) {
      await this._displayRules(
        normalizedAction,
        ruleData.content,
        ruleData.weapon,
        message.speaker
      );
    }
  }

  /**
   * Normalize action name for consistent processing - maps localized terms back to English keys
   */
  _normalizeAction(action) {
    const actionLower = action.toLowerCase();

    // Get current localized terms for reverse mapping
    const localizedTerms = {
      parry: (
        game.i18n.localize("DoD.attackTypes.parry") || "parry"
      ).toLowerCase(),
      topple: (
        game.i18n.localize("DoD.attackTypes.topple") || "topple"
      ).toLowerCase(),
      disarm: (
        game.i18n.localize("DoD.attackTypes.disarm") || "disarm"
      ).toLowerCase(),
      weakspot: (
        game.i18n.localize("DoD.attackTypes.weakpoint") || "weakpoint"
      ).toLowerCase(), // Key is weakspot, localization is weakpoint
    };

    // Reverse map localized terms to English keys
    for (const [englishKey, localizedTerm] of Object.entries(localizedTerms)) {
      if (actionLower === localizedTerm) {
        return englishKey;
      }
    }

    // Handle English variations for weakspot
    if (
      actionLower === "find weak spot" ||
      actionLower === "weakpoint" ||
      actionLower === "weak spot"
    ) {
      return "weakspot";
    }

    // Fallback to original if no mapping found
    return actionLower;
  }

  /**
   * Generate rule data for specific action
   */
  async _generateRuleData(normalizedAction, message) {
    let weapon = null;
    let content = "";

    switch (normalizedAction) {
      case "parry":
        weapon = DragonbaneUtils.extractWeaponFromMessage(message);
        const dragonRolled = DragonbaneUtils.detectDragonRoll(message);
        const actor = DragonbaneUtils.getActorFromMessage(message);
        const parryResult = this._getParryRules(weapon, dragonRolled, actor);
        content = parryResult.content;
        weapon = parryResult.weapon;
        break;

      case "topple":
        weapon = DragonbaneUtils.extractWeaponFromMessage(message);
        const toppleActor = DragonbaneUtils.getActorFromMessage(message);
        content = this._getToppleRules(weapon, toppleActor);
        break;

      case "disarm":
        weapon = DragonbaneUtils.extractWeaponFromMessage(message);
        const disarmActor = DragonbaneUtils.getActorFromMessage(message);
        content = this._getDisarmRules(weapon, disarmActor);
        break;

      case "weakspot":
        weapon = DragonbaneUtils.extractWeaponFromMessage(message);
        const weakspotActor = DragonbaneUtils.getActorFromMessage(message);
        content = this._getWeakspotRules(weapon, weakspotActor, message);
        break;

      default:
        content = this._getActionRules(normalizedAction);
    }

    return { content, weapon };
  }

  /**
   * Process regular melee attack for potential shove reminder
   */
  async _processRegularMeleeAttack(message) {
    try {
      const actor = DragonbaneUtils.getActorFromMessage(message);
      const shoveRule = this._getShoveRuleIfApplicable(message, actor);

      if (shoveRule) {
        await this._displayShoveRule(shoveRule);
      }
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error processing regular melee attack: ${error.message}`
        );
      }
    }
  }

  /**
   * Handle EVADE skill rolls for PCs and NPCs
   */
  async _handleEvadeSkillRoll(message) {
    try {
      // Check if dodge movement reminders are enabled
      if (
        !DragonbaneUtils.getSetting(
          this.moduleId,
          "enableDodgeMovementReminders",
          true
        )
      )
        return;

      // Only process successful actions
      if (!this.patternManager.isSuccessfulAction(message.content)) return;

      // Check if this is from a monster - if so, skip
      const actor = DragonbaneUtils.getActorFromMessage(message);
      if (DragonbaneUtils.isMonsterActor(actor)) return;

      // Detect EVADE skill roll
      const isEvade = this._isEvadeSkillRoll(message);
      if (!isEvade) return;

      // Prevent duplicate rules
      if (!DragonbaneUtils.shouldCreateRules(message)) return;

      await this._displayEvadeMovementRule();
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error handling EVADE skill roll: ${error.message}`
        );
      }
    }
  }

  /**
   * Check if this is an EVADE skill roll (simplified)
   */
  _isEvadeSkillRoll(message) {
    // Try UUID-based detection first (most reliable)
    const skill = DragonbaneUtils.extractSkillFromMessage(message);
    if (skill && DragonbaneUtils.isEvadeSkill(skill)) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "RulesDisplay",
        "EVADE skill roll detected via UUID"
      );
      return true;
    }

    // Simple text fallback if no UUID found
    if (DragonbaneUtils.isEvadeSkillRollFromText(message.content)) {
      DragonbaneUtils.debugLog(
        this.moduleId,
        "RulesDisplay",
        "EVADE skill roll detected via text pattern"
      );
      return true;
    }

    return false;
  }

  /**
   * Determine if this client should create the rules message
   */
  _shouldCreateRules(message) {
    return DragonbaneUtils.shouldCreateRules(message);
  }

  // Rule generation methods
  _getParryRules(weapon, dragonRolled = false, actor = null) {
    const showDurability = getSetting(
      this.moduleId,
      SETTINGS.SHOW_PARRY_DURABILITY,
      true
    );
    const isMonster = DragonbaneUtils.isMonsterActor(actor);
    let content = "";

    if (showDurability && !isMonster) {
      if (weapon) {
        const durability = weapon.system?.durability || 0;
        const weaponName =
          weapon.name ||
          game.i18n.localize("DRAGONBANE_ACTION_RULES.unknownWeapon");
        content += `<li><strong>${weaponName} ${game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.durability"
        )}:</strong> ${durability}</li>`;
      }
    }

    content += this._getParryRulesList(dragonRolled, isMonster);
    return { content, weapon: isMonster ? null : weapon };
  }

  _getParryRulesList(dragonRolled = false, isMonster = false) {
    const dragonRule = dragonRolled
      ? `<li><strong class="dragon-highlight">${game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.parry.dragon"
        )}</strong></li>`
      : `<li>${game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.parry.dragon"
        )}</li>`;

    let rules = `<li>${game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.parry.reaction"
    )}</li>
                     <li>${game.i18n.localize(
                       "DRAGONBANE_ACTION_RULES.parry.success"
                     )}</li>`;

    rules += dragonRule;
    rules += `<li>${game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.parry.piercing"
    )}</li>`;

    if (!isMonster) {
      rules += `<li>${game.i18n.localize(
        "DRAGONBANE_ACTION_RULES.parry.monster"
      )}</li>`;
    }

    if (
      getSetting(this.moduleId, SETTINGS.ENABLE_PARRY_MOVEMENT_REMINDERS, true)
    ) {
      if (isMonster) {
        rules += `<li><strong>${game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.parry.ifParrying"
        )}</strong> ${game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.parry.movement"
        )}</li>`;
      } else {
        rules += `<li>${game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.parry.movement"
        )}</li>`;
      }
    }

    if (
      isMonster &&
      getSetting(this.moduleId, SETTINGS.ENABLE_DODGE_MOVEMENT_REMINDERS, true)
    ) {
      rules += `<li>${game.i18n.localize(
        "DRAGONBANE_ACTION_RULES.parry.dodgeMovement"
      )}</li>`;
    }

    return rules;
  }

  _getToppleRules(weapon, actor = null) {
    let content = "";

    if (weapon && DragonbaneUtils.hasToppleFeature(weapon)) {
      const weaponName =
        weapon.name ||
        game.i18n.localize("DRAGONBANE_ACTION_RULES.unknownWeapon");
      const toppleBonus = this._getToppleBonus(weapon);
      content += `<li><strong>${weaponName} ${game.i18n.localize(
        "DRAGONBANE_ACTION_RULES.topple.weaponFeature"
      )}:</strong> ${toppleBonus}</li>`;
    }

    content += `<li>${game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.topple.noDamage"
    )}</li>
                    <li>${game.i18n.localize(
                      "DRAGONBANE_ACTION_RULES.topple.evadeRoll"
                    )}</li>
                    <li>${game.i18n.localize(
                      "DRAGONBANE_ACTION_RULES.topple.cannotDefend"
                    )}</li>
                    <li>${game.i18n.localize(
                      "DRAGONBANE_ACTION_RULES.topple.success"
                    )}</li>`;

    const target = DragonbaneUtils.getCurrentTarget();
    if (target && DragonbaneUtils.isMonsterActor(target)) {
      content += `<li>${game.i18n.localize(
        "DRAGONBANE_ACTION_RULES.topple.monsterRule"
      )}</li>`;
    }

    return content;
  }

  _getDisarmRules(weapon, actor = null) {
    return `<li>${game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.disarm.noDamage"
    )}</li>
                <li>${game.i18n.localize(
                  "DRAGONBANE_ACTION_RULES.disarm.skillRoll"
                )}</li>
                <li>${game.i18n.localize(
                  "DRAGONBANE_ACTION_RULES.disarm.cannotDefend"
                )}</li>
                <li>${game.i18n.localize(
                  "DRAGONBANE_ACTION_RULES.disarm.twoHanded"
                )}</li>
                <li>${game.i18n.localize(
                  "DRAGONBANE_ACTION_RULES.disarm.success"
                )}</li>
                <li>${game.i18n.localize(
                  "DRAGONBANE_ACTION_RULES.disarm.limitations"
                )}</li>`;
  }

  _getWeakspotRules(weapon, actor = null, message = null) {
    let content = `<li>${game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.weakspot.piercing"
    )}</li>
              <li>${game.i18n.localize(
                "DRAGONBANE_ACTION_RULES.weakspot.bane"
              )}</li>
              <li>${game.i18n.localize(
                "DRAGONBANE_ACTION_RULES.weakspot.success"
              )}</li>`;

    if (message) {
      const shoveRule = this._getShoveRuleIfApplicable(message, actor);
      if (shoveRule) {
        content += `<li>${shoveRule}</li>`;
      }
    }

    return content;
  }

  _getActionRules(action) {
    const ruleGenerators = {
      topple: () => this._getToppleRules(),
      disarm: () => this._getDisarmRules(),
      weakspot: () => this._getWeakspotRules(),
    };

    return ruleGenerators[action] ? ruleGenerators[action]() : null;
  }

  _getShoveRuleIfApplicable(message, actor) {
    if (!getSetting(this.moduleId, SETTINGS.ENABLE_SHOVE_REMINDERS, true))
      return "";
    if (DragonbaneUtils.isSpellAttack(message)) return "";
    if (!this.patternManager.isAttackTypeAllowedForShove(message.content))
      return "";
    if (!actor || DragonbaneUtils.isMonsterActor(actor)) return "";

    const target = DragonbaneUtils.getCurrentTarget();
    if (!target || DragonbaneUtils.isMonsterActor(target)) return "";

    if (this._canShove(actor, target)) {
      const targetName =
        target.name ||
        game.i18n.localize("DRAGONBANE_ACTION_RULES.shove.defaultTarget");
      return game.i18n.format("DRAGONBANE_ACTION_RULES.shove.available", {
        targetName: targetName,
      });
    }

    return "";
  }

  _canShove(attacker, defender) {
    const attackerBonus = DragonbaneUtils.extractStrDamageBonus(attacker);
    const defenderBonus = DragonbaneUtils.extractStrDamageBonus(defender);

    DragonbaneUtils.debugLog(
      this.moduleId,
      "RulesDisplay",
      `Shove check: ${attacker.name} D${attackerBonus} vs ${defender.name} D${defenderBonus}`
    );
    return attackerBonus >= defenderBonus;
  }

  _getToppleBonus(weapon) {
    if (!weapon || !DragonbaneUtils.hasToppleFeature(weapon)) return "";
    return game.i18n.localize("DRAGONBANE_ACTION_RULES.topple.boonBonus");
  }

  // Display methods
  async _displayRules(action, content, weapon = null, speaker = null) {
    const delay = getSetting(this.moduleId, SETTINGS.DELAY, 3000);

    const actionName = game.i18n.localize(
      `DRAGONBANE_ACTION_RULES.actions.${action}`
    );
    const speakerName = game.i18n.format(
      "DRAGONBANE_ACTION_RULES.speakers.generic",
      { action: actionName }
    );

    let chatContent = `<div class="dragonbane-action-rules"><ul>${content}</ul>`;

    // Add weapon broken button for parry with weapon
    if (action === "parry" && weapon && speaker && !weapon.system?.broken) {
      chatContent += this._buildWeaponBrokenButton(weapon, speaker);
    }

    chatContent += `</div>`;

    setTimeout(async () => {
      try {
        await ChatMessage.create({
          content: chatContent,
          speaker: { alias: speakerName },
          flags: {
            [this.moduleId]: {
              dragonbaneRulesMessage: true,
            },
          },
        });
      } catch (error) {
        if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
          DoD_Utility.WARNING(`Error creating chat message: ${error.message}`);
        }
      }
    }, delay);
  }

  async _displayEvadeMovementRule() {
    const delay = DragonbaneUtils.getSetting(this.moduleId, "delay", 3000);
    const speakerName = game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.speakers.evade"
    );
    const content = `${game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.evade.movementAvailable"
    )}`;
    const chatContent = `<div class="dragonbane-action-rules">${content}</div>`;

    setTimeout(async () => {
      try {
        await ChatMessage.create({
          content: chatContent,
          speaker: { alias: speakerName },
          flags: {
            [this.moduleId]: {
              dragonbaneRulesMessage: true,
            },
          },
        });
      } catch (error) {
        if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
          DoD_Utility.WARNING(
            `Error creating evade movement chat message: ${error.message}`
          );
        }
      }
    }, delay);
  }

  async _displayShoveRule(content) {
    const delay = DragonbaneUtils.getSetting(this.moduleId, "delay", 3000);
    const speakerName = game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.speakers.shove"
    );
    const chatContent = `<div class="dragonbane-action-rules">${content}</div>`;

    setTimeout(async () => {
      try {
        await ChatMessage.create({
          content: chatContent,
          speaker: { alias: speakerName },
          flags: {
            [this.moduleId]: {
              dragonbaneRulesMessage: true,
            },
          },
        });
      } catch (error) {
        if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
          DoD_Utility.WARNING(
            `Error creating shove chat message: ${error.message}`
          );
        }
      }
    }, delay);
  }

  _buildWeaponBrokenButton(weapon, speaker) {
    const buttonText = game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.weaponBroken.buttonText"
    );
    return `
            <div class="weapon-actions" style="margin-top: 8px; text-align: center;">
                <button class="chat-button weapon-roll mark-weapon-broken" 
                        data-weapon-id="${weapon.id}" 
                        data-actor-id="${speaker.actor || ""}"
                        data-scene-id="${speaker.scene || ""}"
                        data-token-id="${speaker.token || ""}">
                    ${buttonText}
                </button>
            </div>`;
  }

  async markWeaponBroken(weaponId, actorId, sceneId = null, tokenId = null) {
    try {
      const speakerData = {
        actor: actorId,
        scene: sceneId,
        token: tokenId,
      };

      const actor = DragonbaneUtils.getActorFromSpeakerData(speakerData);

      if (!actor) {
        ui.notifications.error(
          game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.weaponBroken.errors.actorNotFound"
          )
        );
        return;
      }

      const weapon = actor.items.get(weaponId);
      if (!weapon) {
        ui.notifications.error(
          game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.weaponBroken.errors.weaponNotFound"
          )
        );
        return;
      }

      if (!actor.isOwner && !game.user.isGM) {
        ui.notifications.warn(
          game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.weaponBroken.errors.noPermission"
          )
        );
        return;
      }

      if (weapon.system.broken) {
        ui.notifications.info(
          game.i18n.format(
            "DRAGONBANE_ACTION_RULES.weaponBroken.errors.alreadyBroken",
            { weaponName: weapon.name }
          )
        );
        return;
      }

      const confirmed = await new Promise((resolve) => {
        new Dialog({
          title: game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.weaponBroken.dialogTitle"
          ),
          content: `<p>${game.i18n.format(
            "DRAGONBANE_ACTION_RULES.weaponBroken.dialogContent",
            { weaponName: weapon.name }
          )}</p><p><em>${game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.weaponBroken.dialogExplanation"
          )}</em></p>`,
          buttons: {
            yes: {
              icon: '<i class="fas fa-check"></i>',
              label: game.i18n.localize(
                "DRAGONBANE_ACTION_RULES.weaponBroken.confirmButton"
              ),
              callback: () => resolve(true),
            },
            no: {
              icon: '<i class="fas fa-times"></i>',
              label: game.i18n.localize(
                "DRAGONBANE_ACTION_RULES.weaponBroken.cancelButton"
              ),
              callback: () => resolve(false),
            },
          },
          default: "no",
          close: () => resolve(false),
        }).render(true);
      });

      if (!confirmed) return;

      await weapon.update({ "system.broken": true });
      ui.notifications.info(
        game.i18n.format("DRAGONBANE_ACTION_RULES.weaponBroken.success", {
          weaponName: weapon.name,
        })
      );
      DragonbaneUtils.debugLog(
        this.moduleId,
        "RulesDisplay",
        `Weapon ${weapon.name} marked as broken by ${game.user.name}`
      );
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(`Error marking weapon broken: ${error.message}`);
      }
      ui.notifications.error(
        game.i18n.localize(
          "DRAGONBANE_ACTION_RULES.weaponBroken.errors.updateFailed"
        )
      );
    }
  }
}
