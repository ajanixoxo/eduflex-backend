import {
  EMAIL_FOOTER_TEXT,
  FB_LOGO,
  FB_URL,
  IG_LOGO,
  IG_URL,
  TG_LOGO,
  TG_URL,
  X_LOGO,
  X_URL,
} from '../../constants';

export const EMAIL_FOOTER = `
    <mj-section></mj-section>
   <mj-section background-color="#ffffff" background-url="https://res.cloudinary.com/ddleprhkr/image/upload/v1739442124/Background_jz8qaj.png" background-size="cover" background-position="center center" background-repeat="no-repeat" border-radius="16px">
     <mj-column width="100%">
       <mj-image width="60px" src="https://res.cloudinary.com/og-assets/image/upload/v1761879958/eduflexai/logo.png" align="center" />
       <mj-text font-size="16px" line-height="1.6" color="#6346FA" font-family="Poppins, Arial" font-weight="300" align="center">
       Learn Anything. Smarter, Faster.
       </mj-text>
     </mj-column>

     <mj-column width="100%">
       <mj-social font-size="15px" icon-size="25px" mode="horizontal" align="center">
         <mj-social-element src="${FB_LOGO}" href="${FB_URL}">
         </mj-social-element>
         <mj-social-element src="${IG_LOGO}" href="${IG_URL}">
         </mj-social-element>
         <mj-social-element src="${X_LOGO}" href="${X_URL}">

         </mj-social-element>
         <mj-social-element src="${TG_LOGO}" href="${TG_URL}">

         </mj-social-element>
       </mj-social>
     </mj-column>
     <mj-column width="100%">
       <mj-text font-size="12px" line-height="1.6" color="#ccc" font-family="Poppins, Arial" font-weight="300" align="center">
         ${EMAIL_FOOTER_TEXT}
       </mj-text>
     </mj-column>

   </mj-section>
   <mj-section></mj-section>

`;
