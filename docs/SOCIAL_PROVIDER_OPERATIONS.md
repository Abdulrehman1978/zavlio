# Social provider operations runbook

## Packet 17 operational closure

The Bridge runs near the user-controlled browser while web/control-plane and PostgreSQL remain independently deployable. Hosted authentication and provider health are external release dependencies.

1. Establish an authenticated, user-controlled browser session manually. Never store passwords, cookies, localStorage, sessionStorage, or CDP credentials.
2. Confirm the provider origin and authentication state. LOGIN_REQUIRED, SECURITY_CHALLENGE, and UNKNOWN stop the operation and map to MANUAL_ACTION_REQUIRED.
3. Run bounded read-only observation first: known test profile, exact canonical path, conversation context, target proof, composer/action discovery, and security guard. Do not wander feeds or discover prospects.
4. Keep observation enabled separate from live execution. Provider status is per platform and must not be summarized as a global “Meta connected” flag.
5. To disable a provider, disable its server-side provider setting and revoke outstanding canary permits. To disable all live execution, set the server/global kill switch false and verify the commit recheck rejects future mutations.
6. For a canary, use only a user-controlled or organization-owned test identity, one manually initiated action, one expiring permit, and one human approval. Stop after the result and inspect evidence manually.
7. Investigate evidence using bounded target/action/provider/version/result fields. Do not upload private inbox screenshots or raw page HTML.

Packet 16 does not include authenticated real-site evidence or a live canary in this environment.
