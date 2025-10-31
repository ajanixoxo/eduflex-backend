import { EmailParams } from 'src/email/types';
import { EMAIL_FOOTER, EMAIL_HEAD, EMAIL_REGARDS } from '../components';
import { EMAIL_BRAND } from '../components/brand';
import { SUPPORT_EMAIL } from 'src/email/constants';

export const ForgotPasswordTemplate = ({ user, params }: EmailParams) => {
  return `
    <mjml>
    //   ${EMAIL_HEAD}
      <mj-body background-color="#f3f3f3">
        ${EMAIL_BRAND}
        <mj-section background-color="#ffffff" border-radius="16px">
          <mj-column>
            <mj-text font-size="16px" line-height="1.6" color="#333333" font-family="Poppins, Arial" font-weight="300" text-transform="capitalize">
              Hello ${user.firstname},
            </mj-text>

            <mj-text font-size="16px" line-height="1.6" color="#333333" font-family="Poppins, Arial" font-weight="300">
              We received a request to reset your password. Please use the 6-digit code below to proceed with your password reset.
            </mj-text>
            
            <mj-text font-size="26px" line-height="1.6" color="#333333" font-family="Poppins, Arial" font-weight="700" align="center">
              <span style="display:inline-block; padding:8px; background:#EEE7F7;"> ${params.code} </span>
            </mj-text>
            
            <mj-text font-size="16px" line-height="1.6" color="#333333" font-family="Poppins, Arial" font-weight="300">
              This code is only valid for 15 minutes. If you did not request a password reset, please ignore this email or contact our support team immediately.
            </mj-text>
            
            <mj-text font-size="16px" line-height="1.6" color="#333333" font-family="Poppins, Arial" font-weight="300">
              If you have any questions or need further assistance, please do not hesitate to reach out at <a href="mailto:${SUPPORT_EMAIL}" style="color:#6346FA">${SUPPORT_EMAIL}</a>.
            </mj-text>
            
            ${EMAIL_REGARDS}
          </mj-column>
        </mj-section>
        ${EMAIL_FOOTER}
      </mj-body>
    </mjml>
  `;
};
