# Feedback Harness

The Feedback Harness turns Nucleus user feedback into product-improvement findings.

## Language

**Feedback Signal**:
A normalized feedback record from any Nucleus feedback form: case closure, general feedback, or targeted feedback.
_Avoid_: feedback row, raw feedback, response

**Case Closure Feedback**:
Feedback submitted during the case close workflow.
_Avoid_: case feedback

**General Feedback**:
Feedback submitted without a specific UI element context.
_Avoid_: untargeted feedback

**Targeted Feedback**:
Feedback submitted with a specific UI element context.
_Avoid_: element feedback, targeted form

**Feedback Digest**:
A weekly report that packages product-improvement findings from Feedback Signals.
_Avoid_: summary, report

**Feedback Digest Run**:
One execution of the Feedback Harness that collects Feedback Signals for a period, synthesizes a Feedback Digest, builds a Digest Artifact, and optionally writes it to an Artifact Store.
_Avoid_: job, pipeline run, service call

**Digest Corpus**:
The accumulated collection of Feedback Digests used for longitudinal analysis.
_Avoid_: archive, repository, history

**Digest Artifact**:
The durable output of one Feedback Digest run, including human-readable findings, structured findings, evidence IDs, coverage stats, completion status, and model/run metadata.
_Avoid_: output file, report file

**Incomplete Digest Artifact**:
A Digest Artifact that explicitly marks some non-empty Feedback Signals as not synthesized.
_Avoid_: partial report, failed digest

**Model Evaluation**:
An ad hoc comparison of model outputs over the same Feedback Signals or Digest Artifact inputs.
_Avoid_: model run, A/B test

**Artifact Store**:
The durable place where Digest Artifacts are kept for later review and longitudinal analysis.
_Avoid_: output directory, archive

**Source Diversity**:
The spread of supporting Feedback Signals across tenants, users, cases, and feedback sources.
_Avoid_: segmentation, breakdown

**Sensitive Evidence**:
Customer-identifying or security-sensitive details contained in Feedback Signals.
_Avoid_: PII, secrets

**Issue Candidate**:
A Research Finding that may become a GitHub issue after human approval.
_Avoid_: ticket, Jira, task

**Digest Consumer**:
The primary audience for a Feedback Digest: product, design, and research collaborators.
_Avoid_: stakeholder, reader, audience

**Duplicate Signal**:
A Feedback Signal that appears to describe a repeated, recurring, or duplicate underlying case pattern.
_Avoid_: dup row, repeated feedback

**Duplicate Burden**:
The user pain caused by repeated, recurring, or duplicate case patterns that require analyst attention.
_Avoid_: duplicate rate, recurring noise

**Finding Severity**:
The impact level of a Research Finding, based on workflow blockage, risk of incorrect security judgment, or trust damage.
_Avoid_: priority, importance

**Finding Confidence**:
The evidence strength of a Research Finding, based on evidence quality, recurrence, source diversity, and consistency.
_Avoid_: model confidence, certainty

**Research Finding**:
An evidence-backed insight about a user need, pain point, workflow problem, or product opportunity; it carries severity, confidence, supporting evidence, and a recommended next step.
_Avoid_: theme, takeaway, model output

## Relationships

- A **Feedback Signal** originates from exactly one of **Case Closure Feedback**, **General Feedback**, or **Targeted Feedback**.
- A **Feedback Digest** contains one or more **Research Findings**.
- The **Digest Corpus** contains many **Feedback Digests** over time.
- An **Artifact Store** contains Digest Artifacts.
- A **Feedback Digest** produces one **Digest Artifact**.
- An **Incomplete Digest Artifact** must not be presented as a complete Feedback Digest.
- A **Research Finding** may become an **Issue Candidate**.
- An **Issue Candidate** is not created as a GitHub issue until a human approves it.
- A **Research Finding** becomes an **Issue Candidate** only when its next step is concrete enough for ownership and action.
- A **Model Evaluation** compares models outside the canonical weekly Feedback Digest.
- A **Digest Consumer** uses Research Findings to make product-improvement decisions.
- A **Research Finding** may mention suspected **Duplicate Signals**, but duplicate detection is not authoritative.
- **Duplicate Burden** may appear as a Research Finding when supported by language-derived Duplicate Signals.
- **Finding Severity** is separate from frequency; a single Feedback Signal can support a high-severity Research Finding.
- **Finding Confidence** is not model self-confidence.
- A **Feedback Digest** covers all non-empty **Feedback Signals** in its period; empty signals are counted but excluded from qualitative synthesis.
- A **Research Finding** is supported by one or more **Feedback Signals**.
- A **Research Finding** describes an affected workflow, user need or pain point, representative evidence, severity, confidence, source diversity, and a recommended next step.
- A **Feedback Digest** should avoid exposing Sensitive Evidence unless it is necessary to understand the finding.

## Example dialogue

> **Dev:** "Should this weekly digest include only **Case Closure Feedback**?"
> **Domain expert:** "No — it should include every **Feedback Signal**, including **General Feedback** and **Targeted Feedback**."

## Flagged ambiguities

- "feedback" was used to mean both raw table rows and normalized records — resolved: normalized records are **Feedback Signals**.
- "digest" and "findings" were used interchangeably — resolved: a **Feedback Digest** is the report artifact; **Research Findings** are the evidence-backed insights inside it.
- "complete digest" could include empty feedback rows — resolved: completeness applies to non-empty **Feedback Signals** for qualitative synthesis, while empty signals are counted separately.
- "duplicate" has no authoritative structured source in current feedback data — resolved: **Duplicate Signals** are suspected from language such as dup, duplicate, recurring, or repeat, not treated as ground truth.
