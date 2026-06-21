/**
 * Dragonbane Combat Assistant - Automated Animations Integration
 *
 * Triggers Automated Animations (and its configured sounds) for spells that
 * AA's native Dragonbane handler skips — non-damaging ranked spells and magic
 * tricks. Damaging spells are left entirely to AA's native handler.
 *
 * This replaces the old `system.damage = "n/a"` mutation approach. Instead of
 * faking a damage roll so AA's handler notices the spell, we call AA's public
 * trigger API directly via a renderChatMessageHTML hook. No world-data mutation.
 *
 * Two detection paths:
 *   Path 1 (ranked spells): typed `spellTest` chat message — read isDamaging,
 *           spellUuid, targetActorUuid structurally from message.system.
 *   Path 2 (magic tricks):  plain chat message (no system data on 4.0.1) —
 *           identify the spell by the @UUID reference in message content.
 *           See the clearly-labeled 4.0.1 compatibility block; this deletes
 *           when Dragonbane 4.1 unifies the trick execution path with ranked spells.
 */

import { DragonbaneUtils } from "./utils.js";

const AA_MODULE_ID = "autoanimations";

/**
 * Is Automated Animations installed, active, and exposing a usable trigger API?
 * Supports both the current `AutomatedAnimations` global and the older
 * `AutoAnimations` global as a fallback.
 */
function getAAApi() {
  if (!game.modules.get(AA_MODULE_ID)?.active) return null;
  if (
    typeof AutomatedAnimations !== "undefined" &&
    typeof AutomatedAnimations.playAnimation === "function"
  ) {
    return AutomatedAnimations;
  }
  if (
    typeof AutoAnimations !== "undefined" &&
    typeof AutoAnimations.playAnimation === "function"
  ) {
    return AutoAnimations;
  }
  return null;
}

/**
 * Resolve the caster's placed Token object from a chat message's speaker.
 */
function getCasterToken(message) {
  const tokenId = message.speaker?.token;
  if (!tokenId) return null;
  const sceneId = message.speaker?.scene;
  const scene = sceneId ? game.scenes.get(sceneId) : canvas.scene;
  const tokenDoc = scene?.tokens?.get(tokenId);
  return tokenDoc?.object ?? null;
}

/**
 * Fire the AA animation for a given caster token + spell item.
 * targets is an optional array/Set of target Token objects.
 */
function triggerAnimation(aa, casterToken, spell, targets) {
  if (!casterToken || !spell) return;
  try {
    const options = {};
    if (targets && targets.length) options.targets = targets;
    aa.playAnimation(casterToken, spell, options);
  } catch (error) {
    if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
      DoD_Utility.WARNING(`AA playAnimation failed: ${error.message}`);
    }
  }
}

/**
 * Resolve target Token objects for the animation from the caster's live
 * targets (game.user.targets). Returns an array (possibly empty).
 *
 * We deliberately use live targets rather than message.system.targetActorUuid:
 * that field stores an *Actor* UUID (bare `Actor.xxx` for linked actors), which
 * cannot disambiguate *which token* when several tokens share one actor (e.g.
 * multiple goblins from the same actor on the canvas). game.user.targets holds
 * the actual targeted Token objects, so the animation lands on the right token.
 *
 * The caster token is filtered out so self/personal spells anchor on the caster
 * (correct for on-token/self animations) rather than passing the caster as a
 * "target".
 */
function getLiveTargets(casterToken) {
  return Array.from(game.user.targets ?? []).filter(
    (t) => t && t !== casterToken,
  );
}

/**
 * The renderChatMessageHTML handler. Registered from registerHooks().
 */
