/**
 * Dragonbane Combat Assistant - Simplified Hook Registration
 * Aligned with core Dragonbane system patterns
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

      // FIXED: Grudge tracker processing (was onGrudgeTracking, now onChatMessage)
      if (DragonbaneActionRules.grudgeTracker?.onChatMessage) {
        DragonbaneActionRules.grudgeTracker.onChatMessage(message);
      }
    } catch (error) {
      console.error(`${moduleId} | Error in chat message processing:`, error);
    }
  });

  // Chat button interaction processing
  Hooks.on("renderChatMessage", (message, html, data) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
    if (!message.getFlag(moduleId, "dragonbaneRulesMessage")) return;

    try {
      // Show Parry Rules button
      html.find(".show-parry-rules").click(async (event) => {
        event.preventDefault();
        const button = event.currentTarget;
        const weaponId = button.dataset.weaponId;
        const actorId = button.dataset.actorId;
        const dragonRolled = button.dataset.dragonRolled === "true";

        if (DragonbaneActionRules.rulesDisplay?.showFullParryRules) {
          await DragonbaneActionRules.rulesDisplay.showFullParryRules(
            weaponId,
            actorId,
            dragonRolled
          );
        }
      });

      // FIXED: Mark weapon broken button - handle UUID properly
      html.find(".mark-weapon-broken").click(async (event) => {
        event.preventDefault();
        event.stopPropagation(); // Prevent core system from also processing this click
        const button = event.currentTarget;
        const weaponId = button.dataset.weaponId;
        const actorId = button.dataset.actorId; // This is a UUID
        const sceneId = button.dataset.sceneId;
        const tokenId = button.dataset.tokenId;

        try {
          // Debug: Log what we're getting
          console.log(
            `${moduleId} | Mark weapon broken - Actor ID received:`,
            actorId
          );

          // Try different resolution methods (DoD_Utility not available in our context)
          let actor;

          // Method 1: Direct lookup if it's a raw actor ID
          if (actorId && !actorId.includes(".")) {
            console.log(`${moduleId} | Trying direct actor lookup`);
            actor = game.actors.get(actorId);
          }

          // Method 2: If it looks like a UUID, use fromUuidSync
          if (!actor && actorId) {
            console.log(`${moduleId} | Trying UUID resolution`);
            if (actorId.startsWith("Actor.")) {
              actor = fromUuidSync(actorId);
            } else {
              // Construct proper UUID
              actor = fromUuidSync(`Actor.${actorId}`);
            }
          }

          if (!actor) {
            console.error(
              `${moduleId} | Failed to find actor with any method. ID was:`,
              actorId
            );
            ui.notifications.error(
              game.i18n.localize(
                "DRAGONBANE_ACTION_RULES.weaponBroken.errors.actorNotFound"
              )
            );
            return;
          }

          console.log(`${moduleId} | Successfully found actor:`, actor.name);

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
          console.error(`${moduleId} | Error marking weapon broken:`, error);
          ui.notifications.error("Failed to mark weapon broken");
        }
      });

      // Add to grudge list button
      html.find(".add-to-grudge-list").click(async (event) => {
        event.preventDefault();
        const button = event.currentTarget;
        const actorId = button.dataset.actorId;
        const attackerName = button.dataset.attackerName;
        const damage = parseInt(button.dataset.damage);
        const location = button.dataset.location;
        const isCritical = button.dataset.critical === "true";

        if (DragonbaneActionRules.grudgeTracker?.addToGrudgeList) {
          await DragonbaneActionRules.grudgeTracker.addToGrudgeList(
            actorId,
            attackerName,
            damage,
            location,
            isCritical
          );

          // Update button to show completion
          $(button)
            .text(
              game.i18n.localize(
                "DRAGONBANE_ACTION_RULES.grudgeTracker.buttonTextCompleted"
              )
            )
            .prop("disabled", true);
        }
      });
    } catch (error) {
      console.error(`${moduleId} | Error in chat button processing:`, error);
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
      console.error(`${moduleId} | Error in journal interaction:`, error);
    }
  });

  // Monster action prevention with bypass system (like original)
  let bypassActive = false;
  let bypassAction = null;
  let bypassTimeout = null;

  // Clear bypass state
  function clearBypass(moduleId) {
    bypassActive = false;
    bypassAction = null;
    if (bypassTimeout) {
      clearTimeout(bypassTimeout);
      bypassTimeout = null;
    }
    console.log(`${moduleId} | Monster action bypass cleared`);
  }

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

    // Check for active bypass - KEY FIX!
    if (bypassActive) {
      console.log(`${moduleId} | Bypassing prevention due to active bypass`);
      return; // Allow message to proceed
    }

    // Check for active overrides
    if (DragonbaneActionRules.overrides?.allValidations) return;

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
      console.error(`${moduleId} | Error in monster action prevention:`, error);
    }
  });

  // Rules watcher - clears bypass when rules message detected
  Hooks.on("createChatMessage", (message) => {
    if (!bypassActive || !bypassAction) return;

    try {
      const content = message.content;
      if (!content) return;

      // Check if this is a rules message for the bypassed action
      const actionKey =
        bypassAction === "parry"
          ? "DRAGONBANE_ACTION_RULES.actions.parry"
          : "DRAGONBANE_ACTION_RULES.actions.disarm";

      const actionName = game.i18n.localize(actionKey);
      const rulesText = game.i18n.format(
        "DRAGONBANE_ACTION_RULES.speakers.generic",
        { action: actionName }
      );

      const speaker = message.speaker?.alias || "";
      if (speaker.includes(rulesText) || content.includes(rulesText)) {
        console.log(
          `${moduleId} | Detected ${bypassAction} rules message, clearing bypass`
        );
        clearBypass(moduleId);
      }
    } catch (error) {
      console.error(`${moduleId} | Error in rules watcher:`, error);
    }
  });

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
        `${moduleId} | User proceeded with ${action} - activating bypass`
      );

      // Activate bypass system
      bypassAction = action;
      bypassActive = true;

      // 5-second fallback timeout
      bypassTimeout = setTimeout(() => {
        if (bypassActive) {
          console.log(`${moduleId} | Bypass cleared by timeout (fallback)`);
          clearBypass(moduleId);
        }
      }, 5000);

      // Recreate the message (will pass through due to bypass)
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
      if (DragonbaneActionRules.overrides?.allValidations) {
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
        console.error(
          `${moduleId} | Error in Token Action HUD validation:`,
          error
        );
      }

      return originalMethods.get("rollItem").call(this, itemName, ...args);
    };
  }

  // Character sheet attack interception
  Hooks.on("renderActorSheet", (sheet, html, data) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
    if (
      !DragonbaneUtils.getSetting(moduleId, "enforceTargetSelection") &&
      !DragonbaneUtils.getSetting(moduleId, "enforceRangeChecking")
    )
      return;

    if (sheet.constructor.name !== "DoDCharacterSheet") return;
    if (sheet._dragonbaneHooked) return; // Already hooked

    try {
      sheet._dragonbaneHooked = true;

      // Store original method
      const originalOnSkillRoll = sheet._onSkillRoll;

      // Override the _onSkillRoll method with validation
      sheet._onSkillRoll = async (event) => {
        // Skip if overrides active
        if (
          DragonbaneActionRules.overrides?.allValidations ||
          DragonbaneActionRules.overrides?.targetSelection ||
          DragonbaneActionRules.overrides?.rangeChecking
        ) {
          return originalOnSkillRoll.call(sheet, event);
        }

        try {
          const element = event.currentTarget;
          const itemId = element.closest("[data-item-id]")?.dataset.itemId;

          if (itemId) {
            const item = sheet.actor.items.get(itemId);

            if (
              item?.type === "weapon" &&
              DragonbaneActionRules.validator?.performWeaponAttack
            ) {
              const validation =
                await DragonbaneActionRules.validator.performWeaponAttack(
                  item.name,
                  sheet.actor
                );

              if (!validation.success) {
                ui.notifications.warn(validation.message);
                return;
              }
            }
          }
        } catch (error) {
          console.error(
            `${moduleId} | Error in character sheet validation:`,
            error
          );
        }

        return originalOnSkillRoll.call(sheet, event);
      };
    } catch (error) {
      console.error(`${moduleId} | Error hooking character sheet:`, error);
    }
  });

  // Encumbrance monitoring hooks
  Hooks.on("updateActor", (actor, changes, options, userId) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
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

  Hooks.on("updateItem", (item, changes, options, userId) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
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
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
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
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
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

  Hooks.on("deleteActor", (actor, options, userId) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
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
  // Get current localized action terms for pattern matching
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

async function showMonsterActionDialog(
  action,
  targetName,
  data,
  options,
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
    // Create approved message manually
    const approvedData = {
      ...data,
      flags: {
        ...data.flags,
        [moduleId]: {
          ...(data.flags?.[moduleId] || {}),
          monsterActionApproved: true,
        },
      },
    };

    await ChatMessage.create(approvedData, options);
  }
  // If canceled, do nothing - message was already blocked
}
