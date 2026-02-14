#!/bin/bash
# seclaw dashboard — users, purchases, stars (excludes bm.ksglu@gmail.com)

DB="seclawaicom"
EXCLUDE="bm.ksglu@gmail.com"

echo ""
echo "=== seclaw Dashboard ==="
echo ""

# Stars
echo "--- GitHub Stars ---"
echo ""
STARGAZERS=$(gh api repos/mksglu/seclawai/stargazers --jq '.[].login' 2>/dev/null)
STAR_COUNT=$(echo "$STARGAZERS" | grep -c . 2>/dev/null || echo "0")
echo "  Total: $STAR_COUNT"
echo ""
if [ -n "$STARGAZERS" ]; then
  echo "  Username"
  echo "  -------------------------"
  echo "$STARGAZERS" | while read -r user; do
    echo "  $user"
  done
fi
echo ""

# Users (exclude self)
echo "--- Users (excluding $EXCLUDE) ---"
echo ""
USERS_JSON=$(npx wrangler d1 execute "$DB" --remote --json \
  --command "SELECT id, name, email, datetime(createdAt, 'unixepoch') as registered_at FROM user WHERE email != '$EXCLUDE' ORDER BY createdAt DESC;" 2>/dev/null)

echo "$USERS_JSON" | python3 -c "
import json,sys
data = json.loads(sys.stdin.read())
rows = data[0]['results']
if not rows:
    print('  No users yet.')
else:
    print(f'  Total: {len(rows)}')
    print()
    print(f'  {\"Name\":<25s} | {\"Email\":<35s} | Registered')
    print(f'  {\"-\"*25} | {\"-\"*35} | {\"-\"*19}')
    for r in rows:
        print(f'  {(r[\"name\"] or \"N/A\"):<25s} | {r[\"email\"]:<35s} | {r[\"registered_at\"]}')
"

echo ""

# Purchases (exclude self)
echo "--- Purchases (excluding $EXCLUDE) ---"
echo ""
PURCHASES_JSON=$(npx wrangler d1 execute "$DB" --remote --json \
  --command "SELECT t.email, p.template_id, p.stripe_payment_id, p.purchased_at FROM purchases p LEFT JOIN tokens t ON p.token_id = t.id WHERE t.email != '$EXCLUDE' OR t.email IS NULL ORDER BY p.purchased_at DESC;" 2>/dev/null)

echo "$PURCHASES_JSON" | python3 -c "
import json,sys
data = json.loads(sys.stdin.read())
rows = data[0]['results']
if not rows:
    print('  No purchases yet.')
else:
    print(f'  Total: {len(rows)}')
    print()
    print(f'  {\"Email\":<35s} | {\"Template\":<25s} | {\"Stripe\":<20s} | Purchased')
    print(f'  {\"-\"*35} | {\"-\"*25} | {\"-\"*20} | {\"-\"*19}')
    for r in rows:
        stripe = r['stripe_payment_id'] or 'N/A'
        if len(stripe) > 20: stripe = stripe[:17] + '...'
        print(f'  {(r[\"email\"] or \"N/A\"):<35s} | {r[\"template_id\"]:<25s} | {stripe:<20s} | {r[\"purchased_at\"]}')
"

echo ""
