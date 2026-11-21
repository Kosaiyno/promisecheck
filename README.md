# PromiseCheck

> **GenLayer Builder Track**: Intelligent Contracts
> **Network**: StudioNet (Chain ID `61999`)
> **Runner**: `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`
> **Contract**: `contracts/promise_check.py`

PromiseCheck is an Intelligent Contract that verifies whether a crypto project delivered its announced Token Generation Event (TGE). A promise is registered once with the original announcement, then anyone can submit public evidence and have GenLayer validators classify the outcome.

The model does not move money and does not invent amounts. It returns one fixed status, and deterministic code stores that status. A positive or negative verdict must be backed by a verbatim quote that every validator finds in its own copy of the evidence.

## Verdicts

| Status | Meaning |
|---|---|
| `TGE_COMPLETED` | Credible evidence confirms the token launch happened. |
| `TGE_DELAYED` | Credible evidence confirms the TGE was postponed or rescheduled. |
| `TGE_NOT_COMPLETED` | The promised date passed and evidence shows the TGE did not happen. |
| `INSUFFICIENT_EVIDENCE` | The two sources do not establish what happened. |
| `FETCH_FAILED` | A source could not be fetched (HTTP error, empty page, too little text). |

## Architecture

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant PC as PromiseCheck
    participant Web as Public Sources
    participant Val as GenLayer Validators

    User->>PC: register_promise(project, url, date, announcement_url)
    Note over PC: Status = PENDING
    User->>PC: verify_tge(promise_id, evidence_url)
    PC->>Web: HTTP GET + browser render (announcement)
    PC->>Web: HTTP GET + browser render (evidence)
    Web-->>PC: Readable text (bounded to 8k chars)
    PC->>Val: LLM classification + verbatim quote
    Val-->>PC: Consensus on status + quote presence
    Note over PC: Status stored; quote hashed
```

## Why GenLayer

Reading a date is deterministic. Deciding whether a page actually confirms a TGE is not. The judgment is an interpretation of two documents: what was promised, and what happened. Validators independently fetch both sources, run the same narrow prompt, and must agree on the status. The leader must also return a verbatim quote, and every validator checks that quote against its own fetched copy. A leader cannot invent a verdict or quote its way past the committee.

## Evidence rules

- Prefer immutable sources: archive.org raw snapshots (`https://web.archive.org/web/<14-digit-ts>id_/<url>`), Wikipedia permanent revisions, GitHub raw content pinned to a commit SHA, or exact-version package pages.
- Avoid live pages that change between fetches. If a page changes, validators can see different bytes and consensus may fail.
- Both the announcement and the evidence must return HTTP 200 and enough readable text. `verify_tge` returns `FETCH_FAILED` with the reason when a source is unreachable.
- The quote must be 20-300 characters and appear verbatim in the submitted evidence.

## Local tests

```bash
python -m unittest discover -s tests -v
```

The suite mocks the GenLayer runtime and covers:

- `TGE_DELAYED` with a valid quote
- `TGE_COMPLETED` with a valid quote
- `FETCH_FAILED` on a 404 source
- a model verdict whose quote is not in the evidence is downgraded to `INSUFFICIENT_EVIDENCE`
- registration and ID validation

Direct-mode tests prove contract logic only. They do not prove live consensus.

## Deploy

```bash
npm install
set GENLAYER_PK_FILE=C:\path\to\deployer_pk.json
npm run deploy
```

The deploy script writes `deploy/deployment.json`.

## Verify proof

```bash
npm run verify
```

This is read-only. It reads `deploy/proof.json`, connects to StudioNet, and re-reads every promise and status from chain.

## Check URLs before submitting

```bash
npm run check-urls -- <announcement_url> <evidence_url>
```

A dead source is the most common cause of `FETCH_FAILED`. Check both URLs first.

## Live proof

Fill in after deployment. Until then, this section is intentionally empty.

| Step | Method | Tx | Result |
|---|---|---|---|
| 1 | deploy | pending | pending |
| 2 | register_promise | pending | pending |
| 3 | verify_tge (delayed) | pending | pending |
| 4 | verify_tge (completed) | pending | pending |
| 5 | verify_tge (dead source) | pending | pending |

## Limitations

- The contract trusts the two URLs it is given. It does not discover sources on its own.
- Live pages can change. Use archived or pinned sources for reproducible demos.
- The LLM can still be wrong. The quote check proves grounding, not truth. `INSUFFICIENT_EVIDENCE` is the honest fallback.
- Each `verify_tge` performs up to four network fetches (two sources x request + render). Space calls out to stay under StudioNet rate limits.
- No funds are escrowed yet. This version records verdicts; a payout module is a separate step.

## Portal submission fields

- **Contribution type**: Project / deployed contract
- **One-liner**: On-chain TGE promise verification with quote-grounded GenLayer consensus.
- **Description**: PromiseCheck registers a project's announced TGE date and public announcement, then lets anyone submit public evidence. GenLayer validators independently fetch the announcement and the evidence, classify the outcome as `TGE_COMPLETED`, `TGE_DELAYED`, `TGE_NOT_COMPLETED`, or `INSUFFICIENT_EVIDENCE`, and must agree. The leader must return a verbatim quote, and every validator checks that quote against its own fetched copy. Unreachable sources return `FETCH_FAILED` with the reason. Verdicts and quotes are stored on-chain for audit.
- **How to review**: Open the explorer link, read `get_promise(1)`, then follow the evidence URL and compare the stored quote. Run `npm run verify` to re-read state.
- **Expected outcome**: A finalized verdict with a stored quote, or a clear `FETCH_FAILED` reason when a source is dead.
- **Explorer**: pending deployment
