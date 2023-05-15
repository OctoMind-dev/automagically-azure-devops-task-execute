import {
  TaskResult,
  getInputRequired,
  getVariable,
  setResult,
  getEndpointAuthorizationParameter
} from 'azure-pipelines-task-lib'
import fetch from 'node-fetch'

const AUTOMAGICALLY_BASE_URL = 'https://automagically-5vr3ysri3a-ey.a.run.app/'

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

    // https://github.com/microsoft/azure-pipelines-task-lib/issues/579
    const accessToken = getEndpointAuthorizationParameter(
      'SystemVssConnection',
      'AccessToken',
      false
    )

    // https://learn.microsoft.com/en-us/azure/devops/pipelines/build/variables
    const collectionUri = getVariable('System.TeamFoundationCollectionUri')
    const organization = collectionUri
      ? new URL(collectionUri).pathname.split('/').at(1)
      : undefined
    const project = getVariable('System.TeamProject')
    const repositoryId = getVariable('Build.Repository.ID')
    const pullRequestId = getVariable('System.PullRequest.PullRequestId')

    const response = await fetch(`${AUTOMAGICALLY_BASE_URL}/api/v1/execute`, {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        url,
        context: {
          source: 'azureDevOps',
          accessToken,
          organization,
          project,
          repositoryId,
          pullRequestId
        }
      }),
      method: 'POST'
    })

    if (!response.ok) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(
        `response not ok ${response.status}, body: ${await response.json()}`
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
