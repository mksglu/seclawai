#!/bin/bash
set -euo pipefail

WORKSPACE="/Users/mksglu/il5"
CONTAINER="seclaw-agent-1"
CHAT_ID="457815778"
LOG_DIR="/tmp/seclaw-template-tests-v2"
mkdir -p "$LOG_DIR"

TEMPLATES=(
  "sales-agent|Find recent leads on Twitter mentioning AI automation tools"
  "research-agent|Research the latest trends in AI agents"
  "reddit-hn-digest|What's trending on Hacker News today?"
  "youtube-creator|Scout trending topics in AI and pitch me 3 video ideas"
  "youtube-digest|What new videos were posted by my subscribed channels?"
  "earnings-tracker|What earnings reports are coming up this week?"
)

echo "========================================="
echo "  Re-testing 6 fixed templates (v2)"
echo "========================================="
echo ""

PASS=0
FAIL=0
HALLUCINATION=0

for entry in "${TEMPLATES[@]}"; do
  IFS='|' read -r TEMPLATE_ID TEST_MSG <<< "$entry"
  LOG_FILE="$LOG_DIR/${TEMPLATE_ID}.log"

  echo "--- Testing: $TEMPLATE_ID ---"

  # Activate template
  cat > "$WORKSPACE/config/installed.json" << EOF
{
  "version": 2,
  "base": "productivity-agent",
  "active": "$TEMPLATE_ID",
  "capabilities": ["productivity-agent", "$TEMPLATE_ID"]
}
EOF

  # Restart agent
  docker restart "$CONTAINER" > /dev/null 2>&1

  # Wait for health
  WAITED=0
  while [ $WAITED -lt 30 ]; do
    HEALTH=$(docker exec "$CONTAINER" wget -qO- http://localhost:3000/health 2>/dev/null || echo "")
    if echo "$HEALTH" | grep -q '"status":"ok"'; then break; fi
    sleep 2
    WAITED=$((WAITED + 2))
  done

  if [ $WAITED -ge 30 ]; then
    echo "  [FAIL] Agent unhealthy"
    FAIL=$((FAIL + 1))
    continue
  fi

  echo "  Agent healthy (${WAITED}s)"

  # Send test message
  TIMESTAMP=$(date +%s)
  PAYLOAD="{\"update_id\":${TIMESTAMP},\"message\":{\"message_id\":${TIMESTAMP},\"from\":{\"id\":${CHAT_ID},\"is_bot\":false,\"first_name\":\"TestRunner\"},\"chat\":{\"id\":${CHAT_ID},\"type\":\"private\"},\"date\":${TIMESTAMP},\"text\":\"${TEST_MSG}\"}}"

  docker exec "$CONTAINER" wget -qO- \
    --header="Content-Type: application/json" \
    --post-data="$PAYLOAD" \
    http://localhost:3000/webhook > /dev/null 2>&1 || true

  echo "  Sent: \"${TEST_MSG:0:60}\""

  # Wait for response
  sleep 5
  RESP_WAIT=0
  FOUND=false
  while [ $RESP_WAIT -lt 55 ]; do
    docker logs --since "${TIMESTAMP}" "$CONTAINER" > "$LOG_FILE" 2>&1
    if grep -q "\[llm\] Total:" "$LOG_FILE" 2>/dev/null; then
      FOUND=true
      break
    fi
    if grep -q "\[llm\] API error:" "$LOG_FILE" 2>/dev/null; then
      FOUND=true
      break
    fi
    sleep 5
    RESP_WAIT=$((RESP_WAIT + 5))
  done

  if [ "$FOUND" = true ]; then
    # Check for hallucination indicators
    HAS_EXECUTE=$(grep -c "\[llm\] Tool call: execute_command" "$LOG_FILE" 2>/dev/null || echo "0")
    HAS_INTEGRATION_MSG=$(grep -c "/integrations" "$LOG_FILE" 2>/dev/null || echo "0")
    TOOLS_USED=$(grep -o "\[llm\] Tool call: [^ ]*" "$LOG_FILE" 2>/dev/null | sed 's/\[llm\] Tool call: //' | sort -u | tr '\n' ',' | sed 's/,$//')
    TOTAL_TIME=$(grep -o "\[llm\] Total: [0-9]*ms" "$LOG_FILE" 2>/dev/null | head -1 | sed 's/\[llm\] Total: //')
    TELEGRAM_REPLY=$(grep "\[telegram\] Reply" "$LOG_FILE" 2>/dev/null | head -1 | sed 's/.*Reply ([0-9]* chars): //' | head -c 200)

    if [ "${HAS_EXECUTE:-0}" -gt 0 ]; then
      echo "  [HALLUCINATION] Used execute_command — still falling back to shell!"
      echo "  Tools: $TOOLS_USED"
      HALLUCINATION=$((HALLUCINATION + 1))
      FAIL=$((FAIL + 1))
    elif [ "${HAS_INTEGRATION_MSG:-0}" -gt 0 ]; then
      echo "  [PASS - GRACEFUL] Asked user to connect integration via /integrations"
      echo "  Time: ${TOTAL_TIME:-?} | Tools: ${TOOLS_USED:-none}"
      echo "  Reply: ${TELEGRAM_REPLY:0:150}"
      PASS=$((PASS + 1))
    else
      echo "  [PASS] Responded without shell fallback"
      echo "  Time: ${TOTAL_TIME:-?} | Tools: ${TOOLS_USED:-none}"
      echo "  Reply: ${TELEGRAM_REPLY:0:150}"
      PASS=$((PASS + 1))
    fi
  else
    echo "  [FAIL] No response within 60s"
    FAIL=$((FAIL + 1))
  fi

  echo ""
done

# Restore original
cat > "$WORKSPACE/config/installed.json" << 'EOF'
{
  "version": 2,
  "base": "productivity-agent",
  "active": "productivity-agent",
  "capabilities": ["productivity-agent"]
}
EOF
docker restart "$CONTAINER" > /dev/null 2>&1

echo "========================================="
echo "  Results: $PASS PASS / $FAIL FAIL / $HALLUCINATION HALLUCINATION"
echo "========================================="
echo "  Logs: $LOG_DIR/"
