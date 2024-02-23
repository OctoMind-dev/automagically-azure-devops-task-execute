# automagically-azure-devops-execute

This is a Azure DevOps Task to execute your automagically-maintained e2e tests.
To use this task a token is required which you can generate in our [octomind app](https://app.octomind.dev).

See the [docs](https://octomind.dev/docs) for more details.

> drop us a note: contact@octomind.dev 🐙

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
```

## Change Log

- 2023-07-23: Added requirement for setting `testTargetId` to enable v2 API

## Publishing notes

There is currently no way to publish without a personal access token. It currently is relying
on [Germandrummer92](https://github.com/Germandrummer92)'s PAT.
You currently need to bump both the task.json AND vss-extension.json versions to publish a new version.

TFX-cli does not support pnpm-style symlink-based node_module symlinks, see
also: https://github.com/microsoft/tfs-cli/issues/265

