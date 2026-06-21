/**
 * Dragonbane Combat Assistant - Hook Registration
 */

import { onRenderChatMessageForAA } from "./aa-integration.js";
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
                messageContent,
              );

            if (isSuccess || isMagicTrick) {
              const excludedSpells = DragonbaneUtils.getSetting(
                moduleId,
                "excludedSpells",
                "",
              )
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0);

              if (!excludedSpells.includes(spell.name)) {
                // Only the message creator processes the effect.
                // On Dragonbane 4.0.1 the live property is message.author (an
                // ID string); message.user is deprecated/undefined.
                const authorId =
                  message.author?.id ?? message.author ?? message.user?.id;
                if (authorId === game.user.id) {
                  // Small delay to ensure message is fully created
                  setTimeout(() => {
                    DragonbaneActionRules.spellLibrary.applySpellEffect(
                      spell,
                      message,
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
          `Error in chat message processing: ${error.message}`,
        );
      }
    }
  });

  // Chat button interaction processing
  Hooks.on("renderChatMessageHTML", (message, html, data) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;

    // Only process our rules messages
    if (!message.getFlag(moduleId, "dragonbaneRulesMessage")) return;

    try {
      // Mark weapon broken button
      const markBrokenButton = html.querySelector(".mark-weapon-broken");
      if (markBrokenButton) {
        markBrokenButton.addEventListener("click", async (event) => {
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
                  "DRAGONBANE_ACTION_RULES.weaponBroken.errors.actorNotFound",
                ),
              );
              return;
            }

            const weapon = actor.items.get(weaponId);
            if (!weapon) {
              ui.notifications.error(
                game.i18n.localize(
                  "DRAGONBANE_ACTION_RULES.weaponBroken.errors.weaponNotFound",
                ),
              );
              return;
            }

            if (!actor.isOwner && !game.user.isGM) {
              ui.notifications.warn(
                game.i18n.localize(
                  "DRAGONBANE_ACTION_RULES.weaponBroken.errors.noPermission",
                ),
              );
              return;
            }

            if (weapon.system.broken) {
              ui.notifications.info(
                game.i18n.format(
                  "DRAGONBANE_ACTION_RULES.weaponBroken.errors.alreadyBroken",
                  { weaponName: weapon.name },
                ),
              );
              return;
            }

            // Show confirmation dialog
            const confirmed = await foundry.applications.api.DialogV2.wait({
              window: {
                title: game.i18n.localize(
                  "DRAGONBANE_ACTION_RULES.weaponBroken.dialogTitle",
                ),
              },
              content: `<p>${game.i18n.format(
                "DRAGONBANE_ACTION_RULES.weaponBroken.dialogContent",
                { weaponName: weapon.name },
              )}</p>
                  <p><em>${game.i18n.localize(
                    "DRAGONBANE_ACTION_RULES.weaponBroken.dialogExplanation",
                  )}</em></p>`,
              position: { width: 400 },
              buttons: [
                {
                  action: "yes",
                  icon: "fa-solid fa-check",
                  label: game.i18n.localize(
                    "DRAGONBANE_ACTION_RULES.weaponBroken.confirmButton",
                  ),
                  callback: () => true,
                },
                {
                  action: "no",
                  icon: "fa-solid fa-xmark",
                  label: game.i18n.localize(
                    "DRAGONBANE_ACTION_RULES.weaponBroken.cancelButton",
                  ),
                  default: true,
                  callback: () => false,
                },
              ],
            });

            // DialogV2.wait returns null/undefined if dismissed → treat as cancel
            if (!confirmed) return;

            // Mark weapon as broken
            await weapon.update({ "system.broken": true });

            ui.notifications.info(
              game.i18n.format("DRAGONBANE_ACTION_RULES.weaponBroken.success", {
                weaponName: weapon.name,
              }),
            );

            // Update button to show completion
            button.textContent = game.i18n.localize(
              "DRAGONBANE_ACTION_RULES.weaponBroken.buttonTextCompleted",
            );
            button.disabled = true;
          } catch (error) {
            const errorMsg = `Error marking weapon broken: ${error.message}`;
            if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
              DoD_Utility.WARNING(errorMsg);
            }
            ui.notifications.error(
              game.i18n.localize(
                "DRAGONBANE_ACTION_RULES.weaponBroken.errors.updateFailed",
              ),
            );
          }
        });
      }
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error in chat button processing: ${error.message}`,
        );
      }
    }
  });

  // Journal hooks for grudge tracking
  registerJournalHooks(moduleId);

  // Grudge tracker button handler (separate hook since grudge messages don't have rules flag)
  Hooks.on("renderChatMessageHTML", (message, html, data) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
    if (!DragonbaneUtils.getSetting(moduleId, "enableGrudgeTracking")) return;

    // Only process messages with grudge buttons
    const grudgeButton = html.querySelector(".add-to-grudge-list");
    if (!grudgeButton) return;

    try {
      grudgeButton.addEventListener("click", async (event) => {
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
              critical,
            );

            // Update button to show completion
            button.textContent = game.i18n.localize(
              "DRAGONBANE_ACTION_RULES.grudgeTracker.buttonTextCompleted",
            );
            button.disabled = true;
          } catch (error) {
            if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
              DoD_Utility.WARNING(
                `Error adding to grudge list: ${error.message}`,
              );
            }
            ui.notifications.error(
              game.i18n.localize(
                "DRAGONBANE_ACTION_RULES.grudgeTracker.errors.addFailed",
              ),
            );
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
          `Error in grudge button processing: ${error.message}`,
        );
      }
    }
  });

  // Automated Animations: trigger animations for spells AA's native handler skips
  Hooks.on("renderChatMessageHTML", (message, html, data) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
    onRenderChatMessageForAA(message, html, data);
  });

  // Monster action prevention - no more timed bypass system
  Hooks.on("preCreateChatMessage", (document, data, options, userId) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
    if (
      !DragonbaneUtils.getSetting(
        moduleId,
        "enforceMonsterActionPrevention",
        true,
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
        moduleId,
      );
      return false; // Always prevent original message
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error in monster action prevention: ${error.message}`,
        );
      }
    }
  });

  // Monster action dialog
  async function showMonsterActionDialog(
    action,
    targetName,
    document,
    moduleId,
  ) {
    const dialogKey = action === "disarm" ? "disarm" : "parry";

    const proceed = await foundry.applications.api.DialogV2.wait({
      window: {
        title: game.i18n.localize(
          `DRAGONBANE_ACTION_RULES.monsterPrevention.${dialogKey}.title`,
        ),
      },
      content: `<p>${game.i18n.format(
        `DRAGONBANE_ACTION_RULES.monsterPrevention.${dialogKey}.content`,
        { targetName },
      )}</p>`,
      position: { width: 400 },
      buttons: [
        {
          action: "proceed",
          icon: "fa-solid fa-check",
          label: game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.monsterPrevention.proceed",
          ),
          callback: () => true,
        },
        {
          action: "cancel",
          icon: "fa-solid fa-xmark",
          label: game.i18n.localize(
            "DRAGONBANE_ACTION_RULES.monsterPrevention.cancel",
          ),
          default: true,
          callback: () => false,
        },
      ],
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

  // Encumbrance monitoring hooks
  Hooks.on("updateActor", (actor, changes, options, userId) => {
    if (!DragonbaneUtils.getSetting(moduleId, "enableEncumbranceMonitoring"))
      return;

    if (DragonbaneActionRules.encumbranceMonitor?.onActorUpdate) {
      DragonbaneActionRules.encumbranceMonitor.onActorUpdate(
        actor,
        changes,
        options,
        userId,
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
        userId,
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
        userId,
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
        userId,
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
        userId,
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
            (i) => i.name === itemName && i.type === itemType,
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

                    casterToken.object.setTarget(true, {
                      user: game.user,
                      releaseOthers: true,
                    });

                    DragonbaneUtils.debugLog(
                      "dragonbane-action-rules",
                      "TokenActionHUD",
                      `Auto-targeted ${selectedToken.actor.name} for personal Magic Trick: ${itemName}`,
                    );
                  } catch (error) {
                    if (
                      typeof DoD_Utility !== "undefined" &&
                      DoD_Utility.WARNING
                    ) {
                      DoD_Utility.WARNING(
                        `Auto-targeting failed for ${itemName}: ${error.message}`,
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
                selectedToken.actor,
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
                selectedToken.actor,
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
            `Error in Token Action HUD rollItem validation: ${error.message}`,
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
            (i) => i.name === itemName && i.type === itemType,
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
                selectedToken.actor,
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
                selectedToken.actor,
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
            `Error in Token Action HUD useItem validation: ${error.message}`,
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
 * Setup character sheet attack interception.
 * v14 AppV2 captures the action handler reference when each sheet builds its
 * options, BEFORE renderActorSheetV2 fires — so per-render wrapping is too late.
 * Instead we wrap the handler on the class's static DEFAULT_OPTIONS once, before
 * any sheet renders, so AppV2 captures our wrapped version.
 */
export function setupSheetInterception(moduleId) {
  if (originalMethods.has("_skillRollHandler")) return;

  const charCls =
    CONFIG.Actor.sheetClasses?.character?.["DoD.DoDCharacterSheet"]?.cls;
  const baseCls = charCls ? Object.getPrototypeOf(charCls) : null;
  const action = baseCls?.DEFAULT_OPTIONS?.actions?.skillRoll;

  if (!action || typeof action.handler !== "function") return;
  if (action.handler._darWrapped) return;

  const original = action.handler;
  originalMethods.set("_skillRollHandler", { action, original });

  const wrapped = async function (event, target) {
    const callOriginal = () => original.call(this, event, target);

    if (event.type !== "click") return callOriginal();
    if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return callOriginal();
    if (
      !DragonbaneUtils.getSetting(moduleId, "enforceTargetSelection") &&
      !DragonbaneUtils.getSetting(moduleId, "enforceRangeChecking")
    )
      return callOriginal();
    if (DragonbaneActionRules.overrides?.validationBypass)
      return callOriginal();

    try {
      const row = target.closest(".sheet-table-data");
      const itemId = row?.dataset.itemId;
      const item = itemId ? this.actor.items.get(itemId) : null;

      if (
        item?.type === "weapon" &&
        DragonbaneActionRules.validator?.performWeaponAttack
      ) {
        const validation =
          await DragonbaneActionRules.validator.performWeaponAttack(
            item.name,
            this.actor,
          );
        if (!validation.success) {
          ui.notifications.warn(validation.message);
          return;
        }
      }

      if (
        item?.type === "spell" &&
        item.system?.rank > 0 &&
        DragonbaneActionRules.validator?.performSpellCast
      ) {
        const validation =
          await DragonbaneActionRules.validator.performSpellCast(
            item.name,
            this.actor,
          );
        if (!validation.success) {
          ui.notifications.warn(validation.message);
          return;
        }
      }
    } catch (error) {
      if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
        DoD_Utility.WARNING(
          `Error in sheet attack validation: ${error.message}`,
        );
      }
    }

    return callOriginal();
  };

  wrapped._darWrapped = true;
  action.handler = wrapped;
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
  if (originalMethods.has("_skillRollHandler")) {
    const { action, original } = originalMethods.get("_skillRollHandler");
    action.handler = original;
    originalMethods.delete("_skillRollHandler");
  }
}

/**
 * Clean up character sheet hooks (called on module disable)
 */
export function cleanupCharacterSheets() {
  Object.values(ui.windows)
    .filter(
      (app) =>
        app.constructor.name === "DoDCharacterSheet" && app._dragonbaneHooked,
    )
    .forEach((app) => delete app._dragonbaneHooked);
}

// Journal hook for grudge tracking (v14)
function registerJournalHooks(moduleId) {
  Hooks.on("renderJournalEntryPageSheet", (sheet, html, data) => {
    handleGrudgeJournalSheet(moduleId, sheet, html, {
      folderPath: sheet.document?.parent?.folder?.name,
      journalName: sheet.document?.name,
    });
  });
}

// Handler for grudge journal sheet rendering
function handleGrudgeJournalSheet(moduleId, sheetOrJournal, html, paths) {
  if (!DragonbaneUtils.getSetting(moduleId, "enabled")) return;
  if (!DragonbaneUtils.getSetting(moduleId, "enableGrudgeTracking")) return;

  const folderName = game.i18n.localize(
    "DRAGONBANE_ACTION_RULES.grudgeTracker.folderName",
  );
  if (paths.folderPath !== folderName) return;

  try {
    // html is a native HTMLElement in v14; no further interaction needed here
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
    "i",
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
