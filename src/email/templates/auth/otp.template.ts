import { EmailParams } from 'src/email/types';
import { EMAIL_FOOTER, EMAIL_HEAD, EMAIL_REGARDS } from '../components';
import { EMAIL_BRAND } from '../components/brand';
import { SUPPORT_EMAIL } from 'src/email/constants';

export const OtpTemplate = ({ user, params }: EmailParams) => {
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
              Please enter the 6-digit code in the designated field on our platform to complete the verification process. This step is crucial to protect your account and ensure that only you can access it.
            </mj-text>
            <mj-text font-size="26px" line-height="1.6" color="#333333" font-family="Poppins, Arial" font-weight="700" align="center">
              <span style="display:inline-block; padding:8px; background:#EEE7F7;"> ${params.code} </span>
            </mj-text>
            <mj-text font-size="16px" line-height="1.6" color="#333333" font-family="Poppins, Arial" font-weight="300">
              This verification code is only valid for 15 minutes and you would need to request another one once expired.
            </mj-text>

            <mj-text font-size="16px" line-height="1.6" color="#333333" font-family="Poppins, Arial" font-weight="300">
              If you have any questions or require further assistance, please do not hesitate to contact our support team at <a href="mailto:${SUPPORT_EMAIL}" style="color:#6346FA">${SUPPORT_EMAIL}</a>. We are here to help you.
            </mj-text>
            ${EMAIL_REGARDS}
          </mj-column>
        </mj-section>
        ${EMAIL_FOOTER}
      </mj-body>
    </mjml>
    `;
};
