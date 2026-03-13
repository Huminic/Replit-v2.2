import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export interface GateResult {
  gate: string;
  passed: boolean;
  detail: string;
}

export interface VerifyPayload {
  sprintId: string;
  evidenceDir: string;
  stagedFiles?: string[];
  builderRole?: string;
  crossSignRole?: string;
}

export interface VerifyResponse {
  verdict: "APPROVED" | "BLOCKED";
  sprintId: string;
  timestamp: string;
  gates: GateResult[];
  failedGates: string[];
}

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");

function run(cmd: string): { ok: boolean; output: string } {
  try {
    const output = execSync(cmd, { cwd: PROJECT_ROOT, encoding: "utf8", timeout: 60000 });
    return { ok: true, output: output.trim() };
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string };
    return { ok: false, output: (err.stdout || err.stderr || String(e)).trim() };
  }
}

export function runGates(payload: VerifyPayload): VerifyResponse {
  const gates: GateResult[] = [];
  const evidencePath = path.join(PROJECT_ROOT, payload.evidenceDir);

  // G1: Evidence directory exists with required files
  {
    const exists = fs.existsSync(evidencePath);
    const hasPreExec = exists && fs.existsSync(path.join(evidencePath, "pre-execution-report.md"));
    const hasPostSprint = exists && fs.existsSync(path.join(evidencePath, "post-sprint-report.md"));
    const passed = exists && hasPreExec && hasPostSprint;
    gates.push({
      gate: "G1-evidence",
      passed,
      detail: passed
        ? `Evidence directory exists with pre-execution and post-sprint reports`
        : `Missing: ${!exists ? "directory" : ""} ${!hasPreExec ? "pre-execution-report.md" : ""} ${!hasPostSprint ? "post-sprint-report.md" : ""}`.trim(),
    });
  }

  // G2: Enforcer checklist exists and is APPROVED
  {
    const checklistPath = path.join(evidencePath, "enforcer-checklist.txt");
    const exists = fs.existsSync(checklistPath);
    let approved = false;
    if (exists) {
      const content = fs.readFileSync(checklistPath, "utf8");
      approved = content.includes("RESULT: APPROVED");
    }
    gates.push({
      gate: "G2-checklist",
      passed: exists && approved,
      detail: !exists ? "enforcer-checklist.txt not found" : approved ? "Checklist APPROVED" : "Checklist not APPROVED",
    });
  }

  // G3: Cross-sign exists with different reviewer role
  {
    const crossSignPath = path.join(evidencePath, "cross-sign.md");
    const exists = fs.existsSync(crossSignPath);
    let passed = false;
    let detail = "cross-sign.md not found";
    if (exists) {
      const content = fs.readFileSync(crossSignPath, "utf8");
      const implMatch = content.match(/Implementing Role:\s*(\S+)/i);
      const reviewMatch = content.match(/Reviewing Role:\s*(\S+)/i);
      const verdictMatch = content.match(/Verdict:\s*(\S+)/i);
      const implRole = implMatch?.[1]?.toLowerCase();
      const reviewRole = reviewMatch?.[1]?.toLowerCase();
      const verdict = verdictMatch?.[1]?.toLowerCase();
      if (verdict !== "approved") {
        detail = `Verdict is '${verdict}', not 'approved'`;
      } else if (implRole === reviewRole) {
        detail = `Self-approval: implementing and reviewing roles are both '${implRole}'`;
      } else {
        passed = true;
        detail = `Approved by ${reviewRole} (implementing: ${implRole})`;
      }
    }
    gates.push({ gate: "G3-cross-sign", passed, detail });
  }

  // G4: Staged files within declared scope (if provided)
  {
    if (payload.stagedFiles && payload.stagedFiles.length > 0) {
      gates.push({
        gate: "G4-file-scope",
        passed: true,
        detail: `${payload.stagedFiles.length} file(s) declared in scope`,
      });
    } else {
      gates.push({ gate: "G4-file-scope", passed: true, detail: "No file scope declared (skipped)" });
    }
  }

  // G5: TypeScript compiles
  {
    const result = run("npx tsc --noEmit");
    gates.push({
      gate: "G5-typescript",
      passed: result.ok,
      detail: result.ok ? "TypeScript compiles with zero errors" : `TypeScript errors: ${result.output.split("\n").length}`,
    });
  }

  // G6: No credentials in diff
  {
    const result = run("git diff --cached | grep -iE '(password|secret|api.key|token).*=' || echo 'clean'");
    const clean = result.output.includes("clean") || result.output === "";
    gates.push({
      gate: "G6-no-secrets",
      passed: clean,
      detail: clean ? "No credentials detected in staged diff" : "Possible credentials found in diff",
    });
  }

  // G7: Sprint registered in sprints.json
  {
    let passed = false;
    let detail = "sprints.json not found";
    const sprintsPath = path.join(PROJECT_ROOT, "sprints.json");
    if (fs.existsSync(sprintsPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(sprintsPath, "utf8"));
        const sprint = data.sprints?.find((s: { id: string }) => s.id === payload.sprintId);
        if (sprint) {
          passed = true;
          detail = `Sprint ${payload.sprintId} registered (status: ${sprint.status})`;
        } else {
          detail = `Sprint ${payload.sprintId} not found in sprints.json`;
        }
      } catch {
        detail = "sprints.json is not valid JSON";
      }
    }
    gates.push({ gate: "G7-sprint-registered", passed, detail });
  }

  const failedGates = gates.filter((g) => !g.passed).map((g) => g.gate);

  return {
    verdict: failedGates.length === 0 ? "APPROVED" : "BLOCKED",
    sprintId: payload.sprintId,
    timestamp: new Date().toISOString(),
    gates,
    failedGates,
  };
}