export function onRenderChatMessageForAA(message, _html, _data) {
  const aa = getAAApi();
  if (!aa) return;

  // Only the message author triggers, so the animation fires once, not once
  // per connected client. On Dragonbane 4.0.1 the live property is
  // message.author (message.user is deprecated/undefined); fall back to user
  // for older versions.
  const authorId = message.author?.id ?? message.user?.id;
  if (authorId !== game.user.id) return;

  const sys = message.system;
  const typedKind = sys?.constructor?.TYPE;

  // ---- Path 1: ranked spells (typed spellTest message) ----
  if (typedKind === "spellTest") {
    // Damaging ranked spells animate natively via AA's Dragonbane handler.
    // Only act on the non-damaging case AA skips.
    if (sys.isDamaging === true) return;

    const spell = sys.spellUuid ? fromUuidSync(sys.spellUuid) : null;
    const casterToken = getCasterToken(message);
    if (!spell || !casterToken) return;

    const targets = getLiveTargets(casterToken);
    triggerAnimation(aa, casterToken, spell, targets);
    return;
  }

  // ---- Path 2: magic tricks (plain message) ----
  // === BEGIN 4.0.1 magic-trick compatibility ===
  // Tricks do not emit a typed spellTest message on 4.0.1; they post a plain
  // chat message with the spell as an @UUID reference in the content, and carry
  // no target. Identify the spell from content, anchor on the caster, and read
  // live targets from game.user.targets.
  // DELETE this entire block when Dragonbane 4.1 unifies the magic-trick
  // execution path with ranked spells (tricks will then hit Path 1 above).
  if (!sys || typedKind) return; // only plain, untyped messages reach here
  const content = message.content || "";
  const match = content.match(/@UUID\[Actor\.([^.]+)\.Item\.([^\]]+)\]/);
  if (!match) return;

  const [, actorId, itemId] = match;
  const trickActor = game.actors.get(actorId);
  const trickSpell = trickActor?.items.get(itemId);
  if (!trickSpell || trickSpell.type !== "spell") return;

  // Confirm it's actually a trick (rank 0 or general school), not some other
  // @UUID-bearing message.
  const isTrick =
    trickSpell.system?.rank === 0 ||
    trickSpell.system?.school?.toLowerCase() === "general";
  if (!isTrick) return;

  const trickCaster = getCasterToken(message);
  if (!trickCaster) return;

  const liveTargets = Array.from(game.user.targets ?? [])
    .map((t) => t)
    .filter((t) => t && t !== trickCaster);

  triggerAnimation(aa, trickCaster, trickSpell, liveTargets);
  // === END 4.0.1 magic-trick compatibility ===
}

/**
 * One-time legacy data migration.
 *
 * Worlds that used the old "Enable AA Support" feature have `system.damage =
 * "n/a"` written into every non-damaging spell. The new approach never tags
 * spells, and leftover "n/a" makes the system read those spells as damaging —
 * which breaks the Path 1 gate (they'd be skipped as "damaging"). Clear them.
 *
 * - Exact match only: clears where system.damage === "n/a" (verified: no
 *   whitespace/case variants exist in real data).
 * - Clears to "" (empty string), matching natively-clean non-damaging spells.
 * - World actors only (game.actors) — matches the old enhancement's scope.
 *   Does NOT touch compendiums.
 * - GM-only; guarded by a world flag so it runs exactly once.
 */
export async function runLegacyAACleanup(moduleId) {
  try {
    if (!game.user.isGM) return;

    const FLAG = "aaCleanupComplete";
    if (game.settings.get(moduleId, FLAG)) return;

    let cleared = 0;
    for (const actor of game.actors) {
      if (!actor) continue;
      for (const item of actor.items) {
        if (item.type === "spell" && item.system?.damage === "n/a") {
          await item.update({ "system.damage": "" });
          cleared++;
        }
      }
    }

    await game.settings.set(moduleId, FLAG, true);

    if (cleared > 0) {
      ui.notifications.info(
        game.i18n.format("DRAGONBANE_ACTION_RULES.aa.legacyCleanup", {
          count: cleared,
        }),
      );
    }

    DragonbaneUtils.debugLog(
      moduleId,
      "AAIntegration",
      `Legacy AA cleanup complete: cleared ${cleared} spell(s)`,
    );
  } catch (error) {
    if (typeof DoD_Utility !== "undefined" && DoD_Utility.WARNING) {
      DoD_Utility.WARNING(`Legacy AA cleanup error: ${error.message}`);
    }
  }
}
