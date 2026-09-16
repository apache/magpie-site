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
const TOMBSTONE_TAG = "[tombstone]";

export async function run({ gh, git, repo, fetchArtifact, only = null }) {
  const openPulls = await gh.listOpenPulls();

  // Armed state is resolved for EVERY open PR, even when publishing just one.
  // Scoping this map to the dispatched PR would leave every other preview
  // looking disarmed, and the reap step would tombstone all of them.
  const armedByPr = new Map();
  for (const pull of openPulls) {
    const comments = await gh.listComments(pull.number);
    const { armed } = await resolveArmed({ comments, hasWriteAccess: gh.hasWriteAccess });
    armedByPr.set(pull.number, armed);

    if (!comments.some((c) => typeof c.body === "string" && c.body.includes(`<!-- ${HOWTO_MARKER} -->`))) {
      await gh.upsertComment(pull.number, HOWTO_MARKER, howtoBody(pull.number));
    }
  }

  // A dispatch is itself the authorisation, so it arms the PR it names.
  if (only !== null) armedByPr.set(only, true);

  const previewBranches = await gh.listPreviewBranches();
  const tombstoned = new Set();
  for (const branch of previewBranches) {
    const message = await git.headMessage(branch);
    if (message.includes(TOMBSTONE_TAG)) tombstoned.add(branch);
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
    const pull = openPulls.find((p) => p.number === pr);
    const headSha = pull.head.sha;

    const build = await gh.latestSuccessfulBuild(headSha);
    if (!build) {
      await gh.upsertComment(pr, MARKER, waitingBody(pr, headSha));
      continue;
    }

    const artifact = await fetchArtifact(build.id);
    if (!artifact) {
      await gh.upsertComment(pr, MARKER, waitingBody(pr, headSha));
      continue;
    }

    const check = validateMeta(artifact.meta, { number: pr, headSha });
    if (!check.ok) {
      await gh.upsertComment(pr, MARKER, refusedBody(pr, check.reason));
      continue;
    }

    const unsafe = artifact.dir ? await findUnsafeEntries(artifact.dir).catch(() => []) : [];
    if (unsafe.length) {
      await gh.upsertComment(pr, MARKER, refusedBody(pr, `unsafe entries: ${unsafe.join(", ")}`));
      continue;
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
  }

  for (const pr of actions.tombstone) {
    await git.pushTree(
      previewBranch(pr),
      {
        "index.html": renderTombstone({ pr, repo }),
        ".asf.yaml": renderAsfYaml(pr),
        "robots.txt": renderRobots(),
      },
      `Retire preview for #${pr} ${TOMBSTONE_TAG}`,
    );
  }

  for (const branch of actions.delete) {
    await gh.deleteBranch(branch);
  }
}

const publishedBody = (pr, sha) =>
  `### Preview published\n\n${previewUrl(pr)}\n\nBuilt from \`${sha.slice(0, 7)}\`. ` +
  `Staging takes a few minutes to pick up a new push.`;

const waitingBody = (pr, sha) =>
  `### Preview waiting on a build\n\nNo successful build for \`${sha.slice(0, 7)}\` yet. ` +
  `The preview publishes on the next run after the build goes green.`;

const refusedBody = (pr, reason) =>
  `### Preview could not be published\n\nThe build artifact was refused: ${reason}`;

const howtoBody = (pr) =>
  `### Preview this pull request\n\nA committer can publish a live preview of this PR by ` +
  `commenting \`/show-preview\` on its own line. It will appear at ${previewUrl(pr)} ` +
  `and then track this PR's head commit until it closes.\n\nStaging takes a few minutes ` +
  `to pick up each push.`;
