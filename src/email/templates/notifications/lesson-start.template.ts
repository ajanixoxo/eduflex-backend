import { EmailParams } from 'src/email/types';
import { EMAIL_FOOTER, EMAIL_HEAD, EMAIL_REGARDS } from '../components';
import { EMAIL_BRAND } from '../components/brand';
import { SUPPORT_EMAIL } from 'src/email/constants';

export const LessonStartTemplate = ({ user, params }: EmailParams) => {
  const { courseTitle, courseUrl, unsubscribeUrl } = params;

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

            <mj-text font-size="24px" line-height="1.6" color="#0AEFC9" font-family="Poppins, Arial" font-weight="700" align="center">
              It's time for your lesson!
            </mj-text>

            <mj-text font-size="16px" line-height="1.6" color="#333333" font-family="Poppins, Arial" font-weight="300">
              Your scheduled lesson in <strong>${courseTitle}</strong> is starting now. Your AI tutor is ready and waiting for you!
            </mj-text>

            <mj-text font-size="16px" line-height="1.6" color="#333333" font-family="Poppins, Arial" font-weight="300">
              Continue your learning journey and make progress towards your goals today.
            </mj-text>

            <mj-button background-color="#0AEFC9" color="#1A1B1E" font-family="Poppins, Arial" font-size="16px" font-weight="600" border-radius="8px" href="${courseUrl}">
              Start Learning Now
            </mj-button>

            <mj-text font-size="14px" line-height="1.6" color="#666666" font-family="Poppins, Arial" font-weight="300">
              Consistency is key to mastering any subject. Every lesson you complete brings you closer to your learning goals!
            </mj-text>

            <mj-text font-size="14px" line-height="1.6" color="#666666" font-family="Poppins, Arial" font-weight="300">
              If you have any questions or require assistance, please contact our support team at <a href="mailto:${SUPPORT_EMAIL}" style="color:#6346FA">${SUPPORT_EMAIL}</a>.
            </mj-text>

            ${EMAIL_REGARDS}

            <mj-divider border-color="#E5E5E5" border-width="1px" />

            <mj-text font-size="12px" line-height="1.6" color="#999999" font-family="Poppins, Arial" font-weight="300" align="center">
              Don't want to receive lesson notifications? <a href="${unsubscribeUrl}" style="color:#6346FA">Update your notification preferences</a>
            </mj-text>
          </mj-column>
        </mj-section>
        ${EMAIL_FOOTER}
      </mj-body>
    </mjml>
    `;
};
