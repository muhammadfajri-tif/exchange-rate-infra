#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { ExchangeRateInfraStack } from '../lib/exchange-rate-infra-stack'

const app = new cdk.App()
new ExchangeRateInfraStack(app, 'ExchangeRateInfraStack', {
  apiServiceConfig: {
    appEnv: 'dev',
    bucketName: '',
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION
    }
  }
});
