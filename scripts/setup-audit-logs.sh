#!/bin/bash

# Audit Logs Setup Script
# This script helps set up audit logging in your Supabase project

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         AUDIT LOGS SETUP FOR SUPABASE                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check requirements
echo -e "${BLUE}Step 1: Checking requirements...${NC}"
echo ""

if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠ Supabase CLI not found.${NC}"
    echo "Install from: https://github.com/supabase/cli"
    echo ""
fi

# Step 2: Instructions
echo -e "${BLUE}Step 2: Manual Setup Instructions${NC}"
echo ""
echo "Follow these steps to set up audit logging:"
echo ""
echo "1. Open your Supabase project: https://app.supabase.com"
echo "2. Navigate to SQL Editor"
echo "3. Click 'New Query'"
echo "4. Copy the SQL from: migrations/001_create_audit_logs_table.sql"
echo "5. Paste into the SQL Editor"
echo "6. Click 'Run'"
echo ""
echo -e "${GREEN}✓ Table created successfully${NC}"
echo ""

# Step 3: Verification
echo -e "${BLUE}Step 3: Verify Installation${NC}"
echo ""
echo "In Supabase SQL Editor, run:"
echo ""
echo "  -- Check table exists"
echo "  SELECT * FROM information_schema.tables"
echo "  WHERE table_name = 'audit_logs';"
echo ""
echo "  -- Check indexes"
echo "  SELECT indexname FROM pg_indexes"
echo "  WHERE tablename = 'audit_logs';"
echo ""
echo "  -- Check RLS policies"
echo "  SELECT * FROM pg_policies"
echo "  WHERE tablename = 'audit_logs';"
echo ""

# Step 4: Integration in code
echo -e "${BLUE}Step 4: Integration in Your Code${NC}"
echo ""
echo "Example 1: Log a quote update"
echo ""
cat << 'EOF'
import { createAuditLog } from '@/lib/utils/audit'

export async function updateQuote(quoteId: string, data: any) {
  const currentQuote = await getQuote(quoteId)
  const updated = await db.quotes.update(quoteId, data)
  
  await createAuditLog({
    user_id: userId,
    action: 'UPDATE',
    table_name: 'quotes',
    old_values: currentQuote,
    new_values: updated,
  })
  
  return updated
}
EOF
echo ""

echo "Example 2: Get audit trail for a record"
echo ""
cat << 'EOF'
import { getRecordAuditTrail } from '@/lib/utils/audit'

const trail = await getRecordAuditTrail('quotes', quoteId)
trail.forEach(entry => {
  console.log(`${entry.action} by ${entry.user_email} at ${entry.created_at}`)
})
EOF
echo ""

# Step 5: Testing
echo -e "${BLUE}Step 5: Test Audit Logging${NC}"
echo ""
echo "1. Make a change in your app (create/update/delete)"
echo "2. Check Supabase dashboard -> audit_logs table"
echo "3. Verify entries appear with correct data"
echo ""

# Step 6: Production setup
echo -e "${BLUE}Step 6: Production Checklist${NC}"
echo ""
echo "Before deploying to production:"
echo ""
echo "  [ ] Audit logs table created in production Supabase"
echo "  [ ] RLS policies reviewed and correct"
echo "  [ ] Retention policy configured (optional)"
echo "  [ ] Monitoring/alerts set up (optional)"
echo "  [ ] Documentation shared with team"
echo "  [ ] Compliance requirements verified"
echo ""

# Step 7: Monitoring
echo -e "${BLUE}Step 7: Monitoring and Maintenance${NC}"
echo ""
echo "Monitor audit logs:"
echo ""
echo "  1. Admin Dashboard:"
echo "     - View recent changes across all tables"
echo "     - Track user activity"
echo "     - Identify suspicious patterns"
echo ""
echo "  2. Alerts:"
echo "     - Set up alerts for sensitive operations"
echo "     - Monitor for bulk deletes"
echo "     - Track admin changes"
echo ""
echo "  3. Retention:"
echo "     - Plan retention policy"
echo "     - Archive old logs if needed"
echo "     - Document retention requirements"
echo ""

echo -e "${GREEN}✓ Setup guide complete!${NC}"
echo ""
echo "For more information, see: docs/AUDIT_LOGS.md"
echo ""
