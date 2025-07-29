const SmileIDLinkGenerator = require("./SmileIDLinkGenerator");
const config = require("./config");

async function runExample() {
  try {
    // Check if required environment variables are set
    if (!config.apiKey || config.apiKey === "your-actual-api-key-here") {
      console.log("❌ Please set SMILE_API_KEY in your .env file");
      return;
    }

    if (!config.webhookUrl) {
      console.log("❌ Please set WEBHOOK_URL in your .env file");
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
          country: "NG",
          id_type: "BVN",
          verification_method: "enhanced_kyc",
        },
        {
        country: "NG",
        id_type: "IDENTITY_CARD",
        verification_method: "doc_verification",
      },
    //   {
    //     country: "NG",
    //     id_type: "VOTERS_ID",
    //     verification_method: "doc_verification",
    //   },
    //   {
    //     country: "NG",
    //     id_type: "DRIVERS_LICENSE",
    //     verification_method: "doc_verification",
    //   },
      ],
      expiresAt: config.getExpiryDate(),
    };

    console.log("🚀 Creating personal link...");
    console.log("📊 Configuration:");
    console.log("  - Environment:", config.environment);
    console.log("  - Company:", config.companyName);
    console.log("  - Webhook:", config.webhookUrl);
    console.log(
      "  - ID Types:",
      singleLinkConfig.idTypes.map((id) => id.id_type).join(", ")
    );
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
