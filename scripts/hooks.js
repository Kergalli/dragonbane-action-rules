/**
 * Dragonbane Combat Assistant - Simplified Hook Registration (Cleaned)
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
      // Rules display processing
      if (DragonbaneActionRules.rulesDisplay?.onChatMessage) {
        DragonbaneActionRules.rulesDisplay.onChatMessage(message);
      }

      // YZE integration action detection
      if (DragonbaneActionRules.yzeIntegration?.onChatMessageAction) {
        await DragonbaneActionRules.yzeIntegration.onChatMessageAction(message);
      }

      // Grudge tracker processing
      if (DragonbaneActionRules.grudgeTracker?.onChatMessage) {
        DragonbaneActionRules.grudgeTracker.onChatMessage(message);
      }
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error in chat message processing: ${error.message}`
        );
      }
    }
  });

  // Chat button interaction processing
  Hooks.on("renderChatMessage", (message, html, data) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
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

  // Journal interaction for grudge tracker delete buttons
  Hooks.on("renderJournalSheet", (journal, html, data) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
    if (!DragonbaneUtils.getSetting(moduleId, "enableGrudgeTracking")) return;

    // Only handle grudge list journals
    const folderName = game.i18n.localize(
      "DRAGONBANE_ACTION_RULES.grudgeTracker.folderName"
    );
    if (journal.object.folder?.name !== folderName) return;

    try {
      // Event delegation for delete buttons
      html
        .off("click", ".grudge-delete-btn")
        .on("click", ".grudge-delete-btn", async (event) => {
          event.preventDefault();
          event.stopPropagation();

          const button = event.currentTarget;
          const rowId = button.dataset.rowId;
          const journalId = button.dataset.journalId;

          if (
            rowId &&
            journalId &&
            DragonbaneActionRules.grudgeTracker?.deleteGrudgeEntry
          ) {
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
              await DragonbaneActionRules.grudgeTracker.deleteGrudgeEntry(
                journalId,
                rowId
              );
            }
          }
        });

      // Hover effects for delete buttons
      html
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
  });

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

  // Token Action HUD integration
  if (game.dragonbane?.rollItem && !originalMethods.has("rollItem")) {
    originalMethods.set("rollItem", game.dragonbane.rollItem);

    game.dragonbane.rollItem = async (itemName, ...args) => {
      // Skip if module disabled or validation disabled
      if (!DragonbaneUtils.getSetting(moduleId, "enabled")) {
        return originalMethods.get("rollItem").call(this, itemName, ...args);
      }

      if (
        !DragonbaneUtils.getSetting(moduleId, "enforceTargetSelection") &&
        !DragonbaneUtils.getSetting(moduleId, "enforceRangeChecking")
      ) {
        return originalMethods.get("rollItem").call(this, itemName, ...args);
      }

      // Skip if overrides active
      if (DragonbaneActionRules.overrides?.validationBypass) {
        return originalMethods.get("rollItem").call(this, itemName, ...args);
      }

      try {
        const selectedToken = canvas.tokens.controlled[0];
        if (selectedToken?.actor) {
          const item = selectedToken.actor.items.find(
            (i) => i.name === itemName && i.type === "weapon"
          );

          if (item && DragonbaneActionRules.validator?.performWeaponAttack) {
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
        }
      } catch (error) {
        if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
          DoD_Utility.WARNING(
            `Error in Token Action HUD validation: ${error.message}`
          );
        }
      }

      return originalMethods.get("rollItem").call(this, itemName, ...args);
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
 * Disable Token Action HUD integration (called on module disable)
 */
export function disableTokenActionHUD() {
  if (originalMethods.has("rollItem") && game.dragonbane) {
    game.dragonbane.rollItem = originalMethods.get("rollItem");
    originalMethods.delete("rollItem");
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
