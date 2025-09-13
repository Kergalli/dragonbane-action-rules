/**
 * Dragonbane Combat Assistant - Simplified Hook Registration (v1.5.0)
 * Universal Spell Animation Support for Automated Animations
 */

import { DragonbaneUtils } from "./utils.js";

// Store original methods for Token Action HUD override
const originalMethods = new Map();

/**
 * Register all module hooks - direct registration like core Dragonbane system
 */
export function registerHooks(moduleId) {
  // Main chat message processing hook
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
                if (message.author.id === game.user.id) {
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

        // CHECK IF IT'S ACTUALLY A MAGIC TRICK (rank 0 or general school)
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

            console.log(
              `Combat Assistant v2.0: Added early AA button for Magic Trick: ${spell.name}`
            );
          }
        }
      }
    } catch (error) {
      console.error("Error adding early Magic Trick buttons:", error);
    }
  }

  // Chat button interaction processing
  Hooks.on("renderChatMessage", (message, html, data) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;

    // Hide fake damage buttons from enhanced spells
    hideEnhancedSpellButtons(html);

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

    // FIXED: Skip rules messages - they're not actual attack attempts
    if (document.getFlag(moduleId, "dragonbaneRulesMessage")) {
      return;
    }

    // FIXED: Skip if already processed by monster prevention to prevent infinite loops
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

  // CLEANED: Simplified monster action dialog - no bypass system
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
      console.log(
        `${moduleId} | User proceeded with ${action} against monster`
      );

      // FIXED: Mark as processed to prevent infinite loop re-triggering
      document.updateSource({
        flags: {
          [moduleId]: {
            monsterActionProcessed: true,
          },
        },
      });

      // Now recreate the message - it will skip the prevention check
      await ChatMessage.create(document.toObject());
    } else {
      console.log(`${moduleId} | User cancelled ${action} against monster`);
    }
  }

  // Token Action HUD integration - hook both rollItem (weapons) and useItem (spells)
  if (game.dragonbane?.rollItem && !originalMethods.has("rollItem")) {
    originalMethods.set("rollItem", game.dragonbane.rollItem);

    game.dragonbane.rollItem = async (itemName, itemType, ...args) => {
      console.log(
        `DEBUG: Token Action HUD rollItem called - Item: ${itemName}, Type: ${itemType}`
      );

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

          // CHECK FOR MAGIC TRICKS FIRST - BEFORE ANY VALIDATION
          if (item?.type === "spell") {
            let rank = item.system?.rank || 0;
            // Magic tricks are rank 0 or have "general" school
            if (item.system?.school?.toLowerCase() === "general") rank = 0;

            if (rank === 0) {
              // It's a Magic Trick - redirect to useItem for proper dialog
              console.log(
                `Combat Assistant: Detected Magic Trick "${itemName}", redirecting to useItem for proper dialog`
              );

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

                    console.log(
                      `Combat Assistant: Auto-targeted ${selectedToken.actor.name} for personal Magic Trick: ${itemName}`
                    );
                  } catch (error) {
                    console.warn(
                      `Combat Assistant: Auto-targeting failed for ${itemName}:`,
                      error
                    );
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

          // NORMAL VALIDATION FOR WEAPONS
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

          // NORMAL VALIDATION FOR REGULAR SPELLS (NOT MAGIC TRICKS)
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

  // ALSO hook useItem for spells (Token Action HUD calls this for regular spells)
  if (game.dragonbane?.useItem && !originalMethods.has("useItem")) {
    originalMethods.set("useItem", game.dragonbane.useItem);

    game.dragonbane.useItem = async (itemName, itemType, ...args) => {
      console.log(
        `DEBUG: Token Action HUD useItem called - Item: ${itemName}, Type: ${itemType}`
      );

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

          // VALIDATION FOR SPELLS (NO Magic Trick redirect needed - useItem handles them naturally)
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

          // VALIDATION FOR ABILITIES (useItem also handles these)
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

  console.log(`${moduleId} | Simplified hook system registered`);
}

/**
 * Hide Roll Damage buttons from enhanced non-damage spells
 * Enhanced spells have "n/a" in their damage field to trigger AA, but users shouldn't see the button
 */
function hideEnhancedSpellButtons(html) {
  try {
    const magicButtons = html.find(".magic-roll");

    magicButtons.each(function () {
      const button = $(this);
      const spellId = button.attr("data-spell-id");
      const actorId = button.attr("data-actor-id");

      if (spellId && actorId) {
        const cleanActorId = actorId.replace("Actor.", "");
        const actor = game.actors.get(cleanActorId);
        const spell = actor?.items.get(spellId);

        // Hide buttons for spells with "n/a" damage (our enhancement marker)
        if (spell && spell.system.damage === "n/a") {
          button.hide();
        }
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
 * Enhance all non-damage spells for Automated Animations compatibility
 * Adds "n/a" to damage field to make spells appear as "isDamaging" so they generate Roll buttons
 * This allows AA to detect and trigger animations for buff/debuff/utility spells
 */
async function enhanceAllNonDamageSpells() {
  try {
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

          // Always enhance for AA (even excluded spells get animations)
          await item.update({ "system.damage": "n/a" });

          // Log enhancement with exclusion status
          console.log(
            `Combat Assistant v2.0: Enhanced ${item.name} for AA${
              isExcluded ? " (validation excluded)" : ""
            }`
          );
        }
      }
    }
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
          console.warn("Grudge delete: Missing row or journal ID");
          return;
        }

        if (!DragonbaneActionRules?.grudgeTracker?.deleteGrudgeEntry) {
          console.warn(
            "Grudge delete: Module not ready or missing grudgeTracker"
          );
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
            console.error("Error deleting grudge entry:", error);
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
 * Removes "n/a" from damage field to restore original spell state
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
          console.log(
            `Combat Assistant: Removed AA enhancement from ${item.name}`
          );
        }
      }
    }

    console.log(
      `Combat Assistant: Disabled AA support for ${enhancedCount} spells`
    );
    return enhancedCount;
  } catch (error) {
    console.error("Error disabling spell enhancements:", error);
    throw error;
  }
}

// Make functions available globally for the dialogs
globalThis.enhanceAllNonDamageSpells = enhanceAllNonDamageSpells;
globalThis.disableAllSpellEnhancements = disableAllSpellEnhancements;
