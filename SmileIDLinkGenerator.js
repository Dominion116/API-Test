const crypto = require("crypto");

class SmileIDLinkGenerator {
  constructor(partnerId, apiKey, environment = "sandbox") {
    this.partnerId = partnerId;
    this.apiKey = apiKey;
    this.baseUrl =
      environment === "production"
        ? "https://api.smileidentity.com/v1/smile_links"
        : "https://testapi.smileidentity.com/v1/smile_links";
    this.linkBaseUrl =
      environment === "production"
        ? "https://links.usesmileid.com"
        : "https://links.sandbox.usesmileid.com";
  }

  // Generate HMAC signature for authentication
  generateSignature(timestamp) {
    const hmac = crypto.createHmac("sha256", this.apiKey);
    hmac.update(timestamp);
    hmac.update(this.partnerId);
    hmac.update("sid_request");
    return hmac.digest("base64");
  }

  // Create a single-use link for individual users
  async createSingleUseLink(config) {
    const timestamp = new Date().toISOString();
    const signature = this.generateSignature(timestamp);

    const requestBody = {
      partner_id: this.partnerId,
      signature: signature,
      timestamp: timestamp,
      name: config.name || `Personal Link - ${new Date().toLocaleDateString()}`,
      company_name: config.companyName || "Afrimobile",
      id_types: config.idTypes || [
        {
          country: "NG",
          id_type: "IDENTITY_CARD",
          verification_method: "doc_verification",
        },
      ],
      callback_url: config.callbackUrl,
      data_privacy_policy_url: config.privacyPolicyUrl,
      logo_url: config.logoUrl,
      is_single_use: true,
      user_id: config.userId || this.generateUserId(),
      partner_params: config.partnerParams || {},
      expires_at: config.expiresAt || this.getDefaultExpiry(),
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        // Try different possible field names for the link ID
        const linkId =
          result.ref_id || result.linkId || result.id || result.smile_link_id;

        // If no link ID found, log the response to see what fields are available
        if (!linkId) {
          console.log("Available response fields:", Object.keys(result));
          console.log("Full response:", result);
        }

        // Construct the personal link URL
        const personalLink = `${this.linkBaseUrl}/${this.partnerId}/${linkId}`;

        return {
          success: true,
          linkId: linkId,
          personalLink: personalLink,
          userId: requestBody.user_id,
          expiresAt: requestBody.expires_at,
          fullResponse: result,
        };
      } else {
        console.log("❌ API Error Response:", JSON.stringify(result, null, 2));
        console.log("❌ Response Status:", response.status);
        throw new Error(
          `API Error: ${
            result.message || result.error || result.code || "Unknown error"
          }`
        );
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Create multiple personal links for different users
  async createMultiplePersonalLinks(users) {
    const results = [];

    for (const user of users) {
      const linkConfig = {
        name: `Personal Link - ${user.name || user.userId}`,
        userId: user.userId,
        companyName: user.companyName,
        callbackUrl: user.callbackUrl,
        idTypes: user.idTypes,
        partnerParams: {
          user_name: user.name,
          user_email: user.email,
          ...user.customParams,
        },
      };

      const result = await this.createSingleUseLink(linkConfig);
      results.push({
        userId: user.userId,
        userName: user.name,
        ...result,
      });

      // Add delay to avoid rate limiting
      await this.delay(100);
    }

    return results;
  }

  // Generate unique user ID
  generateUserId() {
    return "user_" + crypto.randomUUID();
  }

  // Get default expiry (24 hours from now)
  getDefaultExpiry() {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    return expiry.toISOString();
  }

  // Helper method for delays
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Update an existing link
  async updateLink(linkId, updates) {
    const timestamp = new Date().toISOString();
    const signature = this.generateSignature(timestamp);

    const requestBody = {
      partner_id: this.partnerId,
      signature: signature,
      timestamp: timestamp,
      ...updates,
    };

    try {
      const response = await fetch(`${this.baseUrl}/${linkId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      return response.ok ? result : { error: result.message };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get link status and usage statistics
  async getLinkInfo(linkId) {
    const timestamp = new Date().toISOString();
    const signature = this.generateSignature(timestamp);

    const params = new URLSearchParams({
      partner_id: this.partnerId,
      signature: signature,
      timestamp: timestamp,
    });

    try {
      const response = await fetch(`${this.baseUrl}/${linkId}?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      return response.ok ? result : { error: result.message };
    } catch (error) {
      return { error: error.message };
    }
  }
}

// Example usage
async function generatePersonalLinks() {
  // Initialize the generator
  const linkGenerator = new SmileIDLinkGenerator(
    "7790", // Your partner ID
    "your-api-key-here", // Your API key
    "sandbox" // or 'production'
  );

  // Example 1: Create a single personal link
  const singleLinkConfig = {
    name: "John Doe KYC Verification",
    companyName: "Your Company Name",
    userId: "john_doe_001",
    callbackUrl: "https://fd5bbbfc7e15.ngrok-free.app/webhook",
    privacyPolicyUrl: "https://your-domain.com/privacy",
    logoUrl: "https://your-domain.com/logo.png",
    idTypes: [
      {
        country: "NG",
        id_type: "BVN",
        verification_method: "biometric_kyc",
      },
      {
        country: "NG",
        id_type: "IDENTITY_CARD",
        verification_method: "biometric_kyc",
      },
      {
        country: "NG",
        id_type: "VOTERS_ID",
        verification_method: "doc_verification",
      },
      {
        country: "NG",
        id_type: "DRIVERS_LICENSE",
        verification_method: "doc_verification",
      },
    ],
    partnerParams: {
      customer_tier: "premium",
      onboarding_channel: "web",
    },
  };

  const singleLink = await linkGenerator.createSingleUseLink(singleLinkConfig);
  console.log("Single Personal Link:", singleLink);

  // Example 2: Create multiple personal links
  const users = [
    {
      userId: "user_001",
      name: "Alice Johnson",
      email: "alice@example.com",
      idTypes: [
        {
          country: "NG",
          id_type: "IDENTITY_CARD",
          verification_method: "doc_verification",
        },
      ],
    },
    {
      userId: "user_002",
      name: "Bob Smith",
      email: "bob@example.com",
      idTypes: [
        {
          country: "NG",
          id_type: "VOTER_ID",
          verification_method: "doc_verification",
        },
      ],
    },
  ];

  const multipleLinks = await linkGenerator.createMultiplePersonalLinks(users);
  console.log("Multiple Personal Links:", multipleLinks);

  // Example 3: Get link information
  if (singleLink.success) {
    const linkInfo = await linkGenerator.getLinkInfo(singleLink.linkId);
    console.log("Link Information:", linkInfo);
  }
}

// Run the example
// generatePersonalLinks().catch(console.error);

module.exports = SmileIDLinkGenerator;
