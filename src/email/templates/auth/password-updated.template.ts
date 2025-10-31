import { EmailParams } from 'src/email/types';
import { EMAIL_FOOTER, EMAIL_HEAD, EMAIL_REGARDS } from '../components';
import { EMAIL_BRAND } from '../components/brand';
import { SUPPORT_EMAIL } from 'src/email/constants';

export const PasswordResetConfirmationTemplate = ({ user }: EmailParams) => {
  return `
    <mjml>
      ${EMAIL_HEAD}
      <mj-body background-color="#f3f3f3">
        ${EMAIL_BRAND}
        <mj-section background-color="#ffffff" border-radius="16px">
          <mj-column>
            <mj-text 
              font-size="16px" 
              line-height="1.6" 
              color="#333333" 
              font-family="Poppins, Arial" 
              font-weight="300" 
              text-transform="capitalize">
              Hello ${user.firstname},
            </mj-text>

            <mj-text 
              font-size="16px" 
              line-height="1.6" 
              color="#333333" 
              font-family="Poppins, Arial" 
              font-weight="300">
              We’re writing to confirm that your password has been successfully reset.
            </mj-text>

            <mj-text 
              font-size="16px" 
              line-height="1.6" 
              color="#333333" 
              font-family="Poppins, Arial" 
              font-weight="300">
              You can now sign in to your account using your new password.
            </mj-text>

            <mj-text 
              font-size="16px" 
              line-height="1.6" 
              color="#333333" 
              font-family="Poppins, Arial" 
              font-weight="300">
              If you did not make this change or if you have any questions, please contact our support team immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color:#6346FA">${SUPPORT_EMAIL}</a>.
            </mj-text>
            
            ${EMAIL_REGARDS}
          </mj-column>
        </mj-section>
        ${EMAIL_FOOTER}
      </mj-body>
    </mjml>
  `;
};
