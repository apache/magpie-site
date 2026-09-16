import { resolveArmed } from "./armed.mjs";
import { planActions } from "./plan.mjs";
import { validateMeta, findUnsafeEntries } from "./validate.mjs";
import {
  renderAsfYaml,
  renderRobots,
  renderTombstone,
  previewBranch,
  previewUrl,
} from "./files.mjs";

const MARKER = "magpie-preview-status";
const HOWTO_MARKER = "magpie-preview-howto";
const ARMED_MARKER = "magpie-preview-armed";
const TOMBSTONE_TAG = "[tombstone]";

/**
 * A bot-authored comment ending in exactly this tag.
 *
 * The same predicate github.mjs uses before editing a comment, and for the same
 * reason: a bare substring test lets anyone who can comment plant the marker.
 */
function hasBotMarker(comments, marker) {
  const tag = `<!-- ${marker} -->`;
  return comments.some(
    (c) =>
      c?.user?.type === "Bot" &&
      typeof c.body === "string" &&
      c.body.trimEnd().endsWith(tag),
  );
}

export async function run({
  gh,
  git,
  repo,
  fetchArtifact,
  only = null,
  dispatchedBy = null,
}) {
  const openPulls = await gh.listOpenPulls();

  // Armed state is resolved for EVERY open PR, even when publishing just one:
  // scoping this to the dispatched PR would leave every other preview looking
  // disarmed, and the reap step would tombstone all of them.
  const armedByPr = new Map();
  for (const pull of openPulls) {
    try {
      const comments = await gh.listComments(pull.number);
      const { armed } = await resolveArmed({
        comments,
        hasWriteAccess: gh.hasWriteAccess,
      });

      // A manual dispatch leaves a durable, bot-authored arming record. Without
      // it a dispatched preview reads as unarmed on the next scheduled run and
      // is tombstoned within one cron interval.
      armedByPr.set(pull.number, armed || hasBotMarker(comments, ARMED_MARKER));

      if (!hasBotMarker(comments, HOWTO_MARKER)) {
        await gh.upsertComment(pull.number, HOWTO_MARKER, howtoBody(pull.number));
      }
    } catch (err) {
      // One PR's transient failure must not abort every other publish and the
      // whole reap. The PR is left with no armedByPr entry, which planActions
      // treats as unknown and leaves alone.
      console.error(`preview: skipping #${pull.number}: ${err.message}`);
    }
  }

  // A dispatch is itself the authorisation.
  if (only !== null) armedByPr.set(only, true);

  const previewBranches = await gh.listPreviewBranches();

  // Derived from each branch's ACTUAL head commit, never from a belief that an
  // earlier push succeeded: deleting a branch does not unstage the site, so a
  // delete after a failed tombstone strands live content with nothing left to
  // overwrite it.
  const tombstoned = new Set();
  for (const branch of previewBranches) {
    try {
      const message = await git.headMessage(branch);
      if (message.includes(TOMBSTONE_TAG)) tombstoned.add(branch);
    } catch (err) {
      // Treat an unreadable head as un-tombstoned. Re-pushing a tombstone is
      // idempotent; deleting a branch we could not inspect is not recoverable,
      // because deleting a branch does not unstage the site.
      console.error(`preview: could not read ${branch} head: ${err.message}`);
    }
  }

  const actions = planActions({
    openPulls: openPulls.map((p) => p.number),
    armedByPr,
    previewBranches,
    tombstoned,
  });

  // A dispatch publishes only its PR, but still reaps everything.
  if (only !== null) actions.publish = actions.publish.filter((n) => n === only);

  for (const pr of actions.publish) {
    try {
      const published = await publishOne({ gh, git, repo, fetchArtifact, openPulls, pr });
      if (published && only === pr) {
        await gh.upsertComment(pr, ARMED_MARKER, armedBody(pr, dispatchedBy));
      }
    } catch (err) {
      console.error(`preview: publish failed for #${pr}: ${err.message}`);
    }
  }

  for (const pr of actions.tombstone) {
    try {
      await git.pushTree(
        previewBranch(pr),
        {
          "index.html": renderTombstone({ pr, repo }),
          ".asf.yaml": renderAsfYaml(pr),
          "robots.txt": renderRobots(),
        },
        `Retire preview for #${pr} ${TOMBSTONE_TAG}`,
      );
      await gh.upsertComment(pr, MARKER, retiredBody(pr));
    } catch (err) {
      console.error(`preview: tombstone failed for #${pr}: ${err.message}`);
    }
  }

  for (const branch of actions.delete) {
    try {
      await gh.deleteBranch(branch);
    } catch (err) {
      console.error(`preview: delete failed for ${branch}: ${err.message}`);
    }
  }
}

