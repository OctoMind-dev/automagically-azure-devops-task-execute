# automagically-azure-devops-execute

This is a Azure DevOps Task to execute your automagically-maintained e2e tests.
To use this task a token is required which you can generate in our [octomind app](https://app.octomind.dev).

See the [docs](https://octomind.dev/docs) for more details.

> drop us a note: <contact@octomind.dev> 🐙

## Setup

1. Add the `AUTOMAGICALLY_TOKEN` to your repository secrets
2. Add the following yml snippet to your pipeline and insert a value for `url` pointing to a publicly accessible
   deployment of your branch.

```yml
- task: automagicallyexecute@2
  inputs:
    url: <publicly accessible url to your deployment>
    token: ${{ secrets.AUTOMAGICALLY_TOKEN }}
    testTargetId: <your testTargetId that you also get from us>
    environmentName: <environment name that your test cases should run against. optional, 
                     will use the "default" environment otherwise.>
    blocking: <if your pipeline should block until all tests have passed, optional, defaults to false>
    variablesToOverwrite: <multiline string in the form of VARIABLE_NAME:value per line>
    tags: <if only a subset of your tests should be executed use this multiline string, with one tag per line>
```

By default the task will run a maximum duration of 2 hours before it will fail with a timeout.

## Change Log

- 2023-07-23: Added requirement for setting `testTargetId` to enable v2 API
- 2024-10-18: Added blocking parameter to allow blocking your pipeline until all tests have passed.
- 2024-10-30: Added environment name parameter to allow running your tests against a specified environment, uses the
  default environment if not specified.
- 2025-02-05: Added variablesToOverwrite parameter, we will use the provided variable values instead of the ones defined in the environment for this test run.
- 2025-02-19: Added tags parameter, we will only execute test cases that have at least one matching tag.

## Publishing notes

There is currently no way to publish without a personal access token. It currently is relying
on [Germandrummer92](https://github.com/Germandrummer92)'s PAT.
You currently need to bump both the task.json AND vss-extension.json versions to publish a new version.

TFX-cli does not support pnpm-style symlink-based node_module symlinks, see
also: <https://github.com/microsoft/tfs-cli/issues/265>
