# Commercialisation retired

On 2026-09-23, the project owner retired commercialisation, KPIs, revenue
requirements, new paid sign-ups, and checkout. Understanding is sufficient.
This replaces the former paid API and design-partner sales plan. Its earlier
versions remain in Git history, not as work waiting to be resumed.

The public checker, research material, and local exploration remain available.
Technical request limits protect shared resources; they must not become an
upsell or a requirement to buy access. Existing keys retain their recorded
configuration. Do not silently change existing entitlements or erase records.

The paid audit offer is retired. `/audit` now points to self-guided reading and
creates no service request, payment link, or delivery commitment. The historical
billing provider seam has no configured provider and creates no checkout.
Any future handling of an existing payment obligation must preserve verification,
refund/cancellation support, and records without reopening new sales.

The separate `fly-api/` service unconditionally disables new x402 scan purchases,
including under legacy enable flags. Its `/audit` page has no paid offer or intake.
No provider or chain receipt is erased; prior obligations remain separate.
