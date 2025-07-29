require('dotenv').config();

module.exports = {
  // SmileID API Configuration
  partnerId: process.env.SMILE_PARTNER_ID,
  apiKey: process.env.SMILE_API_KEY,
  environment: process.env.SMILE_ENVIRONMENT || 'sandbox',
  
  // Webhook Configuration
  webhookPort: process.env.WEBHOOK_PORT || 3000,
  webhookUrl: process.env.WEBHOOK_URL,
  
  // Company Information
  companyName: process.env.COMPANY_NAME || 'Afrimobile Technologies Limited',
  logoUrl: process.env.COMPANY_LOGO_URL,
  privacyPolicyUrl: process.env.PRIVACY_POLICY_URL,
  
  // Default ID Configuration
  defaultCountry: process.env.DEFAULT_COUNTRY || 'NG',
  defaultIdType: process.env.DEFAULT_ID_TYPE || 'IDENTITY_CARD',
  defaultVerificationMethod: process.env.DEFAULT_VERIFICATION_METHOD || 'doc_verification',
  
  // Link Settings
  linkExpiryHours: parseInt(process.env.LINK_EXPIRY_HOURS) || 24,
  
  // Helper function to get default ID types
  getDefaultIdTypes() {
    return [
      {
        country: this.defaultCountry,
        id_type: this.defaultIdType,
        verification_method: this.defaultVerificationMethod
      }
    ];
  },
  
  // Helper function to get expiry date
  getExpiryDate() {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + this.linkExpiryHours);
    return expiry.toISOString();
  }
};