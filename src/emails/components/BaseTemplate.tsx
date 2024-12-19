import { EmailLogo } from './Logo';

interface BaseTemplateProps {
  children: React.ReactNode;
  previewText?: string;
}

export function BaseTemplate({ children, previewText = '' }: BaseTemplateProps) {
  return (
    <html>
      <head>
        <title>Pathly Email</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        {previewText && (
          <meta
            name="description"
            content={previewText}
          />
        )}
        <style>
          {`
            :root {
              color-scheme: light dark;
              supported-color-schemes: light dark;
            }

            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 0;
              width: 100% !important;
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }

            .email-container {
              max-width: 600px !important;
              margin: 0 auto !important;
              padding: 20px;
            }

            .content {
              background: #FFFFFF;
              border-radius: 8px;
              padding: 40px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }

            @media (prefers-color-scheme: dark) {
              .content {
                background: #1F2937;
                color: #F9FAFB;
              }
            }

            img {
              max-width: 100%;
              height: auto;
            }

            .logo {
              margin-bottom: 32px;
            }

            @media only screen and (max-width: 480px) {
              .email-container {
                padding: 10px !important;
              }

              .content {
                padding: 20px !important;
              }
            }
          `}
        </style>
      </head>
      <body>
        <div className="email-container">
          <div className="content">
            <div className="logo">
              <EmailLogo />
            </div>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
