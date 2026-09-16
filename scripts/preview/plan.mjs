const BRANCH_RE = /^preview\/pr(\d+)-staging$/;

/**
 * Pure decision step: what this run should publish, tombstone and delete.
 *
 * Tombstone and delete are separate runs on purpose. Deleting a branch does
 * not unstage the site, so the tombstone must be pushed and allowed to
 * propagate before the branch goes away.
 */
export function planActions({ openPulls, armedByPr, previewBranches, tombstoned }) {
  const open = new Set(openPulls);
  const publish = openPulls.filter((n) => armedByPr.get(n) === true);

  const tombstone = [];
  const remove = [];

  for (const branch of previewBranches) {
    const match = BRANCH_RE.exec(branch);
    if (!match) continue;

    const pr = Number(match[1]);
    // An open PR whose armed state was never resolved is UNKNOWN, not disarmed.
    // Retiring overwrites live content, so missing data must never be more
    // dangerous than an explicit `false`: leave the branch alone this run and
    // let a later run decide once the state is known.
    if (open.has(pr) && !armedByPr.has(pr)) continue;
    const retired = !open.has(pr) || armedByPr.get(pr) !== true;
    if (!retired) continue;

    if (tombstoned.has(branch)) remove.push(branch);
    else tombstone.push(pr);
  }

  return { publish, tombstone, delete: remove };
}