/** Returns true only when content was actually published. */
async function publishOne({ gh, git, repo, fetchArtifact, openPulls, pr }) {
  const pull = openPulls.find((p) => p.number === pr);
  if (!pull) return false;
  const headSha = pull.head.sha;

  const build = await gh.latestSuccessfulBuild(headSha);
  if (!build) {
    await gh.upsertComment(pr, MARKER, waitingBody(pr, headSha));
    return false;
  }

  const artifact = await fetchArtifact(build.id);
  if (!artifact) {
    await gh.upsertComment(pr, MARKER, waitingBody(pr, headSha));
    return false;
  }

  const check = validateMeta(artifact.meta, { number: pr, headSha });
  if (!check.ok) {
    await gh.upsertComment(pr, MARKER, refusedBody(pr, check.reason));
    return false;
  }

  if (!artifact.dir) {
    await gh.upsertComment(pr, MARKER, refusedBody(pr, "artifact had no extracted directory"));
    return false;
  }

  // Fail CLOSED. A security screen on the one privileged, credential-holding
  // step must never read "could not look" as "nothing found".
  let unsafe;
  try {
    unsafe = await findUnsafeEntries(artifact.dir);
  } catch (err) {
    await gh.upsertComment(pr, MARKER, refusedBody(pr, `could not screen the artifact: ${err.message}`));
    return false;
  }
  if (unsafe.length) {
    await gh.upsertComment(pr, MARKER, refusedBody(pr, `unsafe entries: ${unsafe.join(", ")}`));
    return false;
  }

  await git.pushTree(
    previewBranch(pr),
    {
      ".asf.yaml": renderAsfYaml(pr),
      "robots.txt": renderRobots(),
    },
    `Publish preview for #${pr} (${headSha.slice(0, 7)})`,
    artifact.dir,
  );

  await gh.upsertComment(pr, MARKER, publishedBody(pr, headSha));
  return true;
}

const publishedBody = (pr, sha) =>
  `### Preview published\n\n${previewUrl(pr)}\n\nBuilt from \`${sha.slice(0, 7)}\`. ` +
  `Staging takes a few minutes to pick up a new push.`;

const waitingBody = (pr, sha) =>
  `### Preview waiting on a build\n\nNo successful build for \`${sha.slice(0, 7)}\` yet. ` +
  `The preview publishes on the next run after the build goes green.`;

const refusedBody = (pr, reason) =>
  `### Preview could not be published\n\nThe build artifact was refused: ${reason}`;

const retiredBody = (pr) =>
  `### Preview retired\n\nThe preview for this pull request is no longer published. ` +
  `${previewUrl(pr)} now serves a notice instead.`;

const armedBody = (pr, by) =>
  `### Preview armed by manual dispatch\n\n` +
  (by ? `@${by} published this preview by dispatching the workflow.` : `This preview was published by manual dispatch.`) +
  ` It will keep tracking this PR's head commit until the PR closes.`;

const howtoBody = (pr) =>
  `### Preview this pull request\n\nA committer can publish a live preview of this PR by ` +
  `commenting \`/show-preview\` on its own line. It will appear at ${previewUrl(pr)} ` +
  `and then track this PR's head commit until it closes.\n\nStaging takes a few minutes ` +
  `to pick up each push.`;
