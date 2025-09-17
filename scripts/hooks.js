/**
 * Dragonbane Combat Assistant - Hook Registration
 */

import { DragonbaneUtils } from "./utils.js";

// Store original methods for Token Action HUD override
const originalMethods = new Map();

/**
 * Register all module hooks
 */
export function registerHooks(moduleId) {
  Hooks.on("createChatMessage", async (message) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;

    try {
      // Magic Trick AA support - add buttons early for AA detection
      addMagicTrickButtonsToMessage(message);

      // Rules display processing
      if (DragonbaneActionRules.rulesDisplay?.onChatMessage) {
        DragonbaneActionRules.rulesDisplay.onChatMessage(message);
      }

      // YZE integration action detection
      if (DragonbaneActionRules.yzeIntegration?.onChatMessageAction) {
        await DragonbaneActionRules.yzeIntegration.onChatMessageAction(message);
      }

      // Grudge tracker processing
      if (
        DragonbaneUtils.getSetting(moduleId, "enableGrudgeTracking", true) &&
        game.user.isGM
      ) {
        if (DragonbaneActionRules.grudgeTracker?.onChatMessage) {
          DragonbaneActionRules.grudgeTracker.onChatMessage(message);
        }
      }

      // Spell status effect application for NEW messages only
      if (
        DragonbaneUtils.getSetting(moduleId, "enableSpellStatusEffects", true)
      ) {
        if (
          DragonbaneActionRules?.patternManager?.isSuccessfulAction &&
          DragonbaneActionRules?.spellLibrary
        ) {
          const messageContent = message.content || "";
          const spell = DragonbaneUtils.extractSpellFromMessage(message);

          if (spell && spell.type === "spell") {
            const isMagicTrick =
              spell.system.rank === 0 ||
              spell.system.school?.toLowerCase() === "general";

            const isSuccess =
              DragonbaneActionRules.patternManager.isSuccessfulAction(
                messageContent
              );

            if (isSuccess || isMagicTrick) {
              const excludedSpells = DragonbaneUtils.getSetting(
                moduleId,
                "excludedSpells",
                ""
              )
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0);

              if (!excludedSpells.includes(spell.name)) {
                // Only the message creator processes the effect
                if (message.user.id === game.user.id) {
                  // Small delay to ensure message is fully created
                  setTimeout(() => {
                    DragonbaneActionRules.spellLibrary.applySpellEffect(
                      spell,
                      message
                    );
                  }, 100);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error in chat message processing: ${error.message}`
        );
      }
    }
  });

  /**
   * Add Magic Trick buttons during createChatMessage for earlier AA detection
   */
  function addMagicTrickButtonsToMessage(message) {
    try {
      const content = message.content;

      // Look for Magic Trick pattern: actor casts spell with UUID
      const uuidMatch = content?.match(
        /@UUID\[Actor\.([^.]+)\.Item\.([^\]]+)\]/
      );
      if (uuidMatch) {
        const [, actorId, spellId] = uuidMatch;
        const actor = game.actors.get(actorId);
        const spell = actor?.items.get(spellId);

        // Check if Magic Trick (rank 0 or general school)
        if (spell && spell.type === "spell" && spell.system.damage === "n/a") {
          // ONLY add button for actual Magic Tricks
          const isMagicTrick =
            spell.system.rank === 0 ||
            spell.system.school?.toLowerCase() === "general";

          if (!isMagicTrick) {
            // Not a Magic Trick - don't add button!
            return;
          }

          // Only add button if it doesn't already exist (for actual Magic Tricks)
          if (!content.includes("magic-roll")) {
            // Add button with all required attributes (like real spell buttons)
            const buttonHTML = `<div class="permission-owner" data-actor-id="Actor.${actorId}">
                              <button class="chat-button magic-roll" 
                                     data-actor-id="Actor.${actorId}"
                                     data-spell-id="${spellId}"
                                     data-power-level="1"
                                     data-wp-cost="1"
                                     data-target-id="Actor.${actorId}"
                                     style="position: absolute; left: -9999px;">
                                Roll Damage
                              </button>
                            </div>`;

            // Inject button into message content
            const newContent = content + buttonHTML;
            message.updateSource({
              content: newContent,
            });

            DragonbaneUtils.debugLog(
              "dragonbane-action-rules",
              "MagicTrick",
              `Added early AA button for Magic Trick: ${spell.name}`
            );
          }
        }
      }
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error adding early Magic Trick buttons: ${error.message}`
        );
      }
    }
  }

  // Chat button interaction processing
  Hooks.on("renderChatMessage", (message, html, data) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;

    // Fix enhanced spell issues:
    // 1. Hide "Roll Damage" buttons but preserve "Choose" buttons
    hideEnhancedSpellButtons(html);

    // 2. Fix critical effects for enhanced spells (remove double damage + add Choose button)
    fixEnhancedSpellCriticalEffects(html);

    // Continue with existing logic for rules messages
    if (!message.getFlag(moduleId, "dragonbaneRulesMessage")) return;

    try {
      // Mark weapon broken button
      html.find(".mark-weapon-broken").click(async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const button = event.currentTarget;
        const weaponId = button.dataset.weaponId;
        const actorId = button.dataset.actorId;
        const sceneId = button.dataset.sceneId;
        const tokenId = button.dataset.tokenId;

        try {
          const speakerData = {
            actor: actorId,
            scene: sceneId,
            token: tokenId,
          };

          const actor = DragonbaneUtils.getActorFromSpeakerData(speakerData);

          if (!actor) {
            const errorMsg = `Failed to find actor with any method. ID was: ${actorId}`;
            if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
              DoD_Utility.WARNING(errorMsg);
            }
            ui.notifications.error(
              game.i18n.localize(
                "DRAGONBANE_ACTION_RULES.weaponBroken.errors.actorNotFound"
              )
            );
            return;
          }

          const weapon = actor.items.get(weaponId);
          if (!weapon) {
            ui.notifications.error("Weapon not found");
            return;
          }

          if (!actor.isOwner && !game.user.isGM) {
            ui.notifications.warn(
              "You don't have permission to modify this weapon"
            );
            return;
          }

          if (weapon.system.broken) {
            ui.notifications.info(`${weapon.name} is already broken`);
            return;
          }

          // Show confirmation dialog
          const confirmed = await new Promise((resolve) => {
            new Dialog({
              title: game.i18n.localize(
                "DRAGONBANE_ACTION_RULES.weaponBroken.dialogTitle"
              ),
              content: `<p>${game.i18n.format(
                "DRAGONBANE_ACTION_RULES.weaponBroken.dialogContent",
                { weaponName: weapon.name }
              )}</p>
                  <p><em>${game.i18n.localize(
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

          // Mark weapon as broken
          await weapon.update({ "system.broken": true });

          ui.notifications.info(
            game.i18n.format("DRAGONBANE_ACTION_RULES.weaponBroken.success", {
              weaponName: weapon.name,
            })
          );

          // Update button to show completion
          $(button)
            .text(
              game.i18n.localize(
                "DRAGONBANE_ACTION_RULES.weaponBroken.buttonTextCompleted"
              )
            )
            .prop("disabled", true);
        } catch (error) {
          const errorMsg = `Error marking weapon broken: ${error.message}`;
          if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
            DoD_Utility.WARNING(errorMsg);
          }
          ui.notifications.error("Failed to mark weapon broken");
        }
      });
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error in chat button processing: ${error.message}`
        );
      }
    }
  });

  // Support both v12 and v13 journal hooks
  registerJournalHooks(moduleId);

  // Grudge tracker button handler (separate hook since grudge messages don't have rules flag)
  Hooks.on("renderChatMessage", (message, html, data) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
    if (!DragonbaneUtils.getSetting(moduleId, "enableGrudgeTracking")) return;

    // Only process messages with grudge buttons
    if (!html.find(".add-to-grudge-list").length) return;

    try {
      html.find(".add-to-grudge-list").click(async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const button = event.currentTarget;
        const actorId = button.dataset.actorId;
        const attackerName = button.dataset.attackerName;
        const damage = button.dataset.damage;
        const location = button.dataset.location;
        const critical = button.dataset.critical === "true";

        if (DragonbaneActionRules.grudgeTracker?.addToGrudgeList) {
          try {
            await DragonbaneActionRules.grudgeTracker.addToGrudgeList(
              actorId,
              attackerName,
              damage,
              location,
              critical
            );

            // Update button to show completion
            $(button)
              .text(
                game.i18n.localize(
                  "DRAGONBANE_ACTION_RULES.grudgeTracker.buttonTextCompleted"
                )
              )
              .prop("disabled", true);
          } catch (error) {
            if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
              DoD_Utility.WARNING(
                `Error adding to grudge list: ${error.message}`
              );
            }
            ui.notifications.error("Failed to add to grudge list");
          }
        } else {
          if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
            DoD_Utility.WARNING("addToGrudgeList method not found");
          }
        }
      });
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error in grudge button processing: ${error.message}`
        );
      }
    }
  });

  // Monster action prevention - no more timed bypass system
  Hooks.on("preCreateChatMessage", (document, data, options, userId) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
    if (
      !DragonbaneUtils.getSetting(
        moduleId,
        "enforceMonsterActionPrevention",
        true
      )
    )
      return;
    if (userId !== game.user.id) return;

    // Skip rules messages
    if (document.getFlag(moduleId, "dragonbaneRulesMessage")) {
      return;
    }

    // Skip if already processed by monster prevention to prevent infinite loops
    if (document.getFlag(moduleId, "monsterActionProcessed")) {
      return;
    }

    // Check for active overrides (Alt+V general validation bypass)
    if (DragonbaneActionRules.overrides?.validationBypass) return;

    try {
      const actionMatch = getActionMatch(document.content);
      if (!actionMatch) return;

      const action = actionMatch[1].toLowerCase();
      const normalizedAction = normalizeAction(action);

      if (!["disarm", "parry"].includes(normalizedAction)) return;

      const targets = Array.from(game.user.targets);
      if (targets.length !== 1) return;

      const targetToken = targets[0];
      const targetActor = targetToken.actor;

      if (!targetActor || targetActor.type !== "monster") return;

      // Show dialog and handle result
      showMonsterActionDialog(
        normalizedAction,
        targetActor.name,
        document,
        moduleId
      );
      return false; // Always prevent original message
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error in monster action prevention: ${error.message}`
        );
      }
    }
  });

  // Monster action dialog
  async function showMonsterActionDialog(
    action,
    targetName,
    document,
    moduleId
  ) {
    const dialogKey = action === "disarm" ? "disarm" : "parry";

    const proceed = await new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize(
          `DRAGONBANE_ACTION_RULES.monsterPrevention.${dialogKey}.title`
        ),
        content: `<p>${game.i18n.format(
          `DRAGONBANE_ACTION_RULES.monsterPrevention.${dialogKey}.content`,
          { targetName }
        )}</p>`,
        buttons: {
          proceed: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize(
              "DRAGONBANE_ACTION_RULES.monsterPrevention.proceed"
            ),
            callback: () => resolve(true),
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize(
              "DRAGONBANE_ACTION_RULES.monsterPrevention.cancel"
            ),
            callback: () => resolve(false),
          },
        },
        default: "cancel",
        close: () => resolve(false),
      }).render(true);
    });

    if (proceed) {
      // Mark as processed to prevent infinite loop re-triggering
      document.updateSource({
        flags: {
          [moduleId]: {
            monsterActionProcessed: true,
          },
        },
      });

      // Now recreate the message - it will skip the prevention check
      await ChatMessage.create(document.toObject());
    }
  }

  // Setup Token Action HUD integration
  setupTokenActionHUD(moduleId);

  // Character sheets attack interception
  Hooks.on("renderActorSheet", (sheet, html, data) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
    if (
      !DragonbaneUtils.getSetting(moduleId, "enforceTargetSelection") &&
      !DragonbaneUtils.getSetting(moduleId, "enforceRangeChecking")
    )
      return;

    if (sheet.constructor.name !== "DoDCharacterSheet") return;

    try {
      sheet._dragonbaneHooked = true;

      // PC weapons: .rollable-skill within weapon rows (tr[data-item-id])
      html.find("tr[data-item-id] .rollable-skill").each((index, element) => {
        const $element = $(element);
        const $row = $element.closest("tr[data-item-id]");
        const itemId = $row.attr("data-item-id");

        if (itemId) {
          const item = sheet.actor.items.get(itemId);

          if (item?.type === "weapon") {
            element.addEventListener(
              "click",
              async function (event) {
                // Check if module is enabled
                if (!DragonbaneUtils.getSetting(moduleId, "enabled")) {
                  return;
                }

                if (DragonbaneActionRules?.overrides?.validationBypass) {
                  return;
                }

                if (DragonbaneActionRules?.validator?.performWeaponAttack) {
                  const validation =
                    await DragonbaneActionRules.validator.performWeaponAttack(
                      item.name,
                      sheet.actor
                    );

                  if (!validation.success) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    ui.notifications.warn(validation.message);
                    return false;
                  }
                }
              },
              true
            );
          }

          if (item?.type === "spell") {
            element.addEventListener(
              "click",
              async function (event) {
                // Check if module is enabled
                if (!DragonbaneUtils.getSetting(moduleId, "enabled")) {
                  return;
                }

                if (DragonbaneActionRules?.overrides?.validationBypass) {
                  return;
                }

                if (DragonbaneActionRules?.validator?.performSpellCast) {
                  const validation =
                    await DragonbaneActionRules.validator.performSpellCast(
                      item.name,
                      sheet.actor
                    );

                  if (!validation.success) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    ui.notifications.warn(validation.message);
                    return false;
                  }
                }
              },
              true
            );
          }
        }
      });

      // NPC weapons: .rollable-skill elements with data-item-id directly on them
      html.find(".rollable-skill[data-item-id]").each((index, element) => {
        const $element = $(element);
        const itemId = $element.attr("data-item-id");

        if (itemId) {
          const item = sheet.actor.items.get(itemId);

          if (item?.type === "weapon") {
            element.addEventListener(
              "click",
              async function (event) {
                // Check if module is enabled
                if (!DragonbaneUtils.getSetting(moduleId, "enabled")) {
                  return;
                }

                if (DragonbaneActionRules?.overrides?.validationBypass) {
                  return;
                }

                if (DragonbaneActionRules?.validator?.performWeaponAttack) {
                  const validation =
                    await DragonbaneActionRules.validator.performWeaponAttack(
                      item.name,
                      sheet.actor
                    );

                  if (!validation.success) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    ui.notifications.warn(validation.message);
                    return false;
                  }
                }
              },
              true
            );
          }

          if (item?.type === "spell") {
            element.addEventListener(
              "click",
              async function (event) {
                // Check if module is enabled
                if (!DragonbaneUtils.getSetting(moduleId, "enabled")) {
                  return;
                }

                if (DragonbaneActionRules?.overrides?.validationBypass) {
                  return;
                }

                if (DragonbaneActionRules?.validator?.performSpellCast) {
                  const validation =
                    await DragonbaneActionRules.validator.performSpellCast(
                      item.name,
                      sheet.actor
                    );

                  if (!validation.success) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    ui.notifications.warn(validation.message);
                    return false;
                  }
                }
              },
              true
            );
          }
        }
      });
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error applying weapon interceptors: ${error.message}`
        );
      }
    }
  });

  // Encumbrance monitoring hooks
  Hooks.on("updateActor", (actor, changes, options, userId) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enableEncumbranceMonitoring"))
      return;

    if (DragonbaneActionRules.encumbranceMonitor?.onActorUpdate) {
      DragonbaneActionRules.encumbranceMonitor.onActorUpdate(
        actor,
        changes,
        options,
        userId
      );
    }
  });

  Hooks.on("deleteActor", (actor, options, userId) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enableEncumbranceMonitoring"))
      return;

    if (DragonbaneActionRules.encumbranceMonitor?.onActorDelete) {
      DragonbaneActionRules.encumbranceMonitor.onActorDelete(
        actor,
        options,
        userId
      );
    }
  });

  Hooks.on("updateItem", (item, changes, options, userId) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enableEncumbranceMonitoring"))
      return;

    if (DragonbaneActionRules.encumbranceMonitor?.onItemUpdate) {
      DragonbaneActionRules.encumbranceMonitor.onItemUpdate(
        item,
        changes,
        options,
        userId
      );
    }
  });

  Hooks.on("createItem", (item, options, userId) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enableEncumbranceMonitoring"))
      return;

    if (DragonbaneActionRules.encumbranceMonitor?.onItemChange) {
      DragonbaneActionRules.encumbranceMonitor.onItemChange(
        item,
        options,
        userId
      );
    }
  });

  Hooks.on("deleteItem", (item, options, userId) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enableEncumbranceMonitoring"))
      return;

    if (DragonbaneActionRules.encumbranceMonitor?.onItemChange) {
      DragonbaneActionRules.encumbranceMonitor.onItemChange(
        item,
        options,
        userId
      );
    }
  });
}

/**
 * Setup Token Action HUD integration (called on init and when re-enabling)
 */
export function setupTokenActionHUD(moduleId) {
  // Token Action HUD integration - hook both rollItem (weapons) and useItem (spells)
  if (game.dragonbane?.rollItem && !originalMethods.has("rollItem")) {
    originalMethods.set("rollItem", game.dragonbane.rollItem);

    game.dragonbane.rollItem = async (itemName, itemType, ...args) => {
      // Skip if module disabled or validation disabled
      if (!DragonbaneUtils.getSetting(moduleId, "enabled")) {
        return originalMethods
          .get("rollItem")
          .call(this, itemName, itemType, ...args);
      }

      if (
        !DragonbaneUtils.getSetting(moduleId, "enforceTargetSelection") &&
        !DragonbaneUtils.getSetting(moduleId, "enforceRangeChecking") &&
        !DragonbaneUtils.getSetting(moduleId, "enableSpellValidation")
      ) {
        return originalMethods
          .get("rollItem")
          .call(this, itemName, itemType, ...args);
      }

      // Skip if overrides active
      if (DragonbaneActionRules.overrides?.validationBypass) {
        return originalMethods
          .get("rollItem")
          .call(this, itemName, itemType, ...args);
      }

      try {
        const selectedToken = canvas.tokens.controlled[0];
        if (selectedToken?.actor) {
          const item = selectedToken.actor.items.find(
            (i) => i.name === itemName && i.type === itemType
          );

          // Check for Magic Tricks (before any validation)
          if (item?.type === "spell") {
            let rank = item.system?.rank || 0;
            // Magic tricks are rank 0 or have "general" school
            if (item.system?.school?.toLowerCase() === "general") rank = 0;

            if (rank === 0) {
              // Check if it's a personal spell and auto-target (v12/v13 compatible with UI fix)
              if (item.system?.rangeType === "personal") {
                const casterToken = selectedToken;
                if (casterToken) {
                  try {
                    // Properly clear existing targets with UI update
                    if (game.user.targets.size > 0) {
                      const currentTargets = Array.from(game.user.targets);
                      currentTargets.forEach((t) => {
                        if (t.setTarget) {
                          t.setTarget(false, { user: game.user });
                        }
                      });
                      game.user.targets.clear();
                    }

                    // Small delay for UI
                    await new Promise((resolve) => setTimeout(resolve, 50));

                    if (casterToken.object) {
                      // v13
                      casterToken.object.setTarget(true, {
                        user: game.user,
                        releaseOthers: true,
                      });
                    } else if (casterToken.setTarget) {
                      // v12
                      casterToken.setTarget(true, {
                        user: game.user,
                        releaseOthers: true,
                      });
                    } else if (game.user.updateTokenTargets) {
                      // Older v12
                      game.user.updateTokenTargets([casterToken.id]);
                    }

                    DragonbaneUtils.debugLog(
                      "dragonbane-action-rules",
                      "TokenActionHUD",
                      `Auto-targeted ${selectedToken.actor.name} for personal Magic Trick: ${itemName}`
                    );
                  } catch (error) {
                    if (
                      typeof DoD_Utility !== "undefined" &&
                      DoD_Utility.WARNING
                    ) {
                      DoD_Utility.WARNING(
                        `Auto-targeting failed for ${itemName}: ${error.message}`
                      );
                    }
                  }
                }
              }

              // Call useItem instead of rollItem for Magic Tricks
              if (game.dragonbane.useItem) {
                return game.dragonbane.useItem(itemName, itemType, ...args);
              }
              // Fallback to original if useItem doesn't exist
              return originalMethods
                .get("rollItem")
                .call(this, itemName, itemType, ...args);
            }
          }

          // Weapon Validation
          if (
            item &&
            item.type === "weapon" &&
            DragonbaneActionRules.validator?.performWeaponAttack
          ) {
            const validation =
              await DragonbaneActionRules.validator.performWeaponAttack(
                itemName,
                selectedToken.actor
              );

            if (!validation.success) {
              ui.notifications.warn(validation.message);
              return null;
            }
          }

          // Spell Validation (not Magic Tricks)
          if (
            item &&
            item.type === "spell" &&
            DragonbaneActionRules.validator?.performSpellCast
          ) {
            const validation =
              await DragonbaneActionRules.validator.performSpellCast(
                itemName,
                selectedToken.actor
              );

            if (!validation.success) {
              ui.notifications.warn(validation.message);
              return null;
            }
          }
        }
      } catch (error) {
        if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
          DoD_Utility.WARNING(
            `Error in Token Action HUD rollItem validation: ${error.message}`
          );
        }
      }

      return originalMethods
        .get("rollItem")
        .call(this, itemName, itemType, ...args);
    };
  }

  // Hook useItem for spells (Token Action HUD calls this for regular spells)
  if (game.dragonbane?.useItem && !originalMethods.has("useItem")) {
    originalMethods.set("useItem", game.dragonbane.useItem);

    game.dragonbane.useItem = async (itemName, itemType, ...args) => {
      // Skip if module disabled or validation disabled
      if (!DragonbaneUtils.getSetting(moduleId, "enabled")) {
        return originalMethods
          .get("useItem")
          .call(this, itemName, itemType, ...args);
      }

      if (
        !DragonbaneUtils.getSetting(moduleId, "enforceTargetSelection") &&
        !DragonbaneUtils.getSetting(moduleId, "enforceRangeChecking") &&
        !DragonbaneUtils.getSetting(moduleId, "enableSpellValidation")
      ) {
        return originalMethods
          .get("useItem")
          .call(this, itemName, itemType, ...args);
      }

      // Skip if overrides active
      if (DragonbaneActionRules.overrides?.validationBypass) {
        return originalMethods
          .get("useItem")
          .call(this, itemName, itemType, ...args);
      }

      try {
        const selectedToken = canvas.tokens.controlled[0];
        if (selectedToken?.actor) {
          const item = selectedToken.actor.items.find(
            (i) => i.name === itemName && i.type === itemType
          );

          // Spell Validation (No Magic Trick redirect needed - useItem handles them naturally)
          if (
            item &&
            item.type === "spell" &&
            DragonbaneActionRules.validator?.performSpellCast
          ) {
            const validation =
              await DragonbaneActionRules.validator.performSpellCast(
                itemName,
                selectedToken.actor
              );

            if (!validation.success) {
              ui.notifications.warn(validation.message);
              return null;
            }
          }

          // Ability Validation
          if (
            item &&
            item.type === "ability" &&
            DragonbaneActionRules.validator?.performSpellCast
          ) {
            const validation =
              await DragonbaneActionRules.validator.performSpellCast(
                itemName,
                selectedToken.actor
              );

            if (!validation.success) {
              ui.notifications.warn(validation.message);
              return null;
            }
          }
        }
      } catch (error) {
        if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
          DoD_Utility.WARNING(
            `Error in Token Action HUD useItem validation: ${error.message}`
          );
        }
      }

      return originalMethods
        .get("useItem")
        .call(this, itemName, itemType, ...args);
    };
  }
}

/**
 * Hide ONLY "Roll Damage" buttons from enhanced spells, preserve "Choose" buttons
 */
function hideEnhancedSpellButtons(html) {
  try {
    const magicButtons = html.find(".magic-roll");

    magicButtons.each(function () {
      const button = $(this);
      const spellId = button.attr("data-spell-id");
      const actorId = button.attr("data-actor-id");
      const buttonText = button.text().trim();

      // Only process buttons that have data-spell-id (these are "Roll Damage" buttons)
      if (spellId && actorId) {
        const cleanActorId = actorId.replace("Actor.", "");
        const actor = game.actors.get(cleanActorId);
        const spell = actor?.items.get(spellId);

        // Hide only "Roll Damage" buttons for enhanced spells
        if (
          spell &&
          spell.system.damage === "n/a" &&
          buttonText === "Roll Damage"
        ) {
          button.hide();
          DragonbaneUtils.debugLog(
            "dragonbane-action-rules",
            "EnhancedSpellButtons",
            `Hidden "Roll Damage" button for enhanced spell: ${spell.name}`
          );
        }
      } else {
        DragonbaneUtils.debugLog(
          "dragonbane-action-rules",
          "EnhancedSpellButtons",
          `Preserved button without spell-id: "${buttonText}"`
        );
      }
    });
  } catch (error) {
    if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
      DoD_Utility.WARNING(
        `Error hiding enhanced spell buttons: ${error.message}`
      );
    }
  }
}

/**
 * Enhanced spells: Remove "Double damage" option AND add missing "Choose" button
 */
function fixEnhancedSpellCriticalEffects(html) {
  try {
    // Look for critical effects sections
    const criticalSections = html.find(".form-group").filter(function () {
      return $(this).find("label").first().text().includes("Critical effect");
    });

    if (criticalSections.length > 0) {
      criticalSections.each(function () {
        const section = $(this);
        const formFields = section.find(".form-fields");

        // Check if this message is for a spell by looking for Roll Damage button
        const messageDiv = section.closest(".message-content");
        const rollDamageButton = messageDiv
          .find("button.magic-roll")
          .filter(function () {
            return (
              $(this).attr("data-spell-id") &&
              $(this).text().trim() === "Roll Damage"
            );
          });

        // If we found a Roll Damage button, check if it's an enhanced spell
        if (rollDamageButton.length > 0) {
          const spellId = rollDamageButton.attr("data-spell-id");
          const actorId = rollDamageButton.attr("data-actor-id");

          if (spellId && actorId) {
            const cleanActorId = actorId.replace("Actor.", "");
            const actor = game.actors.get(cleanActorId);
            const spell = actor?.items.get(spellId);

            // Only process enhanced non-damage spells (damage === "n/a")
            if (spell && spell.system.damage === "n/a") {
              // Remove "Double damage" option
              const doubleDamageInput = formFields.find(
                'input[value="doubleDamage"]'
              );
              if (doubleDamageInput.length > 0) {
                doubleDamageInput.closest("label").remove();
                DragonbaneUtils.debugLog(
                  "dragonbane-action-rules",
                  "CriticalEffects",
                  "Removed 'Double damage' option from enhanced spell"
                );
              }

              // Add missing "Choose" button
              const existingChooseButton = messageDiv
                .find("button")
                .filter(function () {
                  const buttonText = $(this).text().trim();
                  const chooseText = game.i18n.localize("DoD.ui.chat.choose");
                  return (
                    buttonText === chooseText && !$(this).attr("data-spell-id")
                  );
                });

              if (existingChooseButton.length === 0) {
                const wpCost = rollDamageButton.attr("data-wp-cost");
                const chooseButtonWithDivider = $(`
                  <hr>
                  <button class="chat-button magic-roll" data-actor-id="${actorId}" data-is-magic-crit="true" data-wp-cost="${wpCost}">
                    ${game.i18n.localize("DoD.ui.chat.choose")}
                  </button>
                `);

                section.nextAll("hr").first().remove();
                section.after(chooseButtonWithDivider);

                DragonbaneUtils.debugLog(
                  "dragonbane-action-rules",
                  "CriticalEffects",
                  "Added missing 'Choose' button for enhanced spell"
                );
              }
            }
          }
        }
      });
    }
  } catch (error) {
    if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
      DoD_Utility.WARNING(
        `Error fixing enhanced spell critical effects: ${error.message}`
      );
    }
  }
}

/**
 * Enhance all non-damage spells for Automated Animations compatibility
 */
async function enhanceAllNonDamageSpells() {
  try {
    let enhancedCount = 0;
    let excludedCount = 0;

    // Get excluded spells list
    const excludedSpells = DragonbaneUtils.getSetting(
      "dragonbane-action-rules",
      "excludedSpells",
      ""
    )
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (let actor of game.actors) {
      if (!actor) continue;

      for (let item of actor.items) {
        if (
          item.type === "spell" &&
          (!item.system.damage || item.system.damage.length === 0)
        ) {
          // Check if this spell is excluded
          const isExcluded = excludedSpells.includes(item.name);
          if (isExcluded) excludedCount++;

          // Always enhance for AA (even excluded spells get animations)
          await item.update({ "system.damage": "n/a" });
          enhancedCount++;
        }
      }
    }

    // Single summary log instead of individual logs
    DragonbaneUtils.debugLog(
      "dragonbane-action-rules",
      "SpellEnhancement",
      `Enhanced ${enhancedCount} spells for AA (${excludedCount} validation excluded)`
    );
  } catch (error) {
    if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
      DoD_Utility.WARNING(`Error enhancing spells for AA: ${error.message}`);
    }
  }
}

/**
 * Disable Token Action HUD integration (called on module disable)
 */
export function disableTokenActionHUD() {
  if (originalMethods.has("rollItem") && game.dragonbane) {
    game.dragonbane.rollItem = originalMethods.get("rollItem");
    originalMethods.delete("rollItem");
  }
  if (originalMethods.has("useItem") && game.dragonbane) {
    game.dragonbane.useItem = originalMethods.get("useItem");
    originalMethods.delete("useItem");
  }
}

/**
 * Clean up character sheet hooks (called on module disable)
 */
export function cleanupCharacterSheets() {
  Object.values(ui.windows)
    .filter(
      (app) =>
        app.constructor.name === "DoDCharacterSheet" && app._dragonbaneHooked
    )
    .forEach((app) => delete app._dragonbaneHooked);
}

// Support both v12 and v13 journal hooks
function registerJournalHooks(moduleId) {
  // v12 hook
  Hooks.on("renderJournalSheet", (journal, html, data) => {
    handleGrudgeJournalSheet(moduleId, journal, html, {
      folderPath: journal.object.folder?.name,
      journalName: journal.object.name,
    });
  });

  // v13 hook
  Hooks.on("renderJournalEntryPageSheet", (sheet, html, data) => {
    handleGrudgeJournalSheet(moduleId, sheet, html, {
      folderPath: sheet.document?.parent?.folder?.name,
      journalName: sheet.document?.name,
    });
  });
}

// Shared handler for both versions
function handleGrudgeJournalSheet(moduleId, sheetOrJournal, html, paths) {
  if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
  if (!DragonbaneUtils.getSetting(moduleId, "enableGrudgeTracking")) return;

  const folderName = game.i18n.localize(
    "DRAGONBANE_ACTION_RULES.grudgeTracker.folderName"
  );
  if (paths.folderPath !== folderName) return;

  try {
    // Handle different HTML parameter types between v12 and v13
    const $html = html.find ? html : $(html); // v12 has .find, v13 needs jQuery wrap

    // Check if delete buttons exist
    const deleteButtons = $html.find(".grudge-delete-btn");

    // Event delegation for delete buttons
    $html // Use $html instead of html
      .off("click", ".grudge-delete-btn")
      .on("click", ".grudge-delete-btn", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const button = event.currentTarget;
        const rowId = button.dataset.rowId;
        const journalId = button.dataset.journalId;

        if (!rowId || !journalId) {
          if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
            DoD_Utility.WARNING("Grudge delete: Missing row or journal ID");
          }
          return;
        }

        if (!DragonbaneActionRules?.grudgeTracker?.deleteGrudgeEntry) {
          if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
            DoD_Utility.WARNING(
              "Grudge delete: Module not ready or missing grudgeTracker"
            );
          }
          ui.notifications.warn(
            "Module not ready. Please try again in a moment."
          );
          return;
        }

        // Show confirmation dialog
        const confirmed = await new Promise((resolve) => {
          new Dialog({
            title: game.i18n.localize(
              "DRAGONBANE_ACTION_RULES.grudgeTracker.confirmDelete.title"
            ),
            content: `<p>${game.i18n.localize(
              "DRAGONBANE_ACTION_RULES.grudgeTracker.confirmDelete.content"
            )}</p>`,
            buttons: {
              yes: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize(
                  "DRAGONBANE_ACTION_RULES.grudgeTracker.confirmDelete.confirm"
                ),
                callback: () => resolve(true),
              },
              no: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize(
                  "DRAGONBANE_ACTION_RULES.grudgeTracker.confirmDelete.cancel"
                ),
                callback: () => resolve(false),
              },
            },
            default: "no",
            close: () => resolve(false),
          }).render(true);
        });

        if (confirmed) {
          try {
            await DragonbaneActionRules.grudgeTracker.deleteGrudgeEntry(
              journalId,
              rowId
            );
          } catch (error) {
            if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
              DoD_Utility.WARNING(
                `Error deleting grudge entry: ${error.message}`
              );
            }
            ui.notifications.error("Failed to delete grudge entry");
          }
        }
      });

    // Hover effects for delete buttons
    $html // Use $html instead of html
      .off("mouseenter mouseleave", ".grudge-delete-btn")
      .on("mouseenter", ".grudge-delete-btn", function () {
        $(this).css("background-color", "#a82d42");
      })
      .on("mouseleave", ".grudge-delete-btn", function () {
        $(this).css("background-color", "#8b2635");
      });
  } catch (error) {
    if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
      DoD_Utility.WARNING(`Error in journal interaction: ${error.message}`);
    }
  }
}

// Helper functions for monster action prevention
function getActionMatch(content) {
  const parryTerm = game.i18n.localize("DoD.attackTypes.parry") || "parry";
  const disarmTerm = game.i18n.localize("DoD.attackTypes.disarm") || "disarm";

  const actionPattern = new RegExp(
    `(${parryTerm}|${disarmTerm}|parry|disarm)`,
    "i"
  );

  return content.match(actionPattern);
}

function normalizeAction(action) {
  const actionLower = action.toLowerCase();

  // Map localized terms back to English keys
  const parryTerm = (
    game.i18n.localize("DoD.attackTypes.parry") || "parry"
  ).toLowerCase();
  const disarmTerm = (
    game.i18n.localize("DoD.attackTypes.disarm") || "disarm"
  ).toLowerCase();

  if (actionLower === parryTerm || actionLower === "parry") return "parry";
  if (actionLower === disarmTerm || actionLower === "disarm") return "disarm";

  return actionLower;
}

/**
 * Disable all spell enhancements for Automated Animations
 */
async function disableAllSpellEnhancements() {
  try {
    let enhancedCount = 0;

    for (let actor of game.actors) {
      if (!actor) continue;

      for (let item of actor.items) {
        if (item.type === "spell" && item.system.damage === "n/a") {
          await item.update({ "system.damage": "" });
          enhancedCount++;
        }
      }
    }

    // Single summary log instead of individual logs
    DragonbaneUtils.debugLog(
      "dragonbane-action-rules",
      "SpellEnhancement",
      `Disabled AA support for ${enhancedCount} spells`
    );

    return enhancedCount;
  } catch (error) {
    if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
      DoD_Utility.WARNING(
        `Error disabling spell enhancements: ${error.message}`
      );
    }
    throw error;
  }
}

// Make functions available globally for the dialogs
globalThis.enhanceAllNonDamageSpells = enhanceAllNonDamageSpells;
globalThis.disableAllSpellEnhancements = disableAllSpellEnhancements;
