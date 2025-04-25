'use client';

export default function DocsPage() {
  return (
    <section className="max-w-4xl mx-auto prose prose-invert prose-headings:text-white prose-p:text-gray-300 pt-8">
      <h1>ARXIO Documentation</h1>
      <p>
        Welcome to the official ARXIO docs. This guide will help you integrate
        secure code scanning into your workflow in minutes.
      </p>

      <h2 id="getting-started">Getting&nbsp;Started</h2>
      <p>
        1. Sign up or log in, then create your first project from the dashboard.
        <br />
        2. Point ARXIO to your Git repository (GitHub / GitLab / Bitbucket) or
        upload a local path.
        <br />
        3. Kick-off a <strong>SAST</strong> or <strong>DAST</strong> scan and
        watch the findings roll in.
      </p>

      <h2 id="api-routes">API&nbsp;Routes</h2>
      <pre>
        <code className="language-bash">{`GET /api/projects    – list projects
POST /api/projects   – create project
POST /api/projects/:id/scan – start scan
GET /api/scans/:id   – scan status`}</code>
      </pre>

      <h2 id="webhooks">Webhooks</h2>
      <p>
        Receive real-time JSON payloads on scan completion or when critical
        vulnerabilities are found.
      </p>
      <pre>
        <code className="language-json">{`{
  "event": "scan.completed",
  "projectId": "123",
  "status": "SUCCESS",
  "findings": 42
}`}</code>
      </pre>

      <h2 id="cli">CLI&nbsp;Usage</h2>
      <pre>
        <code className="language-bash">{`npm i -g arxio-cli
arxio scan --project 123 --type SAST`}</code>
      </pre>

      <p>
        Need more? Check our community forum or open an issue on GitHub.
      </p>
    </section>
  );
} 