import {
  TaskResult,
  getInputRequired,
  getInput,
  debug,
  getVariable,
  setResult,
  warning,
  getEndpointAuthorizationParameter
} from 'azure-pipelines-task-lib'
import fetch from 'node-fetch'

const urlDefault = 'https://app.octomind.dev/'
const urlOverride = getInput('automagicallyUrl', false) ?? ''
const automagicallyUrl = urlOverride.length === 0 ? urlDefault : urlOverride
const executeUrl = `${automagicallyUrl}/api/v1/execute`

const run = async (): Promise<void> => {
  try {
    const url = getInputRequired('url')
    if (!url) {
      setResult(TaskResult.Failed, 'URL is required')
      return
    }

    const token = getInputRequired('token')
    if (!token) {
      setResult(TaskResult.Failed, 'token is required')
      return
    }

    // https://learn.microsoft.com/en-us/azure/devops/pipelines/build/variables
    const collectionUri = getVariable('System.TeamFoundationCollectionUri')

    const context = {
      organization: collectionUri
        ? new URL(collectionUri).pathname.split('/').at(1)
        : undefined,
      project: getVariable('System.TeamProject'),
      repositoryId: getVariable('Build.Repository.ID'),
      pullRequestId: getVariable('System.PullRequest.PullRequestId'),
      sha: getVariable('Build.SourceVersion'),
      ref: getVariable('Build.SourceBranch')
    }

    if (!context.pullRequestId) {
      warning(
        'System.PullRequest.PullRequestId variable not available. ' +
          'No PullRequestId available, make sure you run this task in a PR build validation pipeline ' +
          'if you want to see automatic comments with your test results'
      )
    }

    debug(JSON.stringify({executeUrl, context}, null, 2))

    // https://github.com/microsoft/azure-pipelines-task-lib/issues/579
    const accessToken = getEndpointAuthorizationParameter(
      'SystemVssConnection',
      'AccessToken',
      false
    )

    const response = await fetch(executeUrl, {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        url,
        context: {
          source: 'azureDevOps',
          accessToken,
          ...context
        }
      }),
      method: 'POST'
    })

    if (!response.ok) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(
        `response not ok ${response.status}, body: ${JSON.stringify({
          body: await response.json()
        })}`
      )
    }
  } catch (err) {
    setResult(
      TaskResult.Failed,
      err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof err.message === 'string'
        ? `unable to execute automagically: ${err.message}`
        : 'Unknown Error'
    )
  }
}

void run()
