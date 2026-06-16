const categoryRejectionTemplate = (firstName) => {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f7f6; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background-color: #f8ebe6; padding: 24px; text-align: center;">
          <h1 style="color: #18181b; margin: 0; font-size: 20px; letter-spacing: 0.5px;">Service Category Rejected</h1>
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px; color: #18181b; line-height: 1.6; font-size: 15px;">
          <p>Dear <strong>${firstName}</strong>,</p>
          <p>We regret to inform you that your request to join the category has been <strong>rejected</strong> during verification by the assigned administrator.</p>
          <p>If you have other approved categories, you can continue to service them. Otherwise, your account status is set to inactive.</p>
          
          <div style="margin-top: 40px; border-top: 1px solid #f0f0f0; padding-top: 20px;">
            <p style="margin: 0; font-size: 12px; color: #888888; font-style: italic;">Note : This is a system generated message. Do not reply.</p>
          </div>
          
          <div style="margin-top: 20px;">
            <p style="margin: 0; font-size: 14px;">Best Regards,</p>
            <p style="margin: 4px 0 0; font-size: 14px; font-weight: bold;">Team SevaSetu</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #ffffff; padding: 0 24px 24px; text-align: center;">
          <h2 style="color: #18181b; margin: 0 0 8px; font-size: 18px; letter-spacing: 1px;">SevaSetu</h2>
          <p style="margin: 0; font-size: 12px; color: #52525b;">© ${new Date().getFullYear()} SevaSetu. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
};

module.exports = categoryRejectionTemplate;
