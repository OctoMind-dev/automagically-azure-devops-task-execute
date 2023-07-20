# automagically-azure-devops-execute

This is a Azure DevOps Task to execute your automagically-maintained e2e tests.
To use this task a token is required. Don't have one? We're here to help.

> drop us a note: contact@octomind.dev 🐙

## Setup

1. Add the `AUTOMAGICALLY_TOKEN` to your repository secrets
2. Add the following yml snippet to your pipeline and insert a value for `url` pointing to a publicly accessible
   deployment of your branch.

```yml
- task: automagicallyexecute@2
  inputs:
    url: https://public.url
    token: ${{ secrets.AUTOMAGICALLY_TOKEN }}
    testTargetId: <your testTargetId that you also get from us>
```
