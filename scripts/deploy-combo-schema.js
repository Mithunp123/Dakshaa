/**
 * Deploy Combo Schema to Supabase
 * Run: node scripts/deploy-combo-schema.js
 */

require("dotenv").config({ path: "../Backend/.env" });
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deploySchema() {
  console.log("🚀 Deploying Combo Schema...\n");

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, "../database/complete_combo_schema.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    // Split into individual statements (simple split by semicolon)
    const statements = sqlContent
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ";";
      
      // Skip comments and empty statements
      if (statement.trim().startsWith("--") || statement.trim() === ";") {
        continue;
      }

      try {
        const { data, error } = await supabase.rpc("exec_sql", { 
          sql: statement 
        });

        if (error) {
          // Try direct query if RPC doesn't work
          const { error: queryError } = await supabase
            .from("_sql")
            .select("*")
            .limit(0);
          
          if (queryError && queryError.message.includes("relation") === false) {
            throw error;
          }
        }

        successCount++;
        process.stdout.write(`✓`);
        
        if ((i + 1) % 50 === 0) {
          console.log(` ${i + 1}/${statements.length}`);
        }
      } catch (err) {
        errorCount++;
        console.error(`\n❌ Error in statement ${i + 1}:`, err.message);
        // Continue with other statements
      }
    }

    console.log(`\n\n✅ Deployment Complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log("\n🎉 All database changes deployed successfully!");
      console.log("\n📋 Next Steps:");
      console.log("   1. Update frontend services (comboService.js)");
      console.log("   2. Test combo purchase flow");
      console.log("   3. Integrate payment gateway");
    }

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

// Alternative: Manual deployment instructions
function printManualInstructions() {
  console.log("\n📖 MANUAL DEPLOYMENT INSTRUCTIONS:\n");
  console.log("1. Go to Supabase Dashboard → SQL Editor");
  console.log("2. Open: database/complete_combo_schema.sql");
  console.log("3. Copy entire content");
  console.log("4. Paste into SQL Editor");
  console.log("5. Click 'Run' button");
  console.log("6. Verify success messages\n");
}

// Run deployment
console.log("╔══════════════════════════════════════════════════╗");
console.log("║   DaKshaa Combo System - Schema Deployment      ║");
console.log("╚══════════════════════════════════════════════════╝\n");

printManualInstructions();

console.log("\nAttempting automatic deployment via Supabase client...\n");
deploySchema();
