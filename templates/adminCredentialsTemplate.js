// template receives firstName, email, password, employeeId, categoryName
const adminCredentialsTemplate = (firstName, email, password, employeeId, categoryName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      
      <!-- Header -->
      <div style="background-color: #2563eb; padding: 30px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">SevaSetu</h1>
        <p style="color: #bfdbfe; margin: 6px 0 0; font-size: 14px;">Admin Management Platform</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px 24px; background-color: #ffffff;">
        
        <p style="font-size: 16px; color: #111827; margin-top: 0;">Hello <strong>${firstName}</strong>,</p>

        <p style="font-size: 14px; color: #374151; line-height: 1.6;">
          Your Admin account has been created on <strong>SevaSetu</strong> by the Super Admin.
          You have been assigned to manage the <strong>${categoryName || "your assigned"}</strong> category.
        </p>

        <!-- Credentials Box -->
        <div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; border-radius: 6px; padding: 20px 24px; margin: 24px 0;">
          <p style="margin: 0 0 12px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Credentials</p>

          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #6b7280; width: 130px;">Employee ID</td>
              <td style="padding: 6px 0; font-size: 14px; color: #111827;"><strong>${employeeId || "N/A"}</strong></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Email</td>
              <td style="padding: 6px 0; font-size: 14px; color: #111827;"><strong>${email}</strong></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Password</td>
              <td style="padding: 6px 0; font-size: 14px; color: #111827; font-family: monospace; letter-spacing: 1px;"><strong>${password}</strong></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Assigned Category</td>
              <td style="padding: 6px 0; font-size: 14px; color: #111827;"><strong>${categoryName || "N/A"}</strong></td>
            </tr>
          </table>
        </div>

        <!-- Warning -->
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; color: #92400e;">
            ⚠️ <strong>Important:</strong> Please log in and change your password immediately. Do not share these credentials with anyone.
          </p>
        </div>

        <p style="font-size: 14px; color: #374151; line-height: 1.6;">
          As an admin, you are responsible for reviewing and approving provider applications, 
          managing bookings, and handling operations within your assigned category.
        </p>

        <p style="font-size: 14px; color: #374151; margin-bottom: 0;">
          If you have any questions, please contact the Super Admin team.
        </p>

      </div>

      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is an automated email from SevaSetu. Please do not reply to this email.</p>
        <p style="margin: 6px 0 0; font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} SevaSetu. All rights reserved.</p>
      </div>

    </div>
  `;
};

module.exports = adminCredentialsTemplate;
