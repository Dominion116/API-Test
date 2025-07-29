const SmileIDLinkGenerator = require("./SmileIDLinkGenerator");
const config = require("./config");

async function runExample() {
  try {
    // Check if required environment variables are set
    if (!config.apiKey || config.apiKey === 'your-actual-api-key-here') {
      console.log('❌ Please set SMILE_API_KEY in your .env file');
      return;
    }

    if (!config.webhookUrl) {
      console.log('❌ Please set WEBHOOK_URL in your .env file');
      return;
    }

    // Initialize the generator
    const linkGenerator = new SmileIDLinkGenerator(
      config.partnerId,
      config.apiKey,
      config.environment
    );

    // Create a single personal link using config values
    const singleLinkConfig = {
      name: "Test User KYC Verification",
      companyName: config.companyName,
      userId: "user_" + Date.now(),
      callbackUrl: config.webhookUrl,
      privacyPolicyUrl: config.privacyPolicyUrl,
      logoUrl: config.logoUrl,
      idTypes: [
        {
          country: config.defaultCountry,
          id_type: config.defaultIdType,
          verification_method: config.defaultVerificationMethod,
        },
        {
          country: config.defaultCountry,
          id_type: "VOTER_ID",
          verification_method: config.defaultVerificationMethod,
        },
      ],
      expiresAt: config.getExpiryDate()
    };

    console.log("🚀 Creating personal link...");
    console.log("📊 Configuration:");
    console.log("  - Environment:", config.environment);
    console.log("  - Company:", config.companyName);
    console.log("  - Webhook:", config.webhookUrl);
    console.log("  - ID Types:", singleLinkConfig.idTypes.map(id => id.id_type).join(", "));
    console.log("");

    const result = await linkGenerator.createSingleUseLink(singleLinkConfig);

    if (result.success) {
      console.log("✅ Success!");
      console.log("🔗 Personal Link:", result.personalLink);
      console.log("🆔 Link ID:", result.linkId);
      console.log("👤 User ID:", result.userId);
      console.log("⏰ Expires At:", result.expiresAt);
      console.log("");
      console.log("📱 Share this link with the user to start verification");
      console.log("📡 Results will be sent to your webhook when complete");
    } else {
      console.log("❌ Error:", result.error);
    }
  } catch (error) {
    console.error("💥 Script error:", error);
  }
}

runExample();