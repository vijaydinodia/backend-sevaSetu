const adminCredentialsTemplate = (firstName, email, password) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;">
      
      <h2 style="color:#2563eb;">
        Welcome to SevaSetu
      </h2>

      <p>Hello ${firstName},</p>

      <p>
        Your Admin account has been created successfully.
      </p>

      <h3>Login Credentials</h3>

      <table style="border-collapse: collapse;">
        <tr>
          <td><strong>Email:</strong></td>
          <td>${email}</td>
        </tr>

        <tr>
          <td><strong>Password:</strong></td>
          <td>${password}</td>
        </tr>
      </table>

      <br />

      <p>
        Please login and change your password immediately.
      </p>

      <br />

      <p>Regards,</p>
      <p><strong>SevaSetu Team</strong></p>

    </div>
  `;
};

module.exports = adminCredentialsTemplate;
