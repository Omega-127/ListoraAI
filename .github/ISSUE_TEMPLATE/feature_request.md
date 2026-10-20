name: Feature Request
description: Suggest a new feature or enhancement
labels: ["enhancement"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for suggesting a feature!

  - type: textarea
    id: problem
    attributes:
      label: Problem to solve
      description: What problem does this feature solve? Why is it needed?
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed solution
      description: Describe the feature you'd like to see.
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives considered
      description: Any alternative solutions or workarounds you considered?

  - type: dropdown
    id: area
    attributes:
      label: Area
      description: Which part of the system does this affect?
      options:
        - API / Backend
        - Frontend / UI
        - AI Agent
        - Mock Platforms
        - Shared Package
        - E2E Tests
        - Documentation
        - DevOps / Deployment
    validations:
      required: true
