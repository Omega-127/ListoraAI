name: Bug Report
description: Report a bug or unexpected behavior
labels: ["bug", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report!

  - type: input
    id: service
    attributes:
      label: Affected service
      description: Which part of the system is affected?
      placeholder: "e.g. API, Frontend, Mock Platforms, Agent"
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: Bug description
      description: A clear and concise description of what the bug is.
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
      description: Steps to reproduce the behavior.
      placeholder: |
        1. Go to '...'
        2. Click on '...'
        3. See error
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
      description: What did you expect to happen?
    validations:
      required: true

  - type: textarea
    id: logs
    attributes:
      label: Relevant logs or error messages
      description: Paste any relevant logs. These will be automatically formatted as code.
      render: shell

  - type: input
    id: node-version
    attributes:
      label: Node.js version
      placeholder: "e.g. 20.11.0"
