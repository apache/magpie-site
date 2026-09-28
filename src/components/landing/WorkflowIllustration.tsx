import { ArrowRight, FileWarning, FileCheck2, ShieldAlert, PackageCheck, GitPullRequest, MessageSquare, Bug, Braces, TestTube2, Package, UserRound, ClipboardCheck, Boxes, Search, UserPlus, KeyRound, Bot, FolderCode, ShieldCheck, CircleCheck } from "lucide-react";

const scenes = {
  security: { input: FileWarning, badge: ShieldAlert, output: PackageCheck, next: FileCheck2, labels: ["Release", "CVE"] },
  review: { input: GitPullRequest, badge: Search, output: Braces, next: MessageSquare, labels: ["Code", "Review"] },
  bug: { input: Bug, badge: Search, output: Braces, next: TestTube2, labels: ["Patch", "Tests"] },
  release: { input: Package, badge: Search, output: PackageCheck, next: FileCheck2, labels: ["Verified", "Release"] },
  contributor: { input: UserRound, badge: Search, output: ClipboardCheck, next: Braces, labels: ["First task", "Code"] },
  dependencies: { input: Boxes, badge: ShieldAlert, output: Search, next: ClipboardCheck, labels: ["Findings", "Upgrades"] },
  pairing: { input: Braces, badge: Search, output: Search, next: CircleCheck, labels: ["Review", "Fixes"] },
  onboarding: { input: UserPlus, badge: KeyRound, output: KeyRound, next: UserRound, labels: ["Access", "Welcome"] },
  sandbox: { input: Bot, badge: ShieldAlert, output: Bot, next: FolderCode, labels: ["Agent", "Project"] },
};

export type WorkflowScene = keyof typeof scenes;

export default function WorkflowIllustration({ scene, result = false }: { scene: WorkflowScene; result?: boolean }) {
  const { input: Input, badge: Badge, output: Output, next: Next, labels } = scenes[scene];
  return <div className={`workflow-illustration ${result ? "illustration-result" : "illustration-input"}`} aria-hidden="true">
    {result ? <div className={`illustration-pair ${scene === "sandbox" ? "illustration-sandbox" : ""}`}>
      <div><Output size={30} /><span>{labels[0]}</span></div>
      {scene === "sandbox" ? <ShieldCheck size={20} /> : <ArrowRight size={20} />}
      <div><Next size={30} /><span>{labels[1]}</span></div>
    </div> : <div className="illustration-document">
      <Input size={30} />
      <div className="illustration-lines"><i /><i /><i /></div>
      <span className="illustration-badge"><Badge size={22} /></span>
    </div>}
  </div>;
}
